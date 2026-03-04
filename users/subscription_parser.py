import email
from email.header import decode_header


KEYWORDS = [
    "subscription",
    "invoice",
    "receipt",
    "payment",
    "подписка",
    "оплата",
    "списание",
    "чек"
]


def decode_subject(subject):
    decoded = decode_header(subject)[0][0]
    if isinstance(decoded, bytes):
        return decoded.decode(errors="ignore")
    return decoded


def parse_subscription_email(raw_email):
    msg = email.message_from_bytes(raw_email)
    subject = decode_subject(msg.get("Subject", ""))
    sender = msg.get("From", "")
    text = subject.lower()
    for word in KEYWORDS:
        if word in text:
            return {
                "subject": subject,
                "sender": sender
            }
    return None