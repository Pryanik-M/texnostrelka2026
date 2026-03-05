from django.apps import AppConfig
import threading
import os


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "users"

    def ready(self):

        if os.environ.get("RUN_MAIN") != "true":
            return

        from .email_idle_listener import start_listener

        thread = threading.Thread(target=start_listener)
        thread.daemon = True
        thread.start()