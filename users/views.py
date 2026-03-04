from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect
from django.core.mail import send_mail
from django.conf import settings
from .forms import LoginForm, RegistrationForm, ForgotPasswordForm, ResetPasswordForm, VerifyForm
from django.contrib.auth.decorators import login_required
from .models import EmailAccount, EmailSubscriptionCandidate
# from .email_scanner import scan_yandex_email
from django.utils import timezone
from main.models import Subscription
import time
from .utils import *


def login_view(request):
    form = LoginForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        email = form.cleaned_data['email']
        password = form.cleaned_data['password']
        user = User.objects.get(email=email)
        user = authenticate(request, username=user.username, password=password)
        if user:
            login(request, user)
            return redirect("main:home")
        form.add_error('password', "Неверный пароль.")
    return render(request, "accounts/login.html", {"form": form})


def register_view(request):
    form = RegistrationForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        request.session["register_data"] = form.cleaned_data
        return redirect("auth:register_verify")
    return render(request, "accounts/register.html", {"form": form})


def register_verify_view(request):
    data = request.session.get("register_data")
    if not data:
        return redirect("auth:register")
    form = VerifyForm(request.POST or None)
    # Логика отправки кода
    if request.method == "POST" and request.POST.get("action") == "send":
        code = generate_2fa_code(6)
        request.session["email_code"] = hash_code(code)
        send_mail(
            "Код подтверждения регистрации",
            f"Ваш код: {code}",
            settings.DEFAULT_FROM_EMAIL,
            [data["email"]],
        )
        return render(request, "accounts/verify.html", {"form": form, "code_sent": True})
    if request.method == "POST" and request.POST.get("action") == "verify":
        if form.is_valid():
            input_code = form.cleaned_data['code']
            if hash_code(input_code) == request.session.get("email_code"):
                user = User.objects.create_user(
                    username=data["username"],
                    email=data["email"],
                    password=data["password"]
                )
                login(request, user)
                request.session.pop("register_data")
                request.session.pop("email_code")
                return redirect("auth:profile")
            else:
                form.add_error('code', "Неверный или просроченный код.")
    return render(request, "accounts/verify.html", {"form": form})


def forgot_password_view(request):
    form = ForgotPasswordForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        email = form.cleaned_data['email']
        user = User.objects.get(email=email)
        request.session["reset_user"] = user.id
        return redirect("auth:forgot_verify")
    return render(request, "accounts/forgot_password.html", {"form": form})


def forgot_verify_view(request):
    user_id = request.session.get("reset_user")
    if not user_id:
        return redirect("auth:login")
    user = User.objects.get(id=user_id)
    form = VerifyForm(request.POST or None)
    if request.method == "POST" and request.POST.get("action") == "send":
        code = generate_2fa_code(6)
        request.session["reset_code"] = hash_code(code)
        send_mail(
            "Код сброса пароля",
            f"Ваш код: {code}",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
        )
        return render(request, "accounts/verify.html", {"form": form, "code_sent": True})
    if request.method == "POST" and request.POST.get("action") == "verify":
        if form.is_valid():
            input_code = form.cleaned_data['code']
            if hash_code(input_code) == request.session.get("reset_code"):
                request.session.pop("reset_code")
                return redirect("auth:reset_password")
            else:
                form.add_error('code', "Неверный код.")
    return render(request, "accounts/verify.html", {"form": form})


def reset_password_view(request):
    user_id = request.session.get("reset_user")
    if not user_id: return redirect("auth:login")
    form = ResetPasswordForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = User.objects.get(id=user_id)
        user.set_password(form.cleaned_data['password'])
        user.save()
        request.session.pop("reset_user")
        return redirect("auth:login")
    return render(request, "accounts/reset_password.html", {"form": form})


@login_required
def profile_view(request):
    email_account = EmailAccount.objects.filter(
        user=request.user,
        is_active=True
    ).first()
    candidates_count = EmailSubscriptionCandidate.objects.filter(
        user=request.user,
        is_processed=False
    ).count()
    return render(
        request,
        "accounts/profile.html",
        {
            "user": request.user,
            "email_account": email_account,
            "candidates_count": candidates_count,
            "VAPID_PUBLIC_KEY": settings.WEBPUSH_SETTINGS["VAPID_PUBLIC_KEY"]
        }
    )


@login_required
def connect_yandex_email(request):
    if request.method == "POST":
        email_address = request.POST.get("email")
        password = request.POST.get("password")
        EmailAccount.objects.create(
            user=request.user,
            email=email_address,
            password=password,
            provider="yandex"
        )
        # emails = scan_yandex_email(email_address, password)
        # for e in emails:
        #     EmailSubscriptionCandidate.objects.create(
        #         user=request.user,
        #         subject=e["subject"],
        #         sender=e["sender"],
        #         detected_service=e["sender"],
        #         message_id=e.get("message_id")
        #     )
        if EmailAccount.objects.filter(user=request.user, is_active=True).exists():
            return redirect("auth:profile")
    return render(request, "accounts/connect_yandex.html")


def logout_view(request):
    logout(request)  # удаляет сессию пользователя
    return redirect("auth:login")