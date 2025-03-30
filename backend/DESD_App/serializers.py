from django.utils.timesince import timesince
from rest_framework import serializers
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer
from django.contrib.auth import get_user_model
from .models import *

User = get_user_model()



class UserCreateSerializer(BaseUserCreateSerializer):

    class Meta(BaseUserCreateSerializer.Meta):
        model = User #We will be at least for now using the default user model
        fields =['id','username','email','password']
        extra_kwargs = {'password':{'write_only':True}} #meaning that password will not be included in the JSON Response

    def Create(self, validated_data):
        user = User.objects.create_user(**validated_data) #using create_user will automatically hash the password field
        return user