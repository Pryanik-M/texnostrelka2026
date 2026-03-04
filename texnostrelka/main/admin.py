from django.contrib import admin
from .models import Subscription, Category


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "user",
        "price",
        "billing_period",
        "next_payment_date",
        "status",
    )

    list_filter = ("billing_period", "status", "category")

    search_fields = ("name", "user__username")


admin.site.register(Category)