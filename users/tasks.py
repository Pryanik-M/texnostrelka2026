from celery import shared_task
from imapclient import IMAPClient
from .models import EmailAccount, EmailSubscriptionCandidate
from .subscription_parser import parse_subscription_email
from .email_providers import IMAP_SERVERS
from .notifications import send_push_notification
import logging

logger = logging.getLogger(__name__)


@shared_task
def check_all_emails():
    """Задача, которая проходит по всем активным почтам"""
    accounts = EmailAccount.objects.filter(is_active=True)
    for account in accounts:
        check_single_account.delay(account.id)


@shared_task
def check_single_account(account_id):
    """Проверка одного конкретного ящика"""
    try:
        account = EmailAccount.objects.get(id=account_id)
        server = IMAPClient(IMAP_SERVERS[account.provider], ssl=True)
        server.login(account.email, account.get_decrypted_password())
        server.select_folder("INBOX")

        # Ищем непрочитанные
        messages = server.search(["UNSEEN"])
        if not messages:
            return f"No new emails for {account.email}"

        for uid, message_data in server.fetch(messages, ["RFC822"]).items():
            raw_email = message_data[b"RFC822"]
            result = parse_subscription_email(raw_email, account.user)

            if result:
                candidate = EmailSubscriptionCandidate.objects.create(
                    user=account.user,
                    subject=result['subject'],
                    sender=result['sender'],
                    detected_service=result['service'],
                    is_processed=False
                )

                send_push_notification(
                    user=account.user,
                    subject=f"Найдена подписка: {result['service']}",
                    snippet=result['subject'],
                    candidate_id=candidate.id
                )
                # Помечаем как прочитанное, чтобы не спамить
                server.add_flags(uid, [b'\\Seen'])

        server.logout()
        return f"Success check for {account.email}"
    except Exception as e:
        logger.error(f"Error checking {account_id}: {e}")
        return str(e)