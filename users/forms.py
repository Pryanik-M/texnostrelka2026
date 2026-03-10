from django import forms
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
import re


class LoginForm(forms.Form):
    email = forms.EmailField(widget=forms.EmailInput(attrs={'placeholder': 'Email'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'Пароль'}))

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if not User.objects.filter(email=email).exists():
            raise ValidationError("Пользователь с таким Email не найден.")
        return email


class RegistrationForm(forms.ModelForm):

    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            "placeholder": "Пароль",
            "minlength": "8"
        }),
        min_length=8
    )

    confirm_password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            "placeholder": "Повторите пароль"
        })
    )

    class Meta:
        model = User
        fields = ["username", "email"]

        widgets = {
            "username": forms.TextInput(attrs={
                "placeholder": "Имя пользователя",
                "minlength": "3",
                "maxlength": "30"
            }),
            "email": forms.EmailInput(attrs={
                "placeholder": "Email",
                "type": "email"
            })
        }

    def clean_username(self):
        username = self.cleaned_data.get("username")

        if len(username) < 3:
            raise ValidationError("Имя пользователя должно быть минимум 3 символа")

        if not username.isalnum():
            raise ValidationError("Имя пользователя должно содержать только буквы и цифры")

        return username

    def clean_email(self):
        email = self.cleaned_data.get("email")

        if User.objects.filter(email=email).exists():
            raise ValidationError("Этот email уже используется")

        return email

    def clean_password(self):
        password = self.cleaned_data.get("password")
        if not re.search(r"[A-Z]", password):
            raise ValidationError("Пароль должен содержать заглавную букву")
        # if not re.search(r"[a-z]", password):
        #     raise ValidationError("Пароль должен содержать маленькую букву")
        if not re.search(r"\d", password):
            raise ValidationError("Пароль должен содержать цифру")
        # if not re.search(r"[!@#$%^&*]", password):
        #     raise ValidationError("Пароль должен содержать спецсимвол (!@#$%^&*)")
        return password

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        confirm = cleaned_data.get("confirm_password")
        if password and confirm and password != confirm:
            self.add_error("confirm_password", "Пароли не совпадают")

        return cleaned_data


class ForgotPasswordForm(forms.Form):
    email = forms.EmailField(widget=forms.EmailInput(attrs={'placeholder': 'Введите ваш Email'}))

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if not User.objects.filter(email=email).exists():
            raise ValidationError("Пользователь с таким Email не найден.")
        return email


class ResetPasswordForm(forms.Form):
    password = forms.CharField(widget=forms.PasswordInput(), min_length=8)
    confirm_password = forms.CharField(widget=forms.PasswordInput())

    def clean(self):
        cleaned_data = super().clean()
        if cleaned_data.get("password") != cleaned_data.get("confirm_password"):
            raise ValidationError("Пароли не совпадают.")
        return cleaned_data


class VerifyForm(forms.Form):
    code = forms.CharField(
        max_length=6,
        min_length=6,
        widget=forms.TextInput(attrs={'placeholder': 'Введите 6-значный код'}),
        label="Код подтверждения"
    )

    def clean_code(self):
        code = self.cleaned_data.get('code')
        if not code.isdigit():
            raise ValidationError("Код должен состоять только из цифр.")
        return code