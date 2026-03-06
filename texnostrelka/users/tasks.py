from celery import shared_task
from .models import EmailAccount, EmailSubscriptionCandidate
from .email_scanner import scan_yandex_email
from .notifications import send_push_notification


@shared_task
def check_emails():
    accounts = EmailAccount.objects.filter(is_active=True)
    for account in accounts:
        emails = scan_yandex_email(account.email, account.password)
        for email_data in emails:
            exists = EmailSubscriptionCandidate.objects.filter(
                user=account.user,
                subject=email_data["subject"]
            ).exists()
            if not exists:
                candidate = EmailSubscriptionCandidate.objects.create(
                    user=account.user,
                    subject=email_data["subject"],
                    sender=email_data["sender"],
                    detected_service=email_data["sender"]
                )
                send_push_notification(account.user, candidate)