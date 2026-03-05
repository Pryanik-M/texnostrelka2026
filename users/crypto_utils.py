from cryptography.fernet import Fernet
from django.conf import settings


def get_cipher():
    return Fernet(settings.EMAIL_ENCRYPTION_KEY)


def encrypt_password(password: str) -> str:
    cipher = get_cipher()
    return cipher.encrypt(password.encode()).decode()


def decrypt_password(token: str) -> str:
    cipher = get_cipher()
    return cipher.decrypt(token.encode()).decode()