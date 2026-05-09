from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_ADMIN = "admin"
    ROLE_ENGINEER = "engineer"
    ROLE_DUTY = "duty"
    ROLE_VIEWER = "viewer"

    ROLE_CHOICES = (
        (ROLE_ADMIN, "系统管理员"),
        (ROLE_ENGINEER, "运维工程师"),
        (ROLE_DUTY, "值班员"),
        (ROLE_VIEWER, "查看人员"),
    )

    role = models.CharField("角色", max_length=32, choices=ROLE_CHOICES, default=ROLE_VIEWER)
    display_name = models.CharField("姓名", max_length=80, blank=True)
    phone = models.CharField("手机号", max_length=32, blank=True)
    department = models.CharField("部门", max_length=80, blank=True)
    last_seen_at = models.DateTimeField("最近在线时间", null=True, blank=True)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)
    updated_at = models.DateTimeField("更新时间", auto_now=True)

    class Meta:
        db_table = "users"
        verbose_name = "用户"
        verbose_name_plural = "用户"

    def __str__(self):
        return self.display_name or self.username


class LoginSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="login_sessions")
    token_jti = models.CharField("令牌标识", max_length=64, unique=True)
    ip_address = models.GenericIPAddressField("IP 地址", null=True, blank=True)
    user_agent = models.CharField("客户端", max_length=255, blank=True)
    login_at = models.DateTimeField("登录时间", auto_now_add=True)
    expires_at = models.DateTimeField("过期时间")
    is_active = models.BooleanField("是否有效", default=True)

    class Meta:
        db_table = "login_sessions"
        ordering = ["-login_at"]
        verbose_name = "登录会话"
        verbose_name_plural = "登录会话"

    def __str__(self):
        return f"{self.user.username} - {self.token_jti}"
