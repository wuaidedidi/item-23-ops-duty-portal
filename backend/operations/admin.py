from django.contrib import admin

from operations.models import Alert, Asset, DutyRoster, FaultReport, InspectionTask, OperationLog


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ("asset_code", "name", "category", "location", "status", "last_inspection_at")
    search_fields = ("asset_code", "name", "location")
    list_filter = ("status", "category")


@admin.register(InspectionTask)
class InspectionTaskAdmin(admin.ModelAdmin):
    list_display = ("task_no", "title", "asset", "inspector", "scheduled_date", "status", "result")
    list_filter = ("status", "result", "scheduled_date")


@admin.register(FaultReport)
class FaultReportAdmin(admin.ModelAdmin):
    list_display = ("report_no", "title", "asset", "severity", "status", "reporter", "created_at")
    list_filter = ("severity", "status")


@admin.register(DutyRoster)
class DutyRosterAdmin(admin.ModelAdmin):
    list_display = ("duty_date", "shift_name", "duty_user", "status")
    list_filter = ("status", "duty_date")


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ("title", "level", "status", "asset", "handled_by", "created_at")
    list_filter = ("level", "status")


@admin.register(OperationLog)
class OperationLogAdmin(admin.ModelAdmin):
    list_display = ("module", "action", "user", "created_at", "ip_address")
    list_filter = ("module", "action")
