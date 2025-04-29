from django.utils.timesince import timesince
from rest_framework import serializers
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer
from django.contrib.auth import get_user_model
from .models import *
from django.contrib.auth.models import Group
import re

User = get_user_model()

# Company domain for employees
COMPANY_DOMAIN = "ufcfur_15_3.com"

# Email validator function
def validate_email_domain(email, group_name):
    """
    Validates that AI Engineers and Admins use company email domain
    """
    if group_name in ['Admin', 'AI Engineer']:
        if not email.endswith(f'@{COMPANY_DOMAIN}'):
            raise serializers.ValidationError(f"Admin and AI Engineer accounts must use company email (@{COMPANY_DOMAIN}).")
    return email



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
    group = serializers.CharField(write_only=True, required=False)  # this field is for assigning group to user [Write]
    groups = serializers.SerializerMethodField()  # Include groups in the response
    is_admin = serializers.SerializerMethodField()  # Add is_admin field
    is_approved = serializers.BooleanField(required=False, default=False, write_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 'rolename', 'group', 'groups', 'is_admin', 'is_approved']
        extra_kwargs = {'password': {'write_only': True}}

    def get_rolename(self, obj):
        # Get the first group name associated with the user (if any)
        return obj.groups.first().name if obj.groups.exists() else "No Role"
    
    def get_groups(self, obj):
        # Return all groups the user belongs to
        return [{'id': g.id, 'name': g.name} for g in obj.groups.all()]
    
    def get_is_admin(self, obj):
        # Check if user is in the Admin group
        return obj.groups.filter(name='Admin').exists()
    
    def validate(self, data):
        # Get the group name if provided
        group_name = data.get('group')
        email = data.get('email')
        
        if email and group_name:
            # Validate email domain for company employees
            validate_email_domain(email, group_name)
        
        return data
    
    def create(self, validated_data):
        group_name = validated_data.pop('group', None)
        is_approved = validated_data.pop('is_approved', False)
        user = User.objects.create_user(**validated_data)
        request = self.context.get('request')

        # Set default approval status based on role
        # Customers are auto-approved, company roles need admin approval
        if group_name:
            try:
                group = Group.objects.get(name=group_name)
                user.groups.add(group)
                
                # Set is_approved flag - Customers are automatically approved
                if group_name in ['Admin', 'AI Engineer']:
                    user.profile.is_approved = is_approved
                else:
                    user.profile.is_approved = True
                user.profile.save()
                
            except Group.DoesNotExist:
                raise serializers.ValidationError(f"Group '{group_name}' does not exist.")
        else:
            # Default to Customer role
            group = Group.objects.get(name='Customer')
            user.groups.add(group)
            user.profile.is_approved = True
            user.profile.save()

        return user
    

    def update(self, instance, validated_data):
        group_name = validated_data.pop('group', None)
        user_id = instance.id

        request = self.context.get('request')
        is_self_update = self.context.get('is_self_update', False)
        
        # If this is a self-update, bypass all role restriction checks
        if is_self_update:
            return super().update(instance, validated_data)
            
        user = User.objects.get(id=user_id)
        role_name = user.groups.first().name if user.groups.exists() else None
        
        # Skip the role check if user is updating their own profile
        if request and request.user.id == user_id:
            # Allow users to update their own profile
            pass
        # Only apply role restriction for admins updating other users
        elif role_name and request and role_name == request.user.groups.first().name:
            raise serializers.ValidationError("You cannot modify a user who has same role/group as you")
        
        if group_name is not None: 
            if request and not request.user.is_staff: 
                raise serializers.ValidationError("You do not have the permissions to change this users' role/group")
            elif request and group_name == request.user.groups.first().name:
                raise serializers.ValidationError("You cannot assign the user the same role as you")
            else:
                instance.groups.clear()
                group = Group.objects.get(name=group_name)
                instance.groups.add(group)

        return super().update(instance, validated_data)
    



    


