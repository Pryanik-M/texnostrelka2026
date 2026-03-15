from webpush import send_user_notification

# Тип 1: Найдена новая подписка
def send_detection_notification(user, subject, service_name, candidate_id):
    payload = {
        "title": f"Найдена подписка: {service_name}",
        "body": f"Письмо: {subject}",
        "icon": "/static/icons/subscription.png",
        "url": f"/subscriptions/add/?candidate={candidate_id}/",
        "type": "detection",
        "candidate_id": candidate_id,
        "actions": [
            {"action": "add", "title": "✅ Добавить"},
            {"action": "ignore", "title": "❌ Игнорировать"}
        ]
    }
    send_user_notification(user=user, payload=payload, ttl=1000)

# Тип 2: Напоминание о списании
def send_reminder_notification(user, subscription_title, price, days_left):
    payload = {
        "title": f"Скоро списание: {subscription_title}",
        "body": f"Через {days_left} дн. спишется {price} руб.",
        "icon": "/static/icons/reminder.png",
        "type": "reminder",
        "url": "/main/home/" # Или страница со списком подписок
    }
    send_user_notification(user=user, payload=payload, ttl=3600)