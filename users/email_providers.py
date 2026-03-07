IMAP_SERVERS = {
    "yandex": "imap.yandex.ru",
    "gmail": "imap.gmail.com",
    "mailru": "imap.mail.ru",
}


def detect_provider(email):
    domain = email.split("@")[1].lower()
    if "gmail.com" in domain:
        return "gmail"
    if "yandex" in domain:
        return "yandex"
    if "mail.ru" in domain:
        return "mailru"
    return None