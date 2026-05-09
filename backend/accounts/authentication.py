import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

from accounts.models import LoginSession


class JWTAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        header = authentication.get_authorization_header(request).decode("utf-8")
        if not header:
            return None

        parts = header.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            raise AuthenticationFailed("登录已过期，请重新登录")

        try:
            payload = jwt.decode(parts[1], settings.JWT_SECRET_KEY, algorithms=["HS256"])
            user_id = int(payload.get("sub"))
            jti = payload.get("jti")
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, TypeError, ValueError):
            raise AuthenticationFailed("登录已过期，请重新登录")

        User = get_user_model()
        try:
            user = User.objects.get(id=user_id, is_active=True)
            LoginSession.objects.get(token_jti=jti, user=user, is_active=True, expires_at__gt=timezone.now())
        except (User.DoesNotExist, LoginSession.DoesNotExist):
            raise AuthenticationFailed("登录已过期，请重新登录")

        user.last_seen_at = timezone.now()
        user.save(update_fields=["last_seen_at"])
        return user, payload
