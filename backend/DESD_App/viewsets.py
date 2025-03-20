from rest_framework.generics import CreateAPIView
from django.contrib.auth.models import User
from rest_framework import viewsets
from .serializers import *
from .models import User
from rest_framework.permissions import IsAdminUser,IsAuthenticated
from .permissions import IsOwner
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied


"""
No need to put IsAuthenticated inside each permission class, since it is already in settings [on project-level by default]
meaning that you cannot access any viewset here without being authenticated first

"""

class UserViewSet(generics.RetrieveUpdateAPIView):
    """
    This is for user to change their personal account information or to view it only
    however they cannot access other users personal information
    """
    permission_classes = [IsAuthenticated, IsOwner] #only the owner of their account can access this view
    serializer_class = UserCreateSerializer
    #the reason why we do not set queryset to all objects, to prevent user from accessing other users' information

    def get_object(self):
        return self.request.user  # Only user can access their information even if they pass a different id


class AccountManagementViewSet(viewsets.ModelViewSet):
    """
    This is for admin to view and manage all users.
    Admins can view, update, delete, create users.
    """
    permission_classes = [IsAuthenticated,IsAdminUser] #only the admin can access this view
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        target_rolename = instance.groups.first().name
        
        current_rolename = request.user.groups.first().name
        if target_rolename == current_rolename:
            raise PermissionDenied("User cannot delete other users with the same role")
            
        return super().destroy(request, *args, **kwargs)

class UserActiveCountViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated,IsAdminUser]
    def list(self, request):
        total_number_of_users = User.objects.count()
        total_number_of_active_users = User.objects.filter(is_active=True).count()
        total_number_of_inactive_users = User.objects.filter(is_active=False).count()
        data = {
            "total_number_of_users": total_number_of_users,
            "total_number_of_active_users": total_number_of_active_users,
            "total_number_of_inactive_users": total_number_of_inactive_users,
        }

        return Response(data)
    

