import os
import smtplib
import socket
import time
import logging
from email.message import EmailMessage
from pathlib import Path
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)


def test_smtp_connection():
    root_env = Path(__file__).resolve().parent / ".env"
    load_dotenv(dotenv_path=root_env, override=False)
    host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    port = int(os.getenv("EMAIL_PORT", "587"))
    user = os.getenv("EMAIL_HOST_USER")
    password = os.getenv("EMAIL_HOST_PASSWORD")
    use_tls = os.getenv("EMAIL_USE_TLS", "True").lower() == "true"
    use_ssl = os.getenv("EMAIL_USE_SSL", "False").lower() == "true"

    if not user or not password:
        raise RuntimeError("EMAIL_HOST_USER or EMAIL_HOST_PASSWORD is missing in .env")

    safe_password = "*" * 8 if password else None
    logger.info("SMTP settings: host=%s port=%s user=%s tls=%s ssl=%s password=%s",
                host, port, user, use_tls, use_ssl, safe_password)
    logger.info("Proxy env: HTTPS_PROXY=%s HTTP_PROXY=%s ALL_PROXY=%s",
                os.getenv("HTTPS_PROXY"), os.getenv("HTTP_PROXY"), os.getenv("ALL_PROXY"))

    try:
        infos = socket.getaddrinfo(host, port, 0, socket.SOCK_STREAM)
        addrs = [info[4][0] for info in infos]
        logger.info("Resolved %s to: %s", host, ", ".join(addrs))
    except Exception as e:
        logger.exception("DNS resolution failed: %s", e)

    msg = EmailMessage()
    msg.set_content("SMTP test message")
    msg["Subject"] = "SMTP Test"
    msg["From"] = user
    msg["To"] = user

    try:
        t0 = time.time()
        if use_ssl:
            server = smtplib.SMTP_SSL(host, port, timeout=10)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
        logger.info("Connected in %.2fs", time.time() - t0)
        with server:
            server.ehlo()
            if use_tls and not use_ssl:
                server.starttls()
                server.ehlo()
            server.login(user, password)
            server.send_message(msg)
        print("SMTP test email sent successfully!")
    except Exception as e:
        print("SMTP test failed:", e)
        raise


if __name__ == "__main__":
    test_smtp_connection()
