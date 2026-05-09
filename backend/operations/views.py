from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from common.pagination import StandardPagination
from common.permissions import has_role
from common.responses import fail, ok
from operations.models import Alert, Asset, DutyRoster, FaultReport, InspectionTask, OperationLog
from operations.serializers import (
    AlertHandleSerializer,
    AlertSerializer,
    AssetSerializer,
    DutyRosterSerializer,
    FaultCloseSerializer,
    FaultReportSerializer,
    InspectionSubmitSerializer,
    InspectionTaskSerializer,
    OperationLogSerializer,
    UserLookupSerializer,
)
from operations.services import create_alert_from_inspection, create_fault_from_inspection, write_log


class BasePortalViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    search_fields = []
    write_roles = {"admin", "engineer", "duty"}
    module_name = ""

    def check_write_permission(self):
        if self.request.method not in ("GET", "HEAD", "OPTIONS") and self.request.user.role not in self.write_roles:
            raise PermissionDenied("当前账号无权执行该操作")

    def get_queryset(self):
        queryset = super().get_queryset()
        q = self.request.query_params.get("q", "").strip()
        if q and self.search_fields:
            query = Q()
            for field in self.search_fields:
                query |= Q(**{f"{field}__icontains": q})
            queryset = queryset.filter(query)
        status_value = self.request.query_params.get("status", "").strip()
        if status_value and hasattr(queryset.model, "status"):
            queryset = queryset.filter(status=status_value)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return ok(self.paginator.get_payload(serializer.data))

    def create(self, request, *args, **kwargs):
        self.check_write_permission()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        write_log(request, self.module_name, "新增", serializer.instance, f"新增 {serializer.instance}")
        return ok(serializer.data, "新增成功", status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        self.check_write_permission()
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        write_log(request, self.module_name, "更新", instance, f"更新 {instance}")
        return ok(serializer.data, "更新成功")

    def destroy(self, request, *args, **kwargs):
        self.check_write_permission()
        instance = self.get_object()
        label = str(instance)
        self.perform_destroy(instance)
        write_log(request, self.module_name, "删除", instance, f"删除 {label}")
        return ok(None, "删除成功")


class AssetViewSet(BasePortalViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    search_fields = ["asset_code", "name", "category", "location", "owner"]
    write_roles = {"admin", "engineer"}
    module_name = "资产台账"

    def destroy(self, request, *args, **kwargs):
        self.check_write_permission()
        instance = self.get_object()
        tasks = instance.inspection_tasks.count()
        faults = instance.fault_reports.count()
        alerts = instance.alerts.count()
        if tasks or faults or alerts:
            return fail(f"该资产已有 {tasks} 条巡检、{faults} 条故障和 {alerts} 条告警，无法删除", code=409, status=409)
        return super().destroy(request, *args, **kwargs)


class InspectionTaskViewSet(BasePortalViewSet):
    queryset = InspectionTask.objects.select_related("asset", "inspector", "created_by")
    serializer_class = InspectionTaskSerializer
    search_fields = ["task_no", "title", "asset__name", "asset__asset_code", "inspector__display_name"]
    write_roles = {"admin", "engineer", "duty"}
    module_name = "巡检任务"

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        if not has_role(request.user, "engineer", "duty"):
            raise PermissionDenied("当前账号无权提交巡检结果")
        task = self.get_object()
        serializer = InspectionSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        task.result = data["result"]
        task.result_summary = data.get("result_summary", "")
        task.exception_note = data.get("exception_note", "")
        task.status = "completed"
        task.completed_at = timezone.now()
        task.asset.last_inspection_at = task.completed_at
        task.asset.status = "normal" if task.result == "normal" else "warning"
        task.asset.save(update_fields=["last_inspection_at", "status", "updated_at"])
        task.save(update_fields=["result", "result_summary", "exception_note", "status", "completed_at", "updated_at"])
        write_log(request, "巡检任务", "提交结果", task, task.result_summary or task.exception_note)
        extra = {}
        if task.result == "abnormal":
            alert = create_alert_from_inspection(task, request)
            fault = create_fault_from_inspection(task, request)
            write_log(request, "告警通知", "自动生成", alert, "巡检异常生成告警")
            write_log(request, "故障登记", "自动生成", fault, "巡检异常生成故障")
            extra = {"alertId": alert.id, "faultId": fault.id}
        return ok({"task": InspectionTaskSerializer(task).data, **extra}, "巡检结果已提交")


class FaultReportViewSet(BasePortalViewSet):
    queryset = FaultReport.objects.select_related("asset", "task", "reporter")
    serializer_class = FaultReportSerializer
    search_fields = ["report_no", "title", "asset__name", "asset__asset_code", "description"]
    write_roles = {"admin", "engineer", "duty"}
    module_name = "故障登记"

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        if not has_role(request.user, "engineer"):
            raise PermissionDenied("当前账号无权关闭故障")
        fault = self.get_object()
        serializer = FaultCloseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        fault.solution = serializer.validated_data["solution"]
        fault.status = "closed"
        fault.closed_at = timezone.now()
        fault.asset.status = "normal"
        fault.asset.save(update_fields=["status", "updated_at"])
        fault.save(update_fields=["solution", "status", "closed_at", "updated_at"])
        write_log(request, "故障登记", "关闭", fault, fault.solution)
        return ok(FaultReportSerializer(fault).data, "故障已关闭")


class DutyRosterViewSet(BasePortalViewSet):
    queryset = DutyRoster.objects.select_related("duty_user")
    serializer_class = DutyRosterSerializer
    search_fields = ["shift_name", "duty_user__display_name", "notes"]
    write_roles = {"admin", "engineer", "duty"}
    module_name = "值班记录"


class AlertViewSet(BasePortalViewSet):
    queryset = Alert.objects.select_related("asset", "task", "handled_by")
    serializer_class = AlertSerializer
    search_fields = ["title", "content", "asset__name", "asset__asset_code", "source_type"]
    write_roles = {"admin", "engineer", "duty"}
    module_name = "告警通知"

    @action(detail=True, methods=["post"])
    def handle(self, request, pk=None):
        if not has_role(request.user, "engineer"):
            raise PermissionDenied("当前账号无权处理告警")
        alert = self.get_object()
        serializer = AlertHandleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        alert.status = serializer.validated_data["status"]
        alert.handling_note = serializer.validated_data.get("handling_note", "")
        alert.handled_by = request.user
        alert.handled_at = timezone.now()
        alert.save(update_fields=["status", "handling_note", "handled_by", "handled_at", "updated_at"])
        write_log(request, "告警通知", "处理", alert, alert.handling_note)
        return ok(AlertSerializer(alert).data, "告警处理已记录")


class OperationLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = OperationLog.objects.select_related("user")
    serializer_class = OperationLogSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        q = self.request.query_params.get("q", "").strip()
        if q:
            queryset = queryset.filter(Q(module__icontains=q) | Q(action__icontains=q) | Q(detail__icontains=q) | Q(user__username__icontains=q))
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return ok(self.paginator.get_payload(serializer.data))


class UserLookupViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        role = request.query_params.get("role", "")
        queryset = get_user_model().objects.filter(is_active=True).order_by("role", "username")
        if role:
            queryset = queryset.filter(role=role)
        return ok(UserLookupSerializer(queryset, many=True).data)
