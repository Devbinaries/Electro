from rest_framework.permissions import BasePermission
from .models import UserRole

def has_role(user, roles):
    return (user.is_authenticated and hasattr(user, "role") and user.role in roles)

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return(
            request.user.is_authenticated and request.user.role == "ADMIN"
        )
class IsElectoralOfficer(BasePermission):
    def has_permission(self, request, view):
        return has_role(
            request.user,
            [UserRole.ELECTORAL_OFFICER]
        )
        
        
class IsAuditor(BasePermission):
    def has_permission(self, request, view):
        return has_role(
            request.user, [UserRole.AUDITOR, UserRole.ADMIN]
        )
        
class IsInternalStaff(BasePermission):
    def has_permission(self, request, view):
        return has_role(
            request.user,
            [UserRole.AUDITOR,
             UserRole.ELECTORAL_OFFICER
             ]
        )

class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return(
            request.user.is_authenticated
            and request.user.is_superuser
        )
        

class IsAssignedElectoralOfficer(BasePermission):
    """Object-level permission: user must be electoral officer assigned to the election."""
    def has_object_permission(self, request, view, obj):
        # obj expected to be an Election instance
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role != UserRole.ELECTORAL_OFFICER:
            return False
        return obj.electoral_officer_id == request.user.id


class IsAssignedAuditor(BasePermission):
    """Object-level permission: user must be an auditor assigned to the election."""
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role not in {UserRole.AUDITOR, UserRole.ADMIN}:
            return False
        if request.user.role == UserRole.ADMIN:
            return True
        return obj.auditors.filter(id=request.user.id).exists()
        
