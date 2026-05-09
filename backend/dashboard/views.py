from datetime import timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from common.responses import ok
from operations.models import Alert, Asset, DutyRoster, FaultReport, InspectionTask


class MetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        total_faults = FaultReport.objects.count()
        closed_faults = FaultReport.objects.filter(status="closed").count()
        total_assets = Asset.objects.count()
        normal_assets = Asset.objects.filter(status="normal").count()

        days = [today - timedelta(days=i) for i in range(6, -1, -1)]
        inspection_map = {
            item["day"]: item["count"]
            for item in InspectionTask.objects.filter(completed_at__date__in=days)
            .values(day=models_date("completed_at"))
            .annotate(count=Count("id"))
        }
        alert_map = {
            item["day"]: item["count"]
            for item in Alert.objects.filter(created_at__date__in=days)
            .values(day=models_date("created_at"))
            .annotate(count=Count("id"))
        }

        payload = {
            "todayInspections": InspectionTask.objects.filter(completed_at__date=today).count(),
            "openAlerts": Alert.objects.exclude(status="closed").count(),
            "onlineDutyUsers": DutyRoster.objects.filter(duty_date=today, status="on_duty").values("duty_user").distinct().count(),
            "faultCloseRate": round((closed_faults / total_faults) * 100, 1) if total_faults else 0,
            "assetNormalRate": round((normal_assets / total_assets) * 100, 1) if total_assets else 0,
            "pendingTasks": InspectionTask.objects.filter(status__in=["pending", "in_progress", "overdue"]).count(),
            "assetStatus": list(Asset.objects.values("status").annotate(count=Count("id")).order_by("status")),
            "trend": [
                {
                    "date": day.strftime("%m-%d"),
                    "inspection": inspection_map.get(day, 0),
                    "alert": alert_map.get(day, 0),
                }
                for day in days
            ],
            "latestAlerts": list(Alert.objects.select_related("asset").values("id", "title", "level", "status", "asset__name", "created_at")[:5]),
            "recentTasks": list(InspectionTask.objects.select_related("asset").values("id", "task_no", "title", "status", "result", "asset__name", "scheduled_date")[:5]),
        }
        return ok(payload)


def models_date(field_name):
    from django.db.models.functions import TruncDate

    return TruncDate(field_name)
