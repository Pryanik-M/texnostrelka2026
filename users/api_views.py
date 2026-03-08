from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .forms import RegistrationForm
from .utils import generate_2fa_code, hash_code
from django.core.mail import send_mail
from .forms import ForgotPasswordForm
from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from .models import EmailAccount, EmailSubscriptionCandidate
from .email_providers import detect_provider
from rest_framework.response import Response
from .email_validator import test_imap_connection
from .crypto_utils import encrypt_password
from .models import EmailAccount
from users.models import EmailSubscriptionCandidate
from main.models import Subscription



@api_view(["POST"])
def login_api(request):
    email = request.data.get("email")
    password = request.data.get("password")
    if not email or not password:
        return Response({
            "error": "Email and password required"
        }, status=400)
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({
            "error": "User with this email not found"
        }, status=404)
    user = authenticate(username=user.username, password=password)
    if not user:
        return Response({
            "error": "Invalid password"
        }, status=400)
    refresh = RefreshToken.for_user(user)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    })


@api_view(["POST"])
def register_api(request):
    form = RegistrationForm(request.data)
    if not form.is_valid():
        return Response({
            "errors": form.errors
        }, status=400)

    data = form.cleaned_data
    # генерируем код
    code = generate_2fa_code(6)
    # сохраняем данные регистрации
    request.session["register_data"] = data
    request.session["email_code"] = hash_code(code)
    # отправляем письмо
    send_mail(
        "Код подтверждения регистрации",
        f"Ваш код: {code}",
        settings.DEFAULT_FROM_EMAIL,
        [data["email"]],
    )
    return Response({
        "message": "Verification code sent to email"
    })


@api_view(["POST"])
def register_verify_api(request):
    code = request.data.get("code")
    if not code:
        return Response({
            "error": "Verification code required"
        }, status=400)
    stored_code = request.session.get("email_code")
    register_data = request.session.get("register_data")
    if not stored_code or not register_data:
        return Response({
            "error": "Registration session expired"
        }, status=400)
    if hash_code(code) != stored_code:
        return Response({
            "error": "Invalid verification code"
        }, status=400)
    # создаем пользователя
    user = User.objects.create_user(
        username=register_data["username"],
        email=register_data["email"],
        password=register_data["password"]
    )
    # очищаем session
    request.session.pop("register_data")
    request.session.pop("email_code")
    # создаем JWT
    refresh = RefreshToken.for_user(user)
    return Response({
        "message": "User successfully created",
        "access": str(refresh.access_token),
        "refresh": str(refresh)
    })


@api_view(["POST"])
def forgot_password_api(request):
    form = ForgotPasswordForm(request.data)
    if not form.is_valid():
        return Response({
            "errors": form.errors
        }, status=400)
    email = form.cleaned_data["email"]
    user = User.objects.get(email=email)
    # генерируем код
    code = generate_2fa_code(6)
    # сохраняем пользователя и код
    request.session["reset_user"] = user.id
    request.session["reset_code"] = hash_code(code)
    # отправляем письмо
    send_mail(
        "Код сброса пароля",
        f"Ваш код: {code}",
        settings.DEFAULT_FROM_EMAIL,
        [email],
    )
    return Response({
        "message": "Password reset code sent to email"
    })


@api_view(["POST"])
def forgot_verify_api(request):
    code = request.data.get("code")
    if not code:
        return Response({
            "error": "Verification code required"
        }, status=400)
    stored_code = request.session.get("reset_code")
    user_id = request.session.get("reset_user")
    if not stored_code or not user_id:
        return Response({
            "error": "Reset session expired"
        }, status=400)
    if hash_code(code) != stored_code:
        return Response({
            "error": "Invalid verification code"
        }, status=400)
    return Response({
        "message": "Code verified. You can now reset your password."
    })


@api_view(["POST"])
def reset_password_api(request):
    password = request.data.get("password")
    confirm_password = request.data.get("confirm_password")
    if not password or not confirm_password:
        return Response({
            "error": "Password and confirm_password required"
        }, status=400)
    if password != confirm_password:
        return Response({
            "error": "Passwords do not match"
        }, status=400)
    user_id = request.session.get("reset_user")
    if not user_id:
        return Response({
            "error": "Reset session expired"
        }, status=400)
    user = User.objects.get(id=user_id)
    user.set_password(password)
    user.save()
    # очищаем session
    request.session.pop("reset_user", None)
    request.session.pop("reset_code", None)
    return Response({
        "message": "Password successfully updated"
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile_api(request):
    user = request.user
    email_account = EmailAccount.objects.filter(user=user).first()
    candidates_count = EmailSubscriptionCandidate.objects.filter(
        user=user
    ).count()
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "email_account": email_account.email if email_account else None,
        "candidates_count": candidates_count
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def connect_email_api(request):
    password = request.data.get("password")
    if not password:
        return Response({
            "error": "Email password required"
        }, status=400)
    user = request.user
    email = user.email
    # определяем провайдера
    provider = detect_provider(email)
    if not provider:
        return Response({
            "error": "Unsupported email provider"
        }, status=400)
    # проверяем IMAP соединение
    success = test_imap_connection(email, password, provider)
    if not success:
        return Response({
            "error": "Failed to connect to email via IMAP"
        }, status=400)
    # шифруем пароль
    encrypted_password = encrypt_password(password)
    # создаем EmailAccount
    account, created = EmailAccount.objects.update_or_create(
    user=user,
    defaults={
        "email": email,
        "provider": provider,
        "password": encrypted_password,
        "is_active": True
    }
)
    return Response({
        "message": "Email successfully connected",
        "email": email,
        "provider": provider
    })


# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# def add_from_candidate_api(request, candidate_id):
#     try:
#         candidate = EmailSubscriptionCandidate.objects.get(
#             id=candidate_id,
#             user=request.user
#         )
#     except EmailSubscriptionCandidate.DoesNotExist:
#         return Response({
#             "error": "Candidate not found"
#         }, status=404)
#     name = request.data.get("name", candidate.detected_service)
#     price = request.data.get("price", 0)
#     start_date = request.data.get("start_date")
#     subscription = Subscription.objects.create(
#         user=request.user,
#         name=name,
#         price=price,
#         start_date=start_date
#     )
#     candidate.is_processed = True
#     candidate.save()
#     return Response({
#         "message": "Subscription created",
#         "subscription_id": subscription.id
#     })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_api(request):
    """
    Logout user (client should delete JWT token)
    """
    return Response({
        "message": "Successfully logged out"
    })