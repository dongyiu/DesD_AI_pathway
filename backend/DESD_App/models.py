from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    ACTIVITY_CHOICES = [
        ('S', 'Sedentary'),
        ('L', 'Lightly Active'),
        ('M', 'Moderately Active'),
        ('V', 'Very Active'),
        ('E', 'Extremely Active'),
    ]
    
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15, blank=True)
    age = models.IntegerField(null=True)
    height = models.FloatField(help_text="Height in cm", null=True)
    weight = models.FloatField(help_text="Weight in kg", null=True)
    activity_level = models.CharField(max_length=1, choices=ACTIVITY_CHOICES, default='S')
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True)
    target_weight = models.FloatField(help_text="Target weight in kg", null=True)
    medical_conditions = models.TextField(blank=True)
    fitness_goals = models.TextField(blank=True)
    
    def calculate_bmr(self):
        """Calculate Basic Metabolic Rate using Harris-Benedict equation"""
        if not all([self.weight, self.height, self.age, self.gender]):
            return None
            
        if self.gender == 'M':
            return 88.362 + (13.397 * self.weight) + (4.799 * self.height) - (5.677 * self.age)
        else:
            return 447.593 + (9.247 * self.weight) + (3.098 * self.height) - (4.330 * self.age)

    def calculate_daily_calories(self):
        """Calculate daily calorie needs based on activity level"""
        activity_multipliers = {
            'S': 1.2,
            'L': 1.375,
            'M': 1.55,
            'V': 1.725,
            'E': 1.9,
        }
        bmr = self.calculate_bmr()
        if not bmr:
            return None
        return bmr * activity_multipliers[self.activity_level]
