from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile') #One to one relationship , One profile per one user

    phone_number = models.CharField(max_length=15, unique=True)

    #possibly we can add profile picture here as well?
