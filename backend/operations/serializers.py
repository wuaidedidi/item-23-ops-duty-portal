from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from operations.models import Alert, Asset, DutyRoster, FaultReport, InspectionTask, OperationLog


class ChoiceDisplayMixin(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        for field in getattr(self.Meta.model, "_meta").fields:
            if field.choices and field.name in data:
                data[f"{field.name}Label"] = getattr(instance, f"get_{field.name}_display")()
        return data


class AssetSerializer(ChoiceDisplayMixin):
    class Meta:
        model = Asset
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "last_inspection_at"]
        extra_kwargs = {
            "asset_code": {"error_messages": {"blank": "资产编号不能为空", "unique": "资产编号已存在"}},
            "name": {"error_messages": {"blank": "资产名称不能为空"}},
            "category": {"error_messages": {"blank": "资产类型不能为空"}},
            "location": {"error_messages": {"blank": "所在位置不能为空"}},
        }


class InspectionTaskSerializer(ChoiceDisplayMixin):
    assetName = serializers.CharField(source="asset.name", read_only=True)
    assetCode = serializers.CharField(source="asset.asset_code", read_only=True)
    inspectorName = serializers.CharField(source="inspector.display_name", read_only=True)
    createdByName = serializers.CharField(source="created_by.display_name", read_only=True)

    class Meta:
        model = InspectionTask
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "completed_at", "created_by", "result", "result_summary", "exception_note"]
        extra_kwargs = {
            "task_no": {"error_messages": {"blank": "任务编号不能为空", "unique": "任务编号已存在"}},
            "title": {"error_messages": {"blank": "任务标题不能为空"}},
        }


class InspectionSubmitSerializer(serializers.Serializer):
    result = serializers.ChoiceField(choices=["normal", "abnormal"], error_messages={"invalid_choice": "巡检结果不正确"})
    result_summary = serializers.CharField(max_length=1000, allow_blank=True, required=False)
    exception_note = serializers.CharField(max_length=1000, allow_blank=True, required=False)

    def validate(self, attrs):
        if attrs.get("result") == "abnormal" and not attrs.get("exception_note"):
            raise serializers.ValidationError("异常巡检必须填写异常说明")
        return attrs


class FaultReportSerializer(ChoiceDisplayMixin):
    assetName = serializers.CharField(source="asset.name", read_only=True)
    assetCode = serializers.CharField(source="asset.asset_code", read_only=True)
    taskNo = serializers.CharField(source="task.task_no", read_only=True)
    reporterName = serializers.CharField(source="reporter.display_name", read_only=True)

    class Meta:
        model = FaultReport
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "closed_at", "reporter"]
        extra_kwargs = {
            "report_no": {"error_messages": {"blank": "故障编号不能为空", "unique": "故障编号已存在"}},
            "title": {"error_messages": {"blank": "故障标题不能为空"}},
            "description": {"error_messages": {"blank": "故障描述不能为空"}},
        }


class FaultCloseSerializer(serializers.Serializer):
    solution = serializers.CharField(max_length=1000, error_messages={"blank": "关闭故障必须填写处理方案"})


class DutyRosterSerializer(ChoiceDisplayMixin):
    dutyUserName = serializers.CharField(source="duty_user.display_name", read_only=True)
    dutyUserRole = serializers.CharField(source="duty_user.get_role_display", read_only=True)

    class Meta:
        model = DutyRoster
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class AlertSerializer(ChoiceDisplayMixin):
    assetName = serializers.CharField(source="asset.name", read_only=True)
    taskNo = serializers.CharField(source="task.task_no", read_only=True)
    handledByName = serializers.CharField(source="handled_by.display_name", read_only=True)

    class Meta:
        model = Alert
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "handled_by", "handled_at"]
        extra_kwargs = {
            "title": {"error_messages": {"blank": "告警标题不能为空"}},
            "content": {"error_messages": {"blank": "告警内容不能为空"}},
        }


class AlertHandleSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["processing", "closed"], error_messages={"invalid_choice": "告警处理状态不正确"})
    handling_note = serializers.CharField(max_length=1000, allow_blank=True, required=False)

    def validate(self, attrs):
        if attrs["status"] == "closed" and not attrs.get("handling_note"):
            raise serializers.ValidationError("关闭告警必须填写处理说明")
        return attrs


class OperationLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    displayName = serializers.CharField(source="user.display_name", read_only=True)

    class Meta:
        model = OperationLog
        fields = "__all__"


class UserLookupSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = ["id", "username", "display_name", "role", "label"]

    def get_label(self, obj):
        return f"{obj.display_name or obj.username} · {obj.get_role_display()}"
