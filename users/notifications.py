from webpush import send_user_notification

def send_push_notification(user, subject, snippet, candidate_id):
    payload = {
        "title": subject,
        "body": snippet,
        "icon": "/static/icons/subscription.png",
        "candidate_id": candidate_id,
        "actions": [
            {"action": "add", "title": "✅ Добавить"},
            {"action": "ignore", "title": "❌ Игнорировать"}
        ],
        "url": "/subscriptions/detected/"
    }
    # Передаем словарь payload напрямую!
    send_user_notification(user=user, payload=payload, ttl=1000)