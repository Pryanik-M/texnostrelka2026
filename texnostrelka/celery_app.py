import os
from celery import Celery

# Указываем настройки Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'texnostrelka.settings')

app = Celery('texnostrelka')

# Читаем конфиг из settings.py с префиксом CELERY_
app.config_from_object('django.conf:settings', namespace='CELERY')

# Автоматически ищем задачи (tasks.py) в приложениях
app.autodiscover_tasks()