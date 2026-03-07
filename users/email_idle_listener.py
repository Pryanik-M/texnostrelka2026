import threading
import time
from imapclient import IMAPClient
from .models import EmailAccount, EmailSubscriptionCandidate
from .subscription_parser import parse_subscription_email
from .email_providers import IMAP_SERVERS
from .notifications import send_push_notification


def listen_account(account):
    while True:
        try:
            server = IMAPClient(IMAP_SERVERS[account.provider], ssl=True)
            password = account.get_decrypted_password()
            server.login(account.email, password)
            server.select_folder("INBOX")
            print(f"Listening: {account.email}")
            while True:
                try:
                    server.idle()
                    responses = server.idle_check(timeout=30)
                    server.idle_done()
                    if responses:
                        # Ищем только непрочитанные
                        messages = server.search(["UNSEEN"])
                        for uid, message_data in server.fetch(messages, ["RFC822"]).items():
                            raw_email = message_data[b"RFC822"]
                            # Парсим письмо
                            result = parse_subscription_email(raw_email, account.user)
                            # ЕСЛИ ПИСЬМО ПОДХОДИТ ПОД КРИТЕРИИ:
                            if result:
                                # 1. Сохраняем в базу данных
                                candidate = EmailSubscriptionCandidate.objects.create(
                                    user=account.user,
                                    subject=result['subject'],
                                    sender=result['sender'],
                                    detected_service=result['service'],
                                    # snippet в модели нет, поэтому сохраняем только то что есть
                                    is_processed=False
                                )
                                # 2. ОТПРАВЛЯЕМ УВЕДОМЛЕНИЕ
                                send_push_notification(
                                    user=account.user,
                                    subject=f"Найдена подписка: {result['service']}",
                                    snippet=result['subject'], # используем subject как текст
                                    candidate_id=candidate.id
                                )
                                print(f"--- УВЕДОМЛЕНИЕ ОТПРАВЛЕНО ДЛЯ {account.email} ---")
                                server.add_flags(uid, [b'\\Seen'])
                except Exception as e:
                    print(f"IDLE error for {account.email}: {e}")
                    break
                time.sleep(5)
        except Exception as e:
            print(f"Listener error for {account.email}: {e}")
            print("Reconnecting in 10 seconds...")
            time.sleep(10)


def start_listener_thread(account):
    """
    Запуск отдельного демо-потока для аккаунта.
    """
    thread = threading.Thread(
        target=listen_account,
        args=(account,),
        daemon=True
    )
    thread.start()


def start_all_listeners():
    """
    Запускает слушателей для всех активных аккаунтов.
    """
    accounts = EmailAccount.objects.filter(is_active=True)
    print(f"Starting listeners: {accounts.count()}")
    for account in accounts:
        start_listener_thread(account)