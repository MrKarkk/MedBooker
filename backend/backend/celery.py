import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')

# Читаем конфиг из settings с префиксом CELERY_
app.config_from_object('django.conf:settings', namespace='CELERY')

# Автоматическое обнаружение tasks.py во всех INSTALLED_APPS
app.autodiscover_tasks()

# Расписание периодических задач
app.conf.beat_schedule = {
    'backup-db-daily-midnight': {
        'task': 'core.tasks.backup_database',
        'schedule': crontab(hour=0, minute=0),  # каждый день в 00:00
        'options': {
            'priority': 0,          # низкий приоритет, не мешает основному трафику
            'queue': 'backup',
        },
    },
}

app.conf.timezone = 'Asia/Dushambe'
