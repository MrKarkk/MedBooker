# Подключаем Celery при старте Django, чтобы beat-задачи работали корректно
from .celery import app as celery_app

__all__ = ('celery_app',)
