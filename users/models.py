from django.db import models
from django.contrib.auth.models import User
from .crypto_utils import decrypt_password


class EmailAccount(models.Model):
    PROVIDERS = [
        ("yandex", "Yandex"),
        ("gmail", "Gmail"),
        ("mailru", "Mail.ru"),
    ]
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="email_accounts"
    )
    email = models.EmailField()
    provider = models.CharField(
        max_length=50,
        choices=PROVIDERS
    )
    password = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_checked = models.DateTimeField(null=True, blank=True)
    def __str__(self):
        return f"{self.email} ({self.user.username})"

    def get_decrypted_password(self):
        return decrypt_password(self.password)


class EmailSubscriptionCandidate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.CharField(max_length=500)
    sender = models.CharField(max_length=255)
    detected_service = models.CharField(max_length=255)
    message_id = models.CharField(max_length=255, blank=True, null=True)
    detected_period = models.CharField(
        max_length=10,
        blank=True
    )
    snippet = models.TextField(blank=True, null=True)
    confidence = models.IntegerField(default=0)
    is_processed = models.BooleanField(default=False)



class Device(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)