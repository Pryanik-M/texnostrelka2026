# push_service.py
import firebase_admin
from firebase_admin import messaging, credentials
from django.conf import settings
from .models import Device
import logging

logger = logging.getLogger(__name__)


def _ensure_firebase():
    if firebase_admin._apps:
        return
    cred_path = getattr(settings, "FIREBASE_SERVICE_ACCOUNT", None)
    if not cred_path:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT is not set")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)


def send_push(token, title, body, extra_data=None):
    _ensure_firebase()
    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        data=extra_data or {},
        token=token,
    )
    return messaging.send(message)


def send_user_notifications(user, title, body, extra_data=None):
    """Отправляет пуш на ВСЕ устройства пользователя"""
    devices = Device.objects.filter(user=user)
    logger.info(f"DEBUG: Found {devices.count()} devices for user {user.id}")

    results = []
    for device in devices:
        try:
            logger.info(f"DEBUG: Sending to device {device.id} (Token: {device.token[:10]}...)")
            response = send_push(device.token, title, body, extra_data)
            results.append(response)
        except Exception as e:
            logger.error(f"DEBUG: Failed to send to device {device.id}: {e}")
    return results
