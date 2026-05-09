from django.utils import timezone

from operations.models import Alert, FaultReport, OperationLog


def get_ip(request):
    value = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", ""))
    return value.split(",")[0] or None


def write_log(request, module, action, target=None, detail=""):
    OperationLog.objects.create(
        user=request.user if request.user and request.user.is_authenticated else None,
        module=module,
        action=action,
        target_type=target.__class__.__name__ if target else "",
        target_id=str(getattr(target, "id", "")) if target else "",
        detail=detail,
        ip_address=get_ip(request),
    )


def create_alert_from_inspection(task, request):
    return Alert.objects.create(
        title=f"{task.asset.name} 巡检异常",
        source_type="巡检异常",
        asset=task.asset,
        task=task,
        level="critical" if task.asset.status == "fault" else "warning",
        status="pending",
        content=task.exception_note or task.result_summary or "巡检结果异常，请及时处理。",
    )


def create_fault_from_inspection(task, request):
    return FaultReport.objects.create(
        report_no=f"FR-{timezone.now().strftime('%Y%m%d%H%M%S')}-{task.id}",
        title=f"{task.asset.name} 巡检异常故障",
        asset=task.asset,
        task=task,
        reporter=request.user,
        severity="high",
        status="open",
        description=task.exception_note or "巡检异常自动生成故障登记。",
    )
