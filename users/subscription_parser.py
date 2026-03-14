import email
from email.header import decode_header
from email.utils import parseaddr


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

COMMON_EMAIL_PROVIDERS = {
    "gmail",
    "yandex",
    "mail",
    "outlook",
    "hotmail",
    "icloud",
    "yahoo",
    "protonmail",
    "aol",
    "zoho",
}


def detect_service_from_email(sender):
    name, email = parseaddr(sender)
    if "@" not in email:
        return name or "Unknown"
    domain = email.split("@")[1]
    service = domain.split(".")[0].lower()
    if service in COMMON_EMAIL_PROVIDERS:
        if name:
            return name
        return name
    return service.capitalize()


def decode_mime_words(text):
    decoded_parts = decode_header(text)
    result = ""
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            result += part.decode(encoding or "utf-8", errors="ignore")
        else:
            result += part
    return result


def decode_sender(sender):
    name, email = parseaddr(sender)
    name = decode_mime_words(name)
    return f"{name} <{email}>"


def decode_subject(subject):
    decoded_parts = decode_header(subject)
    subject_parts = []
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            if encoding:
                subject_parts.append(part.decode(encoding, errors="ignore"))
            else:
                subject_parts.append(part.decode("utf-8", errors="ignore"))
        else:
            subject_parts.append(part)
    return "".join(subject_parts)


def get_body_snippet(msg):
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                body = part.get_payload(decode=True).decode(errors="ignore")
                break
    else:
        body = msg.get_payload(decode=True).decode(errors="ignore")
    return (body[:50] + '...') if len(body) > 50 else body


def parse_subscription_email(raw_email, user):
    msg = email.message_from_bytes(raw_email)
    subject = decode_subject(msg.get("Subject", ""))
    sender_raw = msg.get("From", "")
    sender = decode_sender(sender_raw)
    service = detect_service_from_email(sender)
    snippet = get_body_snippet(msg)
    text_to_check = subject.lower()
    message_id = msg.get("Message-ID")
    for word in KEYWORDS:
        if word in text_to_check:
            return {
                "subject": subject,
                "sender": sender,
                "snippet": snippet,
                "service": service,
                "message_id": message_id
            }
    return None