"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.http import JsonResponse
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.conf import settings
from django.conf.urls.static import static
from DESD_App.viewsets import StreamViewSet

# Create the Swagger schema view
schema_view = get_schema_view(
   openapi.Info(
      title="DESD API",
      default_version='v1',
      description="API documentation for DESD Project",
   ),
   public=True,
   permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    # Admin panel
    path("admin/", admin.site.urls),
    path("api/",include("DESD_App.urls")), #all of the url requests inside this app must start with /api/end_point name

    path("auth/",include("djoser.urls")),  #provided by djoser for Authentication purposes automatically
    path("auth/",include("djoser.urls.jwt")), #provided by djoser for Authentication purposes automatically especially for JWT authentication
    path('api-auth/', include('rest_framework.urls')),
  
    # All video streaming endpoints now use the /api/ prefix
    # No more legacy endpoints
    
    # Swagger/OpenAPI documentation
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


"""
----------------------------------------------------------------

for auth/ djoser.urls, the following end points:

POST /auth/users/ --> Create a new user

POST /auth/users/activation --> Activate the user account

POST /auth/user/rest_password --> Requesting to change the user password

POST /auth/user/password/change --> Changing the user password

POST /auth/token/login/ --> Obtain an Authentication token
----------------------------------------------------------------

"""

"""
----------------------------------------------------------------
for auth/ djoser.urls.jwt, the following endpoints:

POST /auth/jwt/create --> Creates a new stateless [JWT] token or refreshes the current token

post /auth/jwt/refresh --> Refresh the current token

POST /auth/jwt/verify --> Verify if the token is valid

----------------------------------------------------------------


"""