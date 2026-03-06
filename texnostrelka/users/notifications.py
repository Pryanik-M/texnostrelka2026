from webpush import send_user_notification


def send_push_notification(user, candidate):

    payload = {
        "title": "Найдена новая подписка",
        "body": candidate.subject
    }

    send_user_notification(
        user=user,
        payload=payload,
        ttl=1000
    )