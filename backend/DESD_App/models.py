from django.db import models
from django.conf import settings
from django.contrib.auth.models import User

# Create your models here.
class AIModel(models.Model):
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT
    )
    name = models.TextField(max_length=100, unique=True)
    added_at = models.DateTimeField()
    description = models.TextField(null=True)
    input_fields = models.JSONField(null=True)
    output_fields = models.JSONField(null=True)
    request_num = models.IntegerField()

class AIModelRequest(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete = models.CASCADE,
        )
    model_used = models.ForeignKey(AIModel, on_delete=models.PROTECT)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField(null=True)
    parameters = models.JSONField()
    error_message = models.TextField(null=True)
    type = models.TextField(max_length=100)
    response = models.JSONField(null=True)

