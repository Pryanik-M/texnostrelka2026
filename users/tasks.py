from celery import shared_task
from imapclient import IMAPClient
from django.utils import timezone
from datetime import timedelta
from .models import EmailAccount, EmailSubscriptionCandidate
from main.models import Subscription  # Модель из твоего views.py
from .subscription_parser import parse_subscription_email
from .email_providers import IMAP_SERVERS
from .notifications import send_detection_notification, send_reminder_notification
import logging
from .push_service import send_user_notifications

logger = logging.getLogger(__name__)


@shared_task
def check_all_emails():
    accounts = EmailAccount.objects.filter(is_active=True)
    for account in accounts:
        check_single_account(account.id)

@shared_task
def check_single_account(account_id):

    account = EmailAccount.objects.get(id=account_id)

    server_host = IMAP_SERVERS.get(account.provider)

    server = IMAPClient(server_host, ssl=True)

    server.login(account.email, account.get_decrypted_password())
    server.select_folder("INBOX")

    # ищем письма после последнего UID
    messages = server.search(["UID", f"{account.last_checked_uid + 1}:*"])[-20:]

    if not messages:
        server.logout()
        return "No new emails"

    new_last_uid = account.last_checked_uid

    for uid, message_data in server.fetch(messages, ["BODY.PEEK[HEADER]"]).items():

        raw_email = message_data[b"BODY[HEADER]"]

        result = parse_subscription_email(raw_email, account.user)

        if not result:
            continue

        message_id = result.get("message_id")

        if message_id:
            exists = EmailSubscriptionCandidate.objects.filter(
                message_id=message_id
            ).exists()

            if exists:
                continue

        candidate = EmailSubscriptionCandidate.objects.create(
            user=account.user,
            subject=result['subject'],
            sender=result['sender'],
            detected_service=result['service'],
            message_id=message_id if message_id else "",
            is_processed=False
        )

        send_detection_notification(
            user=account.user,
            subject=result['subject'],
            service_name=result['service'],
            candidate_id=candidate.id
        )

        send_user_notifications(
            user=account.user,
            title=f"Найдена подписка: {result['service']}",
            body=f"Письмо: {result['subject']}"
        )

        # обновляем последний uid
        if uid > new_last_uid:
            new_last_uid = uid

    account.last_checked_uid = new_last_uid
    account.save(update_fields=["last_checked_uid"])

    server.logout()

    return "Emails processed"

@shared_task
def check_subscription_notifications():
    today = timezone.now().date()
    for days in [1, 3]:
        target_date = today + timedelta(days=days)
        upcoming_subs = Subscription.objects.filter(
            next_payment_date=target_date
        )
        for sub in upcoming_subs:
            # чтобы не отправлять повторно
            if sub.last_notification == today:
                continue
            send_reminder_notification(
                user=sub.user,
                subscription_title=sub.name,
                price=sub.price,
                days_left=days
            )
            sub.last_notification = today
            sub.save(update_fields=["last_notification"])

    return "Reminders checked"