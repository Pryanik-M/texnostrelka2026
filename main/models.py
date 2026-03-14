from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Subscription(models.Model):
    BILLING_PERIODS = [
        ("day", "Ежедневно"),
        ("week", "Еженедельно"),
        ("month", "Ежемесячно"),
        ("year", "Ежегодно"),
    ]
    STATUS = [
        ("active", "Активна"),
        ("paused", "Приостановлена"),
        ("cancelled", "Отменена"),
    ]
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="subscriptions"
    )
    name = models.CharField(max_length=200)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    description = models.TextField(blank=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    currency = models.CharField(
        max_length=10,
        default="RUB"
    )
    billing_period = models.CharField(
        max_length=10,
        choices=BILLING_PERIODS,
        default="month"
    )
    start_date = models.DateField()
    next_payment_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=STATUS,
        default="active"
    )
    service_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)
    last_notification = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"