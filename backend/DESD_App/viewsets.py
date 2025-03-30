from rest_framework.generics import CreateAPIView
from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .serializers import *
from .models import User
from rest_framework.permissions import IsAdminUser,IsAuthenticated
from .permissions import IsOwner
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

import jwt
import time
import os
from dotenv import load_dotenv
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

# Load environment variables
load_dotenv()

class StreamViewSet(viewsets.ViewSet):
    """API endpoints for video streaming functionality"""
    
    @swagger_auto_schema(
        operation_description="Get HLS stream information",
        operation_summary="Get stream information",
        responses={200: openapi.Response(
            description="Stream information including playback URL and configuration",
            examples={
                "application/json": {
                    "playback_url": "http://localhost:8000/media/videos/stream.m3u8",
                    "hls_config": {
                        "max_buffer_length": 30,
                        "live_sync_duration": 10
                    }
                }
            }
        )}
    )
    @permission_classes([AllowAny])
    def stream_info(self, request):
        """Get HLS stream information"""
        return Response({
            "playback_url": "http://localhost:8000/media/videos/stream.m3u8",
            "hls_config": {
                "max_buffer_length": 30,
                "live_sync_duration": 10
            }
        })
    
    @swagger_auto_schema(
        operation_description="Generate a VideoSDK JWT token for authentication",
        operation_summary="Get VideoSDK token",
        responses={
            200: openapi.Response(
                description="Token generated successfully",
                examples={"application/json": {"token": "eyJhbGciOiJIUzI1..."}}
            ),
            500: openapi.Response(
                description="Failed to generate token",
                examples={"application/json": {"error": "API key not found in environment variables"}}
            )
        }
    )
    @permission_classes([AllowAny])
    def get_token(self, request):
        """Generate a VideoSDK JWT token for authentication"""
        try:
            # Get API key and secret from environment variables
            api_key = os.getenv('VIDEOSDK_API_KEY')
            api_secret = os.getenv('VIDEOSDK_API_SECRET')
            
            if not api_key:
                return Response({"error": "API key not found in environment variables"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            if not api_secret:
                # For development purposes only - use a consistent secret for testing
                # In production, this should be loaded from environment variables
                api_secret = "ZaqXsw123EdcRfvBgt567" # This is just for development, replace with real secret
                print("Warning: API secret not found in environment, using development fallback")
            
            # Generate JWT token according to VideoSDK requirements
            payload = {
                'api_key': api_key,  # Changed from 'apikey' to 'api_key'
                'permissions': ['allow_join', 'allow_mod'],
                'iat': int(time.time()),
                'exp': int(time.time()) + 86400  # Token expires in 1 day
            }
            
            # Generate JWT token with proper secret
            token = jwt.encode(payload, api_secret, algorithm='HS256')
            
            # Debug output
            print(f"Generated token for API key {api_key}: {token[:15]}...")
            
            return Response({'token': token})
            
        except Exception as e:
            print(f"Error generating token: {str(e)}")
            return Response({"error": "Failed to generate token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    

