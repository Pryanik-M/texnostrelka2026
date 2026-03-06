from django import forms
from .models import Subscription


class SubscriptionForm(forms.ModelForm):

    start_date = forms.DateField(
        widget=forms.DateInput(attrs={"type": "date"})
    )

    next_payment_date = forms.DateField(
        widget=forms.DateInput(attrs={"type": "date"})
    )

    class Meta:
        model = Subscription

        fields = [
            "name",
            "category",
            "description",
            "price",
            "currency",
            "billing_period",
            "start_date",
            "next_payment_date",
            "service_url",
            "notes",
        ]