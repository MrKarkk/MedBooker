from django.core.management.base import BaseCommand
from core.tasks import backup_database


class Command(BaseCommand):
    help = 'Запускает полный бэкап PostgreSQL немедленно (вызывает Celery-задачу синхронно)'

    def handle(self, *args, **options):
        self.stdout.write('Запуск бэкапа...')
        result = backup_database()
        self.stdout.write(
            self.style.SUCCESS(
                f"Готово: {result['file']} ({result['size_mb']} MB)"
            )
        )
