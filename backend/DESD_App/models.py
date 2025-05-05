from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
import uuid

class UserProfile(models.Model):
    TITLE_CHOICES = [
        ('Mr', 'Mr.'),
        ('Mrs', 'Mrs.'),
        ('Ms', 'Ms.'),
        ('Dr', 'Dr.'),
        ('Prof', 'Prof.'),
        ('AN', 'A.N.'),
    ]#first value is the value stored in the database, second value is the human-readable name
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    forename = models.CharField(max_length=150, blank=True)
    surname = models.CharField(max_length=150, blank=True)
    title = models.CharField(max_length=6, choices=TITLE_CHOICES, blank=True)

    def clean(self):
        # Check if user with 'AN' title is an admin/superuser
        if self.title == 'AN' and not self.user.is_superuser:
            raise ValidationError({'title': 'Error: Only administrators can use this title.'})

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
        
    def __str__(self):
        return f'{self.user.username} Profile'

# Signal to create a user profile when a user is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

# Signal to save the profile when the user is saved
@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    try:
        instance.profile.save()
    except UserProfile.DoesNotExist:
        UserProfile.objects.create(user=instance)

# Billing model to track user billing information
class BillingRecord(models.Model):
    SUBSCRIPTION_CHOICES = [
        ('free', 'Free'),
        ('basic', 'Basic'),
        ('premium', 'Premium'),
        ('enterprise', 'Enterprise'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='billing_records')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    subscription_type = models.CharField(max_length=20, choices=SUBSCRIPTION_CHOICES, default='free')
    billing_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    description = models.TextField(blank=True, null=True)
    api_calls = models.IntegerField(default=0)
    data_usage = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # in MB
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f'{self.user.username} - {self.amount} - {self.billing_date}'
    
    class Meta:
        ordering = ['-billing_date']

# Subscription model for Feature 6
class Subscription(models.Model):
    PLAN_CHOICES = [
        ('free', 'Free'),
        ('basic', 'Basic'),
        ('premium', 'Premium'),
        ('enterprise', 'Enterprise')
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    auto_renew = models.BooleanField(default=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    max_api_calls = models.IntegerField(default=100, help_text="Maximum allowed API calls per month")
    max_data_usage = models.IntegerField(default=100, help_text="Maximum allowed data usage in MB per month")
    
    def __str__(self):
        return f"{self.user.username}'s {self.plan} subscription"
    
    class Meta:
        ordering = ['-start_date']

# Invoice model for Feature 6
class Invoice(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, related_name='invoices')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invoices')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    invoice_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.username}'s invoice - {self.amount}"
    
    class Meta:
        ordering = ['-invoice_date']

class UsageRecord(models.Model):
    """
    Tracks user session data for AI workout analysis for billing purposes
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='usage_records')
    session_id = models.UUIDField(default=uuid.uuid4, unique=True)
    session_start = models.DateTimeField(default=timezone.now)
    session_end = models.DateTimeField(null=True, blank=True)
    total_duration = models.IntegerField(help_text="Duration in seconds", null=True, blank=True)
    
    # Usage metrics
    frames_processed = models.IntegerField(default=0)
    corrections_sent = models.IntegerField(default=0)
    workout_type = models.IntegerField(default=0)
    
    # Billing information
    billable_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    subscription_plan = models.CharField(max_length=50, blank=True)
    
    # Status flag
    is_active = models.BooleanField(default=True)
    
    # Device info
    client_ip = models.GenericIPAddressField(null=True, blank=True)
    platform = models.CharField(max_length=50, null=True, blank=True)
    
    class Meta:
        ordering = ['-session_start']
    
    def end_session(self):
        """End the current session and calculate duration"""
        if self.is_active:
            self.session_end = timezone.now()
            self.total_duration = (self.session_end - self.session_start).total_seconds()
            self.is_active = False
            self.save()
    
    def calculate_billable_amount(self, rate=0.001):
        """Calculate billable amount based on usage metrics and rate"""
        # Example calculation: $0.001 per correction
        self.billable_amount = self.corrections_sent * rate
        self.save()

class ModelPerformanceMetric(models.Model):
    """
    Tracks AI model performance metrics for admin analytics
    """
    # Timestamps and identification
    timestamp = models.DateTimeField(default=timezone.now)
    model_version = models.CharField(max_length=50)
    workout_type = models.IntegerField(default=0)
    
    # Accuracy metrics
    avg_prediction_confidence = models.FloatField()
    min_prediction_confidence = models.FloatField()
    max_prediction_confidence = models.FloatField()
    correction_magnitude_avg = models.FloatField()
    stable_prediction_rate = models.FloatField(help_text="% of predictions that remained stable")
    
    # Performance metrics
    avg_response_latency = models.IntegerField(help_text="Average latency in milliseconds")
    processing_time_per_frame = models.IntegerField(help_text="Processing time in milliseconds")
    time_to_first_correction = models.IntegerField(help_text="Time in milliseconds until first correction")
    frame_processing_rate = models.FloatField(help_text="Frames processed per second")
    
    # System metrics
    cpu_usage = models.FloatField(null=True, blank=True)
    memory_usage = models.FloatField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"Performance metrics for {self.model_version} at {self.timestamp}"

class MLModel(models.Model):
    MODEL_TYPES = (
        ('workout', 'Workout Classification'),
        ('pose', 'Pose Correction'),
        ('muscle', 'Muscle Activation'),
    )
    
    name = models.CharField(max_length=255)
    model_type = models.CharField(max_length=32, choices=MODEL_TYPES)
    version = models.CharField(max_length=20, default="1.0.0")
    description = models.TextField(null=True, blank=True)
    learning_rate = models.FloatField(default=0.001)
    epochs = models.IntegerField(default=100)
    batch_size = models.IntegerField(default=32)
    accuracy = models.FloatField(default=0.0)
    deployed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_trained = models.DateField(null=True, blank=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['model_type', 'deployed'],
                condition=models.Q(deployed=True),
                name='unique_deployed_model_per_type'
            )
        ]
    
    def save(self, *args, **kwargs):
        # If this model is being deployed, un-deploy other models of the same type
        if self.deployed:
            MLModel.objects.filter(model_type=self.model_type, deployed=True).exclude(pk=self.pk).update(deployed=False)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} ({self.get_model_type_display()})"
