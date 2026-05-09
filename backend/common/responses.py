from rest_framework.response import Response


def ok(data=None, message="操作成功", status=200):
    return Response({"code": 200, "message": message, "data": data}, status=status)


def fail(message="操作失败", code=400, status=400, data=None):
    return Response({"code": code, "message": message, "data": data}, status=status)
