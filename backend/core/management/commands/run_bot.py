import asyncio

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Запускает Telegram-бота в режиме polling (один процесс)'

    def handle(self, *args, **options):
        from core.utils import run_bot_async
        self.stdout.write('Запуск Telegram-бота...')
        asyncio.run(run_bot_async())
