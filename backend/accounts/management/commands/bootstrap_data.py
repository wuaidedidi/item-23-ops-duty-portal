from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from operations.models import Alert, Asset, DutyRoster, FaultReport, InspectionTask, OperationLog


class Command(BaseCommand):
    help = "初始化管理员账号和演示数据"

    def handle(self, *args, **options):
        User = get_user_model()
        admin, _ = User.objects.get_or_create(username="admin", defaults={"display_name": "系统管理员", "role": "admin", "is_staff": True, "is_superuser": True})
        admin.display_name = "系统管理员"
        admin.role = "admin"
        admin.is_active = True
        admin.is_staff = True
        admin.is_superuser = True
        if not admin.check_password("123456"):
            admin.set_password("123456")
        admin.save()

        engineer = self.ensure_user(User, "engineer", "运维工程师", "engineer")
        duty = self.ensure_user(User, "duty", "值班员", "duty")
        viewer = self.ensure_user(User, "viewer", "查看人员", "viewer")

        self.seed_assets()
        self.sync_tasks(admin, engineer, duty)
        self.sync_faults(duty)
        self.sync_duty(engineer, duty, viewer)
        self.sync_alerts(engineer)

        if OperationLog.objects.count() == 0:
            OperationLog.objects.create(user=admin, module="系统初始化", action="创建演示数据", detail="首次启动自动初始化账号和业务数据")

        self.stdout.write(self.style.SUCCESS("初始化完成：admin / 123456 可登录"))

    def ensure_user(self, User, username, display_name, role):
        user, _ = User.objects.get_or_create(username=username, defaults={"display_name": display_name, "role": role, "is_active": True})
        user.display_name = display_name
        user.role = role
        user.is_active = True
        user.email = f"{username}@ops.local"
        if not user.check_password("123456"):
            user.set_password("123456")
        user.save()
        return user

    def seed_assets(self):
        rows = [
            ("SRV-APP-001", "核心应用服务器", "服务器", "主机房 A01", "李工", "normal"),
            ("DB-MYSQL-001", "MySQL 主库", "数据库", "主机房 B02", "王工", "warning"),
            ("NET-SW-003", "汇聚交换机", "网络设备", "网络间 N03", "赵工", "normal"),
            ("UPS-POWER-002", "UPS 电源柜", "动力设备", "配电室 P02", "陈工", "normal"),
            ("STO-NAS-006", "巡检日志存储", "存储设备", "主机房 C06", "孙工", "fault"),
        ]
        for code, name, category, location, owner, status in rows:
            Asset.objects.update_or_create(
                asset_code=code,
                defaults={"name": name, "category": category, "location": location, "owner": owner, "status": status},
            )

    def sync_tasks(self, admin, engineer, duty):
        today = timezone.localdate()
        assets = {asset.asset_code: asset for asset in Asset.objects.all()}
        rows = [
            ("INS-20260509-001", "核心应用服务器日巡检", assets["SRV-APP-001"], duty, today, "pending", "unchecked"),
            ("INS-20260509-002", "数据库主库健康巡检", assets["DB-MYSQL-001"], engineer, today, "completed", "abnormal"),
            ("INS-20260508-001", "网络汇聚设备巡检", assets["NET-SW-003"], duty, today - timedelta(days=1), "completed", "normal"),
            ("INS-20260510-001", "UPS 电源巡检", assets["UPS-POWER-002"], engineer, today + timedelta(days=1), "pending", "unchecked"),
        ]
        for task_no, title, asset, inspector, scheduled_date, status, result in rows:
            completed_at = timezone.now() - timedelta(hours=3) if status == "completed" else None
            if result == "normal":
                result_summary = "巡检项已核对，指标在安全范围内。"
            elif result == "abnormal":
                result_summary = "数据库复制延迟高于阈值。"
            else:
                result_summary = "巡检任务待执行。"
            InspectionTask.objects.update_or_create(
                task_no=task_no,
                defaults={
                    "title": title,
                    "asset": asset,
                    "inspector": inspector,
                    "scheduled_date": scheduled_date,
                    "status": status,
                    "result": result,
                    "result_summary": result_summary,
                    "exception_note": "主库复制延迟达到 12 秒，已记录告警。" if result == "abnormal" else "",
                    "completed_at": completed_at,
                    "created_by": admin,
                },
            )
            if completed_at:
                asset.last_inspection_at = completed_at
                asset.save(update_fields=["last_inspection_at"])

    def sync_faults(self, reporter):
        asset = Asset.objects.get(asset_code="STO-NAS-006")
        FaultReport.objects.update_or_create(
            report_no="FR-20260509-001",
            defaults={
                "title": "巡检日志存储 IO 延迟异常",
                "asset": asset,
                "reporter": reporter,
                "severity": "high",
                "status": "processing",
                "description": "日志存储读写延迟持续升高，影响巡检附件归档。",
                "solution": "已迁移部分历史附件，等待存储扩容窗口。",
            },
        )

    def sync_duty(self, engineer, duty, viewer):
        today = timezone.localdate()
        DutyRoster.objects.update_or_create(
            duty_date=today,
            shift_name="白班",
            duty_user=duty,
            defaults={"status": "on_duty", "notes": "已完成班前设备状态确认。"},
        )
        DutyRoster.objects.update_or_create(
            duty_date=today,
            shift_name="夜班",
            duty_user=engineer,
            defaults={"status": "scheduled", "notes": "重点关注数据库复制延迟。"},
        )
        DutyRoster.objects.update_or_create(
            duty_date=today - timedelta(days=1),
            shift_name="白班",
            duty_user=viewer,
            defaults={"status": "off_duty", "notes": "交班无遗留阻断事项。"},
        )

    def sync_alerts(self, engineer):
        task = InspectionTask.objects.get(task_no="INS-20260509-002")
        Alert.objects.update_or_create(
            title="MySQL 主库复制延迟预警",
            defaults={
                "source_type": "巡检异常",
                "asset": Asset.objects.get(asset_code="DB-MYSQL-001"),
                "task": task,
                "level": "warning",
                "status": "processing",
                "content": "巡检发现主库复制延迟高于阈值，请运维工程师持续观察并处理。",
                "handled_by": engineer,
                "handled_at": timezone.now() - timedelta(hours=1),
                "handling_note": "已调整同步任务优先级，继续观察。",
            },
        )
        Alert.objects.update_or_create(
            title="巡检日志存储 IO 延迟严重",
            defaults={
                "source_type": "故障登记",
                "asset": Asset.objects.get(asset_code="STO-NAS-006"),
                "level": "critical",
                "status": "pending",
                "content": "存储设备延迟升高，可能影响附件归档。",
            },
        )
