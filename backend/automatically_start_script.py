
import os
import django

"""
To avoid the following error keep the below statement

backend-1           |     raise ImproperlyConfigured(
backend-1           | django.core.exceptions.ImproperlyConfigured: Requested setting INSTALLED_APPS, but settings are not configured. You must either define the environment variable DJANGO_SETTINGS_MODULE or call settings.configure() 
before accessing settings.
"""
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth.models import Group, Permission

"""
Create Groups
1-Admin
2-AI Engineer
3-Customer

"""
query = User.objects.all()
query.delete()


admin_group, created = Group.objects.get_or_create(name='Admin')
all_permissions = Permission.objects.all()
admin_group.permissions.add(*all_permissions)


ai_engineer_group, created = Group.objects.get_or_create(name='AI Engineer')

customer_group, created = Group.objects.get_or_create(name='Customer')






staff_user = User.objects.create_user(username='Dong2025', password='Dong2025')

# Set them as staff
staff_user.groups.add(admin_group)
staff_user.save()

staff_two = User.objects.create_user(username='Yahia2025', password='Yahia2025')
staff_two.groups.add(admin_group)

staff_two.save()

# """
# creating a bunch of users [customer role]

# """

for i in range(1, 20):
    user = User.objects.create_user(username=f'user_{i}', password=f'user_{i}')
    print(f'User {i} created successfully')
    user.groups.add(customer_group)
    user.save()



users = User.objects.filter(groups=admin_group, is_staff=False)
for user in users:
    user.is_staff = True
    user.save()