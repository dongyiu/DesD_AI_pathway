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
from django.contrib.contenttypes.models import ContentType
from DESD_App.models import BillingRecord
from datetime import datetime, timedelta
import random


"""
Create Groups
1-Admin
2-AI Engineer
3-Customer

"""


# query = User.objects.all()
# query.delete()

content_type = ContentType.objects.get(app_label='auth', model='user')

machine_learning_permission, created = Permission.objects.get_or_create(
    codename='machine_learning_permission',
    name='Can Train Machine Learning Models',
    content_type=content_type,
)


admin_group, created = Group.objects.get_or_create(name='Admin')
all_permissions = Permission.objects.all()
admin_group.permissions.add(*all_permissions)


ai_engineer_group, created = Group.objects.get_or_create(name='AI Engineer')
ai_engineer_group.permissions.add(machine_learning_permission)
ai_engineer_group.save()
customer_group, created = Group.objects.get_or_create(name='Customer')



staff_user = User.objects.create_user(username='Dong2025', password='Dong2025')




ChatGPT = User.objects.create_user(username='ChatGPT', password='ChatGPT')
ChatGPT.groups.add(ai_engineer_group)
ChatGPT.save()

# Set them as staff
staff_user.groups.add(admin_group)
staff_user.save()

staff_two = User.objects.create_user(username='Yahia2025', password='Yahia2025')
staff_two.groups.add(admin_group)

staff_two.save()

# """
# creating a bunch of users [customer role]

# """


"""
Creating test cases for assignment
1 - 1 AI engineer
Dr First


2 - 1 administrator A.N. Admin

3 - 10 clients with realistic name
Mr Rob Smith
Ms Liz Brown
Mr Hesitant

"""
AIEngineer = User.objects.create_user(username='AIEngineer', password='AIEngineer')
AIEngineer.groups.add(ai_engineer_group)
AIEngineer.save()
AIEngineer.profile.title = 'Dr'
AIEngineer.profile.forename = 'First'
AIEngineer.profile.save()

AdminOne = User.objects.create_user(username='AdminOne', password='AdminOne')
AdminOne.groups.add(admin_group)
AdminOne.save()
AdminOne.profile.title = 'A.N.'
AdminOne.profile.forename = 'Admin'
AdminOne.profile.save()

titles = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof']
first_names = ['John', 'Jane', 'Michael', 'Yahia', 'Amin', 'Yasine', 'Dong', 'Cole', 'Thomas', 'Mary']
last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Taylor', 'Clark']

# Get or create the customer group
customer_group, created = Group.objects.get_or_create(name='Customer')

# Create users with profiles
for i in range(1, len(first_names) + 1):
    # Create user
    user = User.objects.create_user(username=f'user_{i}', password=f'user_{i}')
    
    # Add user to customer group
    user.groups.add(customer_group)
    user.save()
    
    user.profile.title = random.choice(titles)
    user.profile.forename = random.choice(first_names)
    user.profile.surname = random.choice(last_names)
    user.profile.save()
    
    print(f'User {i} created successfully: {user.profile.title} {user.profile.forename} {user.profile.surname}')



users = User.objects.filter(groups=admin_group, is_staff=False)
for user in users:
    user.is_staff = True
    user.save()




permissions = ai_engineer_group.permissions.all()

# Print the permissions
for permission in permissions:
    print(f"Permission: {permission.codename} - {permission.name}")
    
# Generate billing data for testing
print("Generating billing data for testing...")

# Delete existing billing records
BillingRecord.objects.all().delete()

# Get all customer users
customer_users = User.objects.filter(groups=customer_group)
subscription_types = ['free', 'basic', 'premium', 'enterprise']
status_types = ['pending', 'paid', 'overdue', 'cancelled']

# Generate random billing data for the past year
today = datetime.now().date()
for user in customer_users:
    # Generate between 3-10 billing records per user
    for i in range(random.randint(3, 10)):
        # Random date in the past year
        billing_date = today - timedelta(days=random.randint(1, 365))
        due_date = billing_date + timedelta(days=30)
        
        # Create billing record
        BillingRecord.objects.create(
            user=user,
            amount=random.uniform(10.0, 500.0),
            subscription_type=random.choice(subscription_types),
            billing_date=billing_date,
            due_date=due_date,
            status=random.choice(status_types),
            description=f"Monthly subscription for {user.username}",
            api_calls=random.randint(100, 10000),
            data_usage=random.uniform(50.0, 2000.0)
        )

print(f"Created {BillingRecord.objects.count()} billing records for testing")