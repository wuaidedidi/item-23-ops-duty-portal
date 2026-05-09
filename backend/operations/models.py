from django.conf import settings
from django.db import models


class TimestampedModel(models.Model):
    created_at = models.DateTimeField("创建时间", auto_now_add=True)
    updated_at = models.DateTimeField("更新时间", auto_now=True)

    class Meta:
        abstract = True


class Asset(TimestampedModel):
    STATUS_CHOICES = (
        ("normal", "正常"),
        ("warning", "预警"),
        ("fault", "故障"),
        ("offline", "离线"),
    )

    asset_code = models.CharField("资产编号", max_length=64, unique=True)
    name = models.CharField("资产名称", max_length=120)
    category = models.CharField("资产类型", max_length=80)
    location = models.CharField("所在位置", max_length=120)
    owner = models.CharField("责任人", max_length=80, blank=True)
    status = models.CharField("运行状态", max_length=32, choices=STATUS_CHOICES, default="normal")
    last_inspection_at = models.DateTimeField("最近巡检时间", null=True, blank=True)
    remark = models.TextField("备注", blank=True)

    class Meta:
        db_table = "assets"
        ordering = ["asset_code"]

    def __str__(self):
        return f"{self.asset_code} {self.name}"


class InspectionTask(TimestampedModel):
    STATUS_CHOICES = (
        ("pending", "待执行"),
        ("in_progress", "执行中"),
        ("completed", "已完成"),
        ("overdue", "已逾期"),
    )

    RESULT_CHOICES = (
        ("unchecked", "未提交"),
        ("normal", "正常"),
        ("abnormal", "异常"),
    )

    task_no = models.CharField("任务编号", max_length=64, unique=True)
    title = models.CharField("任务标题", max_length=160)
    asset = models.ForeignKey(Asset, on_delete=models.PROTECT, related_name="inspection_tasks")
    inspector = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="inspection_tasks")
    scheduled_date = models.DateField("计划日期")
    status = models.CharField("任务状态", max_length=32, choices=STATUS_CHOICES, default="pending")
    result = models.CharField("巡检结果", max_length=32, choices=RESULT_CHOICES, default="unchecked")
    result_summary = models.TextField("结果说明", blank=True)
    exception_note = models.TextField("异常说明", blank=True)
    completed_at = models.DateTimeField("完成时间", null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_inspection_tasks")

    class Meta:
        db_table = "inspection_tasks"
        ordering = ["-scheduled_date", "-created_at"]

    def __str__(self):
        return self.task_no


class FaultReport(TimestampedModel):
    SEVERITY_CHOICES = (
        ("low", "低"),
        ("medium", "中"),
        ("high", "高"),
        ("critical", "严重"),
    )
    STATUS_CHOICES = (
        ("open", "待处理"),
        ("processing", "处理中"),
        ("closed", "已关闭"),
    )

    report_no = models.CharField("故障编号", max_length=64, unique=True)
    title = models.CharField("故障标题", max_length=160)
    asset = models.ForeignKey(Asset, on_delete=models.PROTECT, related_name="fault_reports")
    task = models.ForeignKey(InspectionTask, on_delete=models.SET_NULL, null=True, blank=True, related_name="fault_reports")
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="fault_reports")
    severity = models.CharField("严重程度", max_length=32, choices=SEVERITY_CHOICES, default="medium")
    status = models.CharField("处理状态", max_length=32, choices=STATUS_CHOICES, default="open")
    description = models.TextField("故障描述")
    solution = models.TextField("处理方案", blank=True)
    closed_at = models.DateTimeField("关闭时间", null=True, blank=True)

    class Meta:
        db_table = "fault_reports"
        ordering = ["-created_at"]

    def __str__(self):
        return self.report_no


class DutyRoster(TimestampedModel):
    STATUS_CHOICES = (
        ("scheduled", "已排班"),
        ("on_duty", "值班中"),
        ("off_duty", "已交班"),
    )

    duty_date = models.DateField("值班日期")
    shift_name = models.CharField("班次", max_length=80)
    duty_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="duty_rosters")
    status = models.CharField("值班状态", max_length=32, choices=STATUS_CHOICES, default="scheduled")
    notes = models.TextField("值班记录", blank=True)

    class Meta:
        db_table = "duty_rosters"
        ordering = ["-duty_date", "shift_name"]
        unique_together = ("duty_date", "shift_name", "duty_user")

    def __str__(self):
        return f"{self.duty_date} {self.shift_name}"


class Alert(TimestampedModel):
    LEVEL_CHOICES = (
        ("info", "提示"),
        ("warning", "预警"),
        ("critical", "严重"),
    )
    STATUS_CHOICES = (
        ("pending", "待处理"),
        ("processing", "处理中"),
        ("closed", "已关闭"),
    )

    title = models.CharField("告警标题", max_length=160)
    source_type = models.CharField("来源类型", max_length=80, default="巡检异常")
    asset = models.ForeignKey(Asset, on_delete=models.PROTECT, null=True, blank=True, related_name="alerts")
    task = models.ForeignKey(InspectionTask, on_delete=models.SET_NULL, null=True, blank=True, related_name="alerts")
    level = models.CharField("告警级别", max_length=32, choices=LEVEL_CHOICES, default="warning")
    status = models.CharField("处理状态", max_length=32, choices=STATUS_CHOICES, default="pending")
    content = models.TextField("告警内容")
    handled_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name="handled_alerts")
    handled_at = models.DateTimeField("处理时间", null=True, blank=True)
    handling_note = models.TextField("处理说明", blank=True)

    class Meta:
        db_table = "alerts"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class OperationLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="operation_logs")
    module = models.CharField("模块", max_length=80)
    action = models.CharField("动作", max_length=80)
    target_type = models.CharField("对象类型", max_length=80, blank=True)
    target_id = models.CharField("对象ID", max_length=80, blank=True)
    detail = models.TextField("详情", blank=True)
    ip_address = models.GenericIPAddressField("IP 地址", null=True, blank=True)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)

    class Meta:
        db_table = "operation_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.module} {self.action}"
