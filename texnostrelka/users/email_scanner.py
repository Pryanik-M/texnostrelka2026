import imaplib
import email
from email.header import decode_header
from .subscription_parser import extract_price

KEYWORDS = [
    "подписка",
    "subscription",
    "payment",
    "списание",
    "оплата",
    "renew",
]

def decode_mime_words(s):
    if not s:
        return ""
    decoded_parts = decode_header(s)
    decoded_string = ""
    for part, encoding in decoded_parts:

        if isinstance(part, bytes):
            decoded_string += part.decode(encoding or "utf-8", errors="ignore")
        else:
            decoded_string += part
    return decoded_string


def scan_yandex_email(email_address, password):
    mail = imaplib.IMAP4_SSL("imap.yandex.ru", 993)
    mail.login(email_address, password)
    mail.select("inbox")
    status, messages = mail.search(None, "ALL")
    mail_ids = messages[0].split()
    results = []
    for num in mail_ids[-20:]:
        status, msg_data = mail.fetch(num, "(RFC822)")
        msg = email.message_from_bytes(msg_data[0][1])
        subject, encoding = decode_header(msg["Subject"])[0]
        if isinstance(subject, bytes):
            subject = subject.decode(encoding or "utf-8")
        sender = decode_mime_words(msg.get("From"))
        message_id = msg.get("Message-ID")
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    body = part.get_payload(decode=True).decode(errors="ignore")
        else:
            body = msg.get_payload(decode=True).decode()
        text = (subject + body).lower()
        price, currency = extract_price(text)
        for keyword in KEYWORDS:
            if keyword in text:
                results.append({
                    "subject": subject,
                    "sender": sender,
                    "price": price,
                    "currency": currency,
                    "message_id": message_id
                })
                break
    mail.logout()
    return results
