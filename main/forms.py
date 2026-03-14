from django import forms
from .models import Subscription


class SubscriptionForm(forms.ModelForm):
    name = forms.CharField(
        widget=forms.TextInput(attrs={"placeholder": "Название подписки"})
    )
    description = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={"placeholder": "Краткое описание подписки"})
    )
    price = forms.DecimalField(
        widget=forms.NumberInput(attrs={"placeholder": "Стоимость"})
    )
    currency = forms.CharField(
        widget=forms.TextInput(attrs={"placeholder": "Валюта"})
    )

    start_date = forms.DateField(
        widget=forms.DateInput(attrs={"type": "date"})
    )
    next_payment_date = forms.DateField(
        widget=forms.DateInput(attrs={"type": "date"})
    )
    service_url = forms.URLField(
        required=False,
        widget=forms.URLInput(attrs={"placeholder": "Ссылка на сервис"})
    )
    notes = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={"placeholder": "Дополнительные заметки"})
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