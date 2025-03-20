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
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/",include("DESD_App.urls")), #all of the url requests inside this app must start with /api/end_point name

    path("auth/",include("djoser.urls")),  #provided by djoser for Authentication purposes automatically
    path("auth/",include("djoser.urls.jwt")), #provided by djoser for Authentication purposes automatically especially for JWT authentication
    path('api-auth/', include('rest_framework.urls')),
]

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