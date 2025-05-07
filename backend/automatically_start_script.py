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

# Helper function to create user if it doesn't exist
def create_user_if_not_exists(username, password, email=None, groups=None):
    try:
        user = User.objects.get(username=username)
        print(f"User {username} already exists, skipping creation")
        # Ensure user is in the correct group
        if groups:
            for group in groups:
                user.groups.add(group)
            user.save()
        return user
    except User.DoesNotExist:
        print(f"Creating new user: {username}")
        user = User.objects.create_user(username=username, password=password, email=email)
        if groups:
            for group in groups:
                user.groups.add(group)
        user.save()
        return user

# content_type = ContentType.objects.get(app_label='auth', model='user')
# Get or create the content type
content_type, _ = ContentType.objects.get_or_create(app_label='auth', model='user')

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


# Create users with safeguards
staff_user = create_user_if_not_exists('Dong2025', 'Dong2025', groups=[admin_group])
ChatGPT = create_user_if_not_exists('ChatGPT', 'ChatGPT', groups=[ai_engineer_group])
staff_two = create_user_if_not_exists('Yahia2025', 'Yahia2025', groups=[admin_group])
Admin_user = create_user_if_not_exists('Admin', 'Admin', email='admin@ufcfur_15_3.com', groups=[admin_group])
First_name = create_user_if_not_exists('First', 'First', email='first.name@ufcfur_15_3.com', groups=[ai_engineer_group])
# Tensa_name = create_user_if_not_exists('Tensa', 'Tensa', email='tensa.flow@ufcfur_15_3.com', groups=[ai_engineer_group])

# Create client users
list_users = [

    {'username': 'Rob', 'password': 'Rob', 'email':'rob.smith@example.com', 'group': customer_group},
    {'username': 'Liz', 'password': 'Liz', 'email':'liz.brown@example.com', 'group': customer_group},
    {'username': 'Hesitant', 'password': 'Hesitant', 'email':'hesitant@example.com', 'group': customer_group},
    {'username': 'Edmond', 'password': 'Edmond', 'email':'edmond.hobbs@darknet.com', 'group': customer_group},
    {'username': 'Ahmed', 'password': 'Ahmed', 'email':'Ahmed.moh@example.com', 'group': customer_group},
    {'username': 'Mike', 'password': 'Mike', 'email':'Mike.meh@example.com', 'group': customer_group},
    {'username': 'Nathan', 'password': 'Nathan', 'email':'Nathan.hob@example.com', 'group': customer_group},
    {'username': 'Omar', 'password': 'Omar', 'email':'Omar.ahmed@example.com', 'group': customer_group},
    {'username': 'Mark', 'password': 'Mark', 'email':'Mark.shon@example.com', 'group': customer_group},
    {'username': 'John', 'password': 'John', 'email':'John.sehn@example.com', 'group': customer_group}



]

for user_instance in list_users:
    create_user_if_not_exists(
        username=user_instance['username'], 
        password=user_instance['password'], 
        email=user_instance['email'], 
        groups=[user_instance['group']]
    )

# Set admin users as staff
users = User.objects.filter(groups=admin_group, is_staff=False)
for user in users:
    user.is_staff = True
    user.save()

# Print permissions for debugging
permissions = ai_engineer_group.permissions.all()
for permission in permissions:
    print(f"Permission: {permission.codename} - {permission.name}")
    
# Generate billing data for testing
print("Generating billing data for testing...")

# Check if billing records already exist
if BillingRecord.objects.count() > 0:
    print(f"Found {BillingRecord.objects.count()} existing billing records, skipping billing data generation")
else:
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