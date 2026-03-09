from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from .forms import LoginForm, RegistrationForm, ForgotPasswordForm, ResetPasswordForm, VerifyForm
from django.contrib.auth.decorators import login_required
from .models import EmailAccount, EmailSubscriptionCandidate
from .crypto_utils import encrypt_password
from main.models import Subscription
from .email_providers import detect_provider
from .email_validator import test_imap_connection
from .utils import generate_2fa_code, hash_code
from django.contrib import messages


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
            fail_silently=False
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
def connect_email(request):
    provider = detect_provider(request.user.email)
    if not provider:
        messages.error(request, "Провайдер почты не поддерживается")
        return redirect("auth:profile")
    if request.method == "POST":
        password = request.POST.get("password")
        email_address = request.user.email
        if not test_imap_connection(email_address, password, provider):
            messages.error(request, "Не удалось подключиться к почте")
            return redirect("auth:profile")
        encrypted_password = encrypt_password(password)
        account = EmailAccount.objects.filter(user=request.user).first()
        if account:
            account.email = email_address
            account.provider = provider
            account.password = encrypted_password
            account.is_active = True
            account.save()
        else:
            EmailAccount.objects.create(
                user=request.user,
                email=email_address,
                provider=provider,
                password=encrypted_password
            )
        messages.success(request, "Почта успешно подключена")
    return redirect("auth:profile")


@login_required
def add_from_candidate(request, candidate_id):
    # Ищем кандидата, проверяя владельца
    candidate = get_object_or_404(EmailSubscriptionCandidate, id=candidate_id, user=request.user)
    if request.method == "POST":
        # Создаем реальную подписку на основе данных кандидата
        Subscription.objects.create(
            user=request.user,
            title=request.POST.get("name"),
            price=request.POST.get("price", 0),
            # добавь другие поля своей модели Subscription
        )
        candidate.is_processed = True
        candidate.save()
        return redirect("main:home")
    # Предзаполняем данные для шаблона
    return render(request, "main/add_subscription.html", {
        "candidate": candidate,
        "initial_title": candidate.detected_service,
    })


def logout_view(request):
    logout(request)  # удаляет сессию пользователя
    return redirect("main:home")