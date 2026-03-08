from django.core.management.base import BaseCommand
from users.email_idle_listener import start_listener


class Command(BaseCommand):
    help = "Start email listener"
    def handle(self, *args, **kwargs):
        print("Starting email listener...")
        start_listener()