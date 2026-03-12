from celery import shared_task
from imapclient import IMAPClient
from django.utils import timezone
from datetime import timedelta
from .models import EmailAccount, EmailSubscriptionCandidate
from main.models import Subscription
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
        check_single_account.delay(account.id)


@shared_task
def check_single_account(account_id):
    try:
        account = EmailAccount.objects.get(id=account_id)
        server_host = IMAP_SERVERS.get(account.provider)
        if not server_host:
            return "Unsupported provider"
        server = IMAPClient(server_host, ssl=True)
        server.login(account.email, account.get_decrypted_password())
        server.select_folder("INBOX")
        messages = server.search(["UNSEEN"])
        if not messages:
            return f"No new emails for {account.email}"
        for uid, message_data in server.fetch(messages, ["RFC822"]).items():
            raw_email = message_data[b"RFC822"]
            result = parse_subscription_email(raw_email, account.user)

            if result['kind'] == 'subscription':
                candidate = EmailSubscriptionCandidate.objects.create(
                    user=account.user,
                    subject=result['subject'],
                    sender=result['sender'],
                    detected_service=result['service'],
                    snippet=result.get('snippet') or '',
                    confidence=int(result.get('confidence', 0) or 0),
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
            elif result['kind'] == 'payment':
                send_user_notifications(
                    user=account.user,
                    title="Платёж по подписке",
                    body=result['subject'] or "Найдено списание/оплата"
                )
            elif result['kind'] == 'marketing':
                # Маркетинг игнорируем
                pass
            else:
                send_user_notifications(
                    user=account.user,
                    title="Новое письмо",
                    body=result['subject'] or "Новое уведомление"
                )

            server.add_flags(uid, [b'\\Seen'])
        server.logout()
        return f"Success check for {account.email}"
    except Exception as e:
        logger.error(f"Error checking {account_id}: {e}")
        return str(e)


@shared_task
def check_subscription_notifications():
    """Проверка предстоящих списаний (за 1-3 дня)"""
    today = timezone.now().date()
    for days in [1, 3]:
        target_date = today + timedelta(days=days)
        upcoming_subs = Subscription.objects.filter(next_payment_date=target_date)
        for sub in upcoming_subs:
            send_reminder_notification(
                user=sub.user,
                subscription_title=sub.name,
                price=sub.price,
                days_left=days
            )
    return "Reminders checked"
