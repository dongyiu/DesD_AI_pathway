from django.utils.timesince import timesince
from rest_framework import serializers
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer
from django.contrib.auth import get_user_model
from .models import *

User = get_user_model()


"""
UserCreateSerializer will be used for mainly for Authentication, Login, Register
While UserProfileSerializer will be used for storing additional information about the user

The reason for this split is to follow the Single Responsibility Principle (SRP)

"""
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone_number']

class UserCreateSerializer(BaseUserCreateSerializer):
    profile = UserProfileSerializer

    class Meta(BaseUserCreateSerializer.Meta):
        model = User #We will be at least for now using the default user model
        fields =['id','username','email','password','profile']
        extra_kwargs = {'password':{'write_only':True}} #meaning that password will not be included in the JSON Response

    def Create(self, validated_data):
        profile_data = validated_data.pop('profile') #Get the profile information about the user
        user = User.objects.create_user(**validated_data) #using create_user will automatically hash the password field
        UserProfile.objects.create(user=user, **profile_data) #once create a user , create a profile
        return user
