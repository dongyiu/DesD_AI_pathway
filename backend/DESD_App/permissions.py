from rest_framework import permissions

class IsOwner(permissions.BasePermission):
    """
    Object level permission
    Custom permission to only allow owners of an object to perform actions on it.
    """
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user
    
class IsMachineLearningExpert(permissions.BasePermission):
    """
    Object level permission
    Custom permission to only allow machine learning experts to perform actions on it.
    """
    def has_permission(self, request, view):
        return request.user.has_perm('auth.machine_learning_permission')

    