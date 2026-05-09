import logging

from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status
from rest_framework.exceptions import APIException, AuthenticationFailed, NotAuthenticated, PermissionDenied, ValidationError
from rest_framework.views import exception_handler

from common.responses import fail


logger = logging.getLogger(__name__)


def _extract_message(detail):
    if isinstance(detail, list) and detail:
        return _extract_message(detail[0])
    if isinstance(detail, dict):
        first_value = next(iter(detail.values()), None)
        return _extract_message(first_value)
    if detail:
        return str(detail)
    return "请求参数不正确"


def api_exception_handler(exc, context):
    if isinstance(exc, ValidationError):
        return fail(_extract_message(exc.detail), code=422, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    if isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        return fail("登录已过期，请重新登录", code=401, status=status.HTTP_401_UNAUTHORIZED)

    if isinstance(exc, PermissionDenied):
        return fail("当前账号无权执行该操作", code=403, status=status.HTTP_403_FORBIDDEN)

    if isinstance(exc, ObjectDoesNotExist):
        return fail("记录不存在或已被删除", code=404, status=status.HTTP_404_NOT_FOUND)

    response = exception_handler(exc, context)
    if response is not None:
        message = getattr(exc, "detail", None)
        if isinstance(exc, APIException):
            message = _extract_message(message)
        return fail(message or "请求处理失败", code=response.status_code, status=response.status_code)

    logger.exception("Unhandled API error: %s", exc)
    return fail("服务器错误，请稍后重试", code=500, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
