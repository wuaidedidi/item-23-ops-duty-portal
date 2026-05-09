from rest_framework.permissions import BasePermission


class IsAuthenticatedRole(BasePermission):
    write_roles = {"admin", "engineer", "duty"}

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return request.user.role in self.write_roles


def has_role(user, *roles):
    return bool(user and user.is_authenticated and (user.role == "admin" or user.role in roles))
