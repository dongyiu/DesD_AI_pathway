from django.utils.timesince import timesince
from rest_framework import serializers
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer
from django.contrib.auth import get_user_model
from .models import *
from django.contrib.auth.models import Group

User = get_user_model()



# class UserCreateSerializer(BaseUserCreateSerializer):

#     groups = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all(), many=False)

#     class Meta(BaseUserCreateSerializer.Meta):
#         model = User #We will be at least for now using the default user model
#         fields =['id','username','email','password','groups']
#         extra_kwargs = {'password':{'write_only':True}} #meaning that password will not be included in the JSON Response
    
#     # def get_role(self, obj):
#     #     return obj.groups.first().name if obj.groups.exists() else "Customer" #return the role that belongs to a user, if not return Customer
    
#     def Create(self, validated_data):
#         user = User.objects.create_user(**validated_data) #using create_user will automatically hash the password field
#         return user
    

    

class UserCreateSerializer(serializers.ModelSerializer):
    rolename = serializers.SerializerMethodField()  # This is read-only field
    group  = serializers.CharField(write_only=True , required=False) # this field is for assigning group to user [Write]
    class Meta:
        model = User
        fields = ['id','username', 'password', 'email', 'rolename','group']  # Include other fields as needed
        extra_kwargs = {'password': {'write_only': True}}

    def get_rolename(self, obj):
        # Get the first group name associated with the user (if any)
        return obj.groups.first().name if obj.groups.exists() else "No Role"
        
    def create(self, validated_data):
        group_name = validated_data.pop('group', None)
        user = User.objects.create_user(**validated_data)
        request = self.context.get('request')

        if group_name and (request and  not request.user.is_staff):
            try:
                group = Group.objects.get(name=group_name)
                user.groups.add(group)
            except Group.DoesNotExist:
                raise serializers.ValidationError(f"Group '{group_name}' does not exist.")
        else:
            group = Group.objects.get(name='Customer')
            user.groups.add(group)

        return user
    

    def update(self, instance, validated_data):
        group_name = validated_data.pop('group', None)
        user_id = instance.id

        request = self.context.get('request')
        user = User.objects.get(id=user_id)
        role_name = user.groups.first().name
        print("request.user.groups.first().name",request.user.groups.first().name,"rolename",role_name)
        print(type(request.user.groups.first().name),type(role_name))
        print(role_name==request.user.groups.first().name)
        if role_name == request.user.groups.first().name:
            raise serializers.ValidationError("You cannot modify a user who has same role/group as you")
        
        if group_name is not None: 
            if request and  not request.user.is_staff: 
                raise serializers.ValidationError("You do not have the permissions to change this users' role/group")
            elif group_name == request.user.groups.first().name:
                raise serializers.ValidationError("You cannot assign the user the same role as you")

            else:
                instance.groups.clear()
                group = Group.objects.get(name=group_name)
                instance.groups.add(group)

        return super().update(instance, validated_data)