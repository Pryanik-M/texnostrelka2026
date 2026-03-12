from cryptography.fernet import Fernet
from django.conf import settings
from pathlib import Path


def get_cipher():
    key = settings.EMAIL_ENCRYPTION_KEY
    if not key:
        generated = Fernet.generate_key().decode()
        env_path = Path(settings.BASE_DIR) / ".env"
        if env_path.exists():
            existing = env_path.read_text(encoding="utf-8")
            if "EMAIL_ENCRYPTION_KEY" not in existing:
                env_path.write_text(
                    existing.rstrip() + f"\nEMAIL_ENCRYPTION_KEY={generated}\n",
                    encoding="utf-8",
                )
        settings.EMAIL_ENCRYPTION_KEY = generated
        key = generated
    return Fernet(key)


def encrypt_password(password: str) -> str:
    cipher = get_cipher()
    return cipher.encrypt(password.encode()).decode()


def decrypt_password(token: str) -> str:
    cipher = get_cipher()
    return cipher.decrypt(token.encode()).decode()
