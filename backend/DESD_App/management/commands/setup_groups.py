from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Set up initial user groups and permissions'

    def handle(self, *args, **options):
        # Create Customer group
        customer_group, created = Group.objects.get_or_create(name='Customer')
        if created:
            self.stdout.write(self.style.SUCCESS('Created Customer group'))
        else:
            self.stdout.write(self.style.WARNING('Customer group already exists'))

        # Create Admin group
        admin_group, created = Group.objects.get_or_create(name='Admin')
        if created:
            self.stdout.write(self.style.SUCCESS('Created Admin group'))
        else:
            self.stdout.write(self.style.WARNING('Admin group already exists'))

        # Create Premium group
        premium_group, created = Group.objects.get_or_create(name='Premium')
        if created:
            self.stdout.write(self.style.SUCCESS('Created Premium group'))
        else:
            self.stdout.write(self.style.WARNING('Premium group already exists'))

        # Output success message
        self.stdout.write(self.style.SUCCESS('User groups have been set up!')) 