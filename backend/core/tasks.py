import subprocess
import os
import logging
from datetime import datetime
from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(
    name='core.tasks.backup_database',
    bind=True,
    max_retries=2,
    default_retry_delay=300,  # 5 минут между повторами
    soft_time_limit=600,      # 10 минут — мягкий лимит
    time_limit=900,           # 15 минут — жёсткий лимит
)
def backup_database(self):
    """Создаёт полный бэкап PostgreSQL в папку backups/."""
    db_config = settings.DATABASES['default']
    db_name = db_config.get('NAME')
    db_user = db_config.get('USER')
    db_password = db_config.get('PASSWORD')
    db_host = db_config.get('HOST', 'localhost')
    db_port = db_config.get('PORT', '5432')

    # Папка backups/ рядом с manage.py (BASE_DIR)
    backup_dir = os.path.join(settings.BASE_DIR, 'backups')
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f'db_backup_{timestamp}.dump'
    backup_path = os.path.join(backup_dir, backup_filename)

    command = [
        'pg_dump',
        '--no-password',
        '--format=custom',   # бинарный сжатый формат, для pg_restore
        f'--file={backup_path}',
        f'--host={db_host}',
        f'--port={db_port}',
        f'--username={db_user}',
        db_name,
    ]

    env = os.environ.copy()
    env['PGPASSWORD'] = db_password  # пароль через env, не в командной строке

    try:
        subprocess.run(command, env=env, check=True, capture_output=True, text=True)
        size_mb = os.path.getsize(backup_path) / (1024 * 1024)
        logger.info(f'[backup] Создан бэкап: {backup_filename} ({size_mb:.2f} MB)')
        return {'status': 'ok', 'file': backup_filename, 'size_mb': round(size_mb, 2)}
    except subprocess.CalledProcessError as e:
        logger.error(f'[backup] Ошибка pg_dump: {e.stderr}')
        raise self.retry(exc=Exception(e.stderr))
