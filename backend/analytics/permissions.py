from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Allows access only to users with the admin role (or superusers)."""
    message = 'Administrator access required.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.role == 'admin' or user.is_superuser))