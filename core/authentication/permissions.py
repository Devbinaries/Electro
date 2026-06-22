from rest_framework.permissions import BasePermission
from .models import UserRole
from .permissions import has_role

def has_role(user, roles):
    return( user.is_authenticated and hasattr(user, "role") and user.role in roles)

class IsElectoralOfficer(BasePermission):
    def has_permission(self, request, view):
        return has_role(
            request.user,
            [UserRole.ELECTORAL_OFFICER]
        )
        
        
class IsAuditor(BasePermission):
    def has_permission(self, request, view):
        return has_role(
            request.user, [UserRole.AUDITOR]    
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
        
