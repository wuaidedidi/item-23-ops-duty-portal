import re
import uuid
from datetime import datetime, timezone as dt_timezone

import jwt
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone
from rest_framework import serializers

from accounts.models import LoginSession


PHONE_RE = re.compile(r"^1[3-9]\d{9}$")


def validate_optional_phone(value):
    if value and not PHONE_RE.match(value):
        raise serializers.ValidationError("手机号格式不正确")
    return value


class UserSerializer(serializers.ModelSerializer):
    roleLabel = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = get_user_model()
        fields = ["id", "username", "display_name", "email", "phone", "department", "role", "roleLabel", "is_active"]
        read_only_fields = ["id", "username", "role", "roleLabel", "is_active"]


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=60, error_messages={"blank": "用户名不能为空"})
    password = serializers.CharField(min_length=6, max_length=128, write_only=True, error_messages={"min_length": "密码至少需要 6 位"})
    display_name = serializers.CharField(max_length=80, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True, error_messages={"invalid": "邮箱格式不正确"})
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True)

    def validate_username(self, value):
        if get_user_model().objects.filter(username=value).exists():
            raise serializers.ValidationError("用户名已存在")
        return value

    def validate_phone(self, value):
        return validate_optional_phone(value)

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = get_user_model()(role="viewer", is_active=True, **validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(error_messages={"blank": "用户名不能为空"})
    password = serializers.CharField(write_only=True, error_messages={"blank": "密码不能为空"})

    def validate(self, attrs):
        user = authenticate(username=attrs["username"], password=attrs["password"])
        if not user or not user.is_active:
            raise serializers.ValidationError("用户名或密码不正确")
        attrs["user"] = user
        return attrs

    def create_token(self, request):
        user = self.validated_data["user"]
        expires_at = timezone.now() + settings.JWT_EXPIRES_DELTA
        token_jti = uuid.uuid4().hex
        ip_address = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", "")).split(",")[0]
        session = LoginSession.objects.create(
            user=user,
            token_jti=token_jti,
            ip_address=ip_address or None,
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:255],
            expires_at=expires_at,
        )
        payload = {
            "sub": str(user.id),
            "jti": session.token_jti,
            "role": user.role,
            "exp": datetime.fromtimestamp(expires_at.timestamp(), tz=dt_timezone.utc),
        }
        token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")
        user.last_login = timezone.now()
        user.last_seen_at = timezone.now()
        user.save(update_fields=["last_login", "last_seen_at"])
        return {"token": token, "expiresAt": expires_at, "user": UserSerializer(user).data}


class ProfileUpdateSerializer(serializers.ModelSerializer):
    new_password = serializers.CharField(write_only=True, min_length=6, required=False, allow_blank=True, error_messages={"min_length": "新密码至少需要 6 位"})

    class Meta:
        model = get_user_model()
        fields = ["display_name", "email", "phone", "department", "new_password"]
        extra_kwargs = {
            "email": {"required": False, "allow_blank": True, "error_messages": {"invalid": "邮箱格式不正确"}},
            "phone": {"required": False, "allow_blank": True},
            "display_name": {"required": False, "allow_blank": True},
            "department": {"required": False, "allow_blank": True},
        }

    def validate_phone(self, value):
        return validate_optional_phone(value)

    def update(self, instance, validated_data):
        new_password = validated_data.pop("new_password", "")
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if new_password:
            instance.set_password(new_password)
        instance.save()
        return instance
