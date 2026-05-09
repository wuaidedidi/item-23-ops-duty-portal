from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from accounts.models import LoginSession
from accounts.serializers import LoginSerializer, ProfileUpdateSerializer, RegisterSerializer, UserSerializer
from common.responses import ok


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return ok(UserSerializer(user).data, "注册成功，请等待管理员分配权限")


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return ok(serializer.create_token(request), "登录成功")


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.auth or {}
        jti = token.get("jti")
        if jti:
            LoginSession.objects.filter(token_jti=jti, user=request.user).update(is_active=False)
        return ok(None, "已退出登录")


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return ok(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return ok(UserSerializer(user).data, "个人资料已更新")
