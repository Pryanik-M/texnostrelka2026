import email
from email.header import decode_header
from email.utils import parseaddr
import re

# Strong filtering: classify as subscription / payment / marketing
SUBSCRIPTION_KEYWORDS = [
    "подписк",
    "автоплат",
    "ежемесяч",
    "продлен",
    "продление",
    "renew",
    "recurring",
    "subscription",
    "plan",
    "tariff",
    "тариф",
    "period",
    "billing",
    "next payment",
]

PAYMENT_KEYWORDS = [
    "оплат",
    "списан",
    "чек",
    "квитанц",
    "платеж",
    "payment",
    "paid",
    "receipt",
    "invoice",
]

MARKETING_KEYWORDS = [
    "скидк",
    "акци",
    "распродаж",
    "промокод",
    "купон",
    "бонус",
    "newsletter",
    "новости",
    "дайджест",
    "предложени",
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

AMOUNT_RE = re.compile(r"(\d[\d\s]{1,9})\s*(₽|руб|rub|rur|\$|€)", re.IGNORECASE)
DATE_RE = re.compile(r"\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b")


def detect_service_from_email(sender):
    name, email_addr = parseaddr(sender)
    if "@" not in email_addr:
        return name or "Unknown"
    domain = email_addr.split("@")[1]
    service = domain.split(".")[0].lower()
    if service in COMMON_EMAIL_PROVIDERS:
        return name or email_addr
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
    name, email_addr = parseaddr(sender)
    name = decode_mime_words(name)
    return f"{name} <{email_addr}>" if name else email_addr


def decode_subject(subject):
    decoded_parts = decode_header(subject)
    subject_parts = []
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            subject_parts.append(part.decode(encoding or "utf-8", errors="ignore"))
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
    return (body[:300] + "...") if len(body) > 300 else body


def _has_any(text: str, keywords: list[str]) -> bool:
    return any(word in text for word in keywords)


def classify_email(subject: str, snippet: str):
    text = f"{subject}\n{snippet}".lower()

    has_amount = bool(AMOUNT_RE.search(text))
    has_date = bool(DATE_RE.search(text))
    has_sub = _has_any(text, SUBSCRIPTION_KEYWORDS)
    has_pay = _has_any(text, PAYMENT_KEYWORDS)
    has_marketing = _has_any(text, MARKETING_KEYWORDS)

    # Marketing priority (only if no strong payment/subscription signals)
    if has_marketing and not has_sub and not has_pay:
        return "marketing", 20

    # Subscription requires strong signals
    subscription_score = 0
    if has_sub:
        subscription_score += 40
    if has_amount:
        subscription_score += 30
    if has_date:
        subscription_score += 10
    if "next payment" in text or "ежемесяч" in text or "recurring" in text:
        subscription_score += 20

    if subscription_score >= 70:
        return "subscription", min(subscription_score, 100)

    # Payment (one-off)
    payment_score = 0
    if has_pay:
        payment_score += 40
    if has_amount:
        payment_score += 30
    if has_date:
        payment_score += 10

    if payment_score >= 50:
        return "payment", min(payment_score, 100)

    # Fallback
    return "info", 30 if has_marketing else 10


def parse_subscription_email(raw_email, user):
    msg = email.message_from_bytes(raw_email)
    subject = decode_subject(msg.get("Subject", ""))
    sender_raw = msg.get("From", "")
    sender = decode_sender(sender_raw)
    service = detect_service_from_email(sender)
    snippet = get_body_snippet(msg)

    kind, confidence = classify_email(subject, snippet)
    return {
        "subject": subject,
        "sender": sender,
        "snippet": snippet,
        "service": service,
        "confidence": confidence,
        "kind": kind,
    }
