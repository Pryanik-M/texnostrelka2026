import imaplib
from .email_providers import IMAP_SERVERS


def test_imap_connection(email, password, provider):
    server = IMAP_SERVERS.get(provider)
    try:
        mail = imaplib.IMAP4_SSL(server)
        mail.login(email, password)
        mail.logout()
        return True
    except Exception:
        return False