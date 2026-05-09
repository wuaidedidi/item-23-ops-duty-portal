import time

from django.core.management.base import BaseCommand
from django.db import connections
from django.db.utils import OperationalError


class Command(BaseCommand):
    help = "等待数据库可用"

    def handle(self, *args, **options):
        self.stdout.write("等待数据库可用...")
        for attempt in range(1, 61):
            try:
                connections["default"].ensure_connection()
                self.stdout.write(self.style.SUCCESS("数据库已就绪"))
                return
            except OperationalError:
                self.stdout.write(f"数据库尚未就绪，重试 {attempt}/60")
                time.sleep(2)
        raise OperationalError("数据库启动超时")
