import email
import time
from imapclient import IMAPClient
from django.contrib.auth import get_user_model
from users.models import EmailAccount, EmailSubscriptionCandidate
from users.subscription_parser import parse_subscription_email
from users.notifications import send_push_notification


def process_email(raw_email, user):
    result = parse_subscription_email(raw_email)
    if result:
        # Передаем и тему (subject), и кусочек текста (snippet)
        candidate = EmailSubscriptionCandidate.objects.create(
            user=user,
            subject=result["subject"],
            sender=result["sender"],
            detected_service=result["service"]
        )

        send_push_notification(
            user,
            result["subject"],
            result.get("snippet", "Текст письма пустой"),
            candidate.id
        )
        print("Subscription detected:", result["subject"])


def listen_account(account):
    try:
        server = IMAPClient("imap.yandex.ru", ssl=True)
        server.login(account.email, account.password)
        server.select_folder("INBOX")
        print("Listening:", account.email)
        while True:
            print("Waiting for new email...")
            server.idle()
            responses = server.idle_check(timeout=300)
            print("Responses:", responses)
            server.idle_done()
            if responses:
                messages = server.search(["UNSEEN"])
                for uid in messages:
                    response = server.fetch([uid], ["RFC822"])
                    raw = response[uid][b"RFC822"]
                    process_email(raw, account.user)
    except Exception as e:
        print("Listener error:", e)
        time.sleep(10)


def start_listener():
    while True:
        accounts = EmailAccount.objects.filter(is_active=True)
        if not accounts:
            print("No email accounts")
            time.sleep(10)
            continue
        for account in accounts:
            listen_account(account)