import smtplib
from email.message import EmailMessage
import pytest

def test_smtp_connection():
    msg = EmailMessage()
    msg.set_content("Тестовое письмо из pytest")
    msg['Subject'] = "Тест SMTP"
    msg['From'] = "matveypryanikov09@gmail.com"
    msg['To'] = "matveypryanikov09@gmail.com"

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login("matveypryanikov09@gmail.com", "hjraigexfzysymvs")
            server.send_message(msg)
        print("Письмо отправлено успешно!")
        assert True  # тест прошёл
    except Exception as e:
        print("Ошибка:", e)
        pytest.fail(f"SMTP тест провален: {e}")