from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
import json

from django.core.mail import send_mail
from django.conf import settings
from .models import EmailAccount, EmailSubscriptionCandidate
from .email_providers import detect_provider
from .email_validator import test_imap_connection
from .crypto_utils import encrypt_password
from .utils import generate_2fa_code, hash_code


def _json_body(request):
    try:
        return json.loads(request.body.decode('utf-8') or '{}')
    except json.JSONDecodeError:
        return {}


def _require_auth(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication credentials were not provided."}, status=401)
    return None


@csrf_exempt
def login_api(request):
    if request.method != 'POST':
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data = _json_body(request)
    email = (data.get('email') or '').strip()
    password = data.get('password') or ''
    if not email or not password:
        return JsonResponse({"detail": "Email and password required"}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({"detail": "Invalid credentials"}, status=401)

    user = authenticate(request, username=user.username, password=password)
    if not user:
        return JsonResponse({"detail": "Invalid credentials"}, status=401)

    login(request, user)
    return JsonResponse({
        "access": "session",
        "refresh": None,
        "user": {"id": user.id, "username": user.username, "email": user.email},
    })


@csrf_exempt
def logout_api(request):
    logout(request)
    return JsonResponse({"detail": "Logged out"})


@csrf_exempt
def register_api(request):
    if request.method != 'POST':
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data = _json_body(request)
    email = (data.get('email') or '').strip()
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not email or not username or not password:
        return JsonResponse({"detail": "Missing fields"}, status=400)

    if User.objects.filter(email=email).exists():
        return JsonResponse({"detail": "Email already registered"}, status=400)

    request.session["register_data"] = {
        "email": email,
        "username": username,
        "password": password,
    }

    code = generate_2fa_code(6)
    request.session["email_code"] = hash_code(code)
    send_mail(
        "Код подтверждения регистрации",
        f"Ваш код: {code}",
        settings.DEFAULT_FROM_EMAIL,
        [email],
    )

    return JsonResponse({"message": "code_sent"})


@csrf_exempt
def register_verify_api(request):
    if request.method != 'POST':
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data = _json_body(request)
    code = (data.get('code') or '').strip()
    pending = request.session.get("register_data")
    if not pending:
        return JsonResponse({"detail": "Registration data not found"}, status=400)

    if not code:
        return JsonResponse({"detail": "Code required"}, status=400)

    if hash_code(code) != request.session.get("email_code"):
        return JsonResponse({"detail": "Invalid code"}, status=400)

    user = User.objects.create_user(
        username=pending["username"],
        email=pending["email"],
        password=pending["password"]
    )
    login(request, user)
    request.session.pop("register_data", None)
    request.session.pop("email_code", None)
    return JsonResponse({"message": "verified", "access": "session", "refresh": None})


def profile_api(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    email_account = EmailAccount.objects.filter(user=request.user, is_active=True).first()
    candidates_count = EmailSubscriptionCandidate.objects.filter(user=request.user, is_processed=False).count()
    return JsonResponse({
        "id": request.user.id,
        "username": request.user.username,
        "email": request.user.email,
        "email_account": email_account.email if email_account else None,
        "candidates_count": candidates_count,
    })


@csrf_exempt
def connect_email_api(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error
    if request.method != 'POST':
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data = _json_body(request)
    password = (data.get('password') or '').strip()
    if not password:
        return JsonResponse({"error": "Password required"}, status=400)

    provider = detect_provider(request.user.email)
    if not provider:
        return JsonResponse({"error": "Provider not supported"}, status=400)

    if not test_imap_connection(request.user.email, password, provider):
        return JsonResponse({"error": "IMAP connection failed"}, status=400)

    encrypted_password = encrypt_password(password)
    account = EmailAccount.objects.filter(user=request.user).first()
    if account:
        account.email = request.user.email
        account.provider = provider
        account.password = encrypted_password
        account.is_active = True
        account.save()
    else:
        EmailAccount.objects.create(
            user=request.user,
            email=request.user.email,
            provider=provider,
            password=encrypted_password,
        )

    return JsonResponse({"message": "connected", "email": request.user.email, "provider": provider})


@csrf_exempt
def register_device_api(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error
    return JsonResponse({"message": "device registered"})


@csrf_exempt
def test_push_api(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error
    return JsonResponse({"message": "push queued"})

