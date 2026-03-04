from webpush import send_user_notification
import json


def send_push_notification(user, message):

    payload = json.dumps({
        "head": "🔔 Новая подписка обнаружена",
        "body": message,
        "icon": "/static/icons/subscription.png",
        "url": "/subscriptions/detected/"
    })

    send_user_notification(
        user=user,
        payload=payload,
        ttl=1000
    )