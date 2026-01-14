from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# Загружаем переменные окружения из .env файла
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('SECRET_KEY')

DEBUG = os.getenv('DEBUG', 'True')
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost').split(',')

# База данных
DATABASE_ENGINE = os.getenv('DB_ENGINE', 'django.db.backends.sqlite3')
DATABASE_NAME = os.getenv('DB_NAME', 'db.sqlite3')
DATABASE_USER = os.getenv('DB_USER', '')
DATABASE_PASSWORD = os.getenv('DB_PASSWORD', '')
DATABASE_HOST = os.getenv('DB_HOST', 'localhost')
DATABASE_PORT = os.getenv('DB_PORT', '5432')


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'core',
    'users',
    'appointment',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.RequestLoggingMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


DATABASES = {
    'default': {
        'ENGINE': DATABASE_ENGINE,
        'NAME': BASE_DIR / DATABASE_NAME if DATABASE_ENGINE == 'django.db.backends.sqlite3' else DATABASE_NAME,
        'USER': DATABASE_USER,
        'PASSWORD': DATABASE_PASSWORD,
        'HOST': DATABASE_HOST,
        'PORT': DATABASE_PORT,
        'CONN_MAX_AGE': 600, 
        'OPTIONS': {
            # Для PostgreSQL
            'connect_timeout': 10,
        } if DATABASE_ENGINE == 'django.db.backends.postgresql' else {},
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Локализация уже определена выше из .env
USE_I18N = True

USE_TZ = True


STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'users.User'

TIME_ZONE = os.getenv('TIME_ZONE', 'UTC')
LANGUAGE_CODE = os.getenv('LANGUAGE_CODE', 'ru-RU')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'users.authenticate.CustomAuthentication',  # Используем кастомную аутентификацию
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'core.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
}

ACCESS_TOKEN_LIFETIME_MINUTES = int(os.getenv('ACCESS_TOKEN_LIFETIME_MINUTES', '5'))  # Уменьшаем до 5 минут
REFRESH_TOKEN_LIFETIME_DAYS = int(os.getenv('REFRESH_TOKEN_LIFETIME_DAYS', '1'))  # 1 день для refresh

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=ACCESS_TOKEN_LIFETIME_MINUTES),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=REFRESH_TOKEN_LIFETIME_DAYS),
    'ROTATE_REFRESH_TOKENS': True,  # Создавать новый refresh token при обновлении
    'BLACKLIST_AFTER_ROTATION': True,  # Инвалидировать старый refresh token
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    
    'JTI_CLAIM': 'jti',
    
    # ========== HTTP-ONLY COOKIE SETTINGS ==========
    # Имя cookie для access token
    'AUTH_COOKIE': 'access',
    # Имя cookie для refresh token
    'AUTH_COOKIE_REFRESH': 'refresh',
    # Домен для cookie (None = текущий домен)
    'AUTH_COOKIE_DOMAIN': None,
    # HTTPS only (False для разработки, True для продакшена)
    'AUTH_COOKIE_SECURE': False,  # Установите True в production с HTTPS
    # HTTP-only флаг - JavaScript не может получить доступ к cookie
    'AUTH_COOKIE_HTTP_ONLY': True,
    # Путь cookie
    'AUTH_COOKIE_PATH': '/',
    # SameSite защита от CSRF (None для кросс-доменных запросов, Lax для продакшена)
    'AUTH_COOKIE_SAMESITE': 'Lax',  # Измените на 'Strict' в production если не нужны кросс-доменные запросы
}

cors_origins = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_origins.split(',')]

CORS_ALLOW_CREDENTIALS = True  # Разрешить отправку cookies

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

SESSION_COOKIE_SECURE = False  # True в production с HTTPS
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'  # 'Strict' в production

CSRF_COOKIE_SECURE = False  # True в production с HTTPS
CSRF_COOKIE_HTTPONLY = False  # False чтобы JS мог читать для CSRF токена
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS  # Доверяем тем же origin что и для CORS

# Expose CSRF token в headers для фронтенда
CORS_EXPOSE_HEADERS = ['Content-Type', 'X-CSRFToken']

REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = os.getenv('REDIS_PORT', '6379')
REDIS_DB = os.getenv('REDIS_DB', '0')

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache' if os.getenv('USE_REDIS', 'False') == 'True' else 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}' if os.getenv('USE_REDIS', 'False') == 'True' else 'unique-snowflake',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        } if os.getenv('USE_REDIS', 'False') == 'True' else {},
        'KEY_PREFIX': 'medbooker',
        'TIMEOUT': 300,  # 5 минут по умолчанию
    }
}

# Session в Redis для production
if os.getenv('USE_REDIS', 'False') == 'True':
    SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
    SESSION_CACHE_ALIAS = 'default'


LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'maxBytes': 1024 * 1024 * 10,  # 10 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'file'],
            'level': 'WARNING',
            'propagate': False,
        },
        'core': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

SENTRY_DSN = os.getenv('SENTRY_DSN', '')

if SENTRY_DSN and not DEBUG:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,  # 10% транзакций для performance monitoring
        send_default_pii=False,  # Не отправлять персональные данные
        environment=os.getenv('ENVIRONMENT', 'production'),
    )

# Для production
if not DEBUG:
    # Минификация и сжатие
    STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'
    
    # Security
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'

# Django Debug Toolbar (только для разработки)
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
    INTERNAL_IPS = ['127.0.0.1']


# Логирование медленных запросов
if DEBUG:
    LOGGING['loggers']['django.db.backends'] = {
        'handlers': ['console'],
        'level': 'DEBUG',
        'propagate': False,
    }

# Настройки для Bot Service
BOT_SERVICE_URL = os.getenv('BOT_SERVICE_URL', 'http://0.0.0.0:3000')
BOT_API_SECRET = os.getenv('BOT_API_SECRET', 'your-secret-key')
SUPERADMIN_TELEGRAM_ID = [int(x) for x in os.getenv('SUPERADMIN_TELEGRAM_ID', '').split(',') if x.strip().isdigit()]

# Настройки для SpeechKit
SPEECHKIT_API_KEY = os.getenv('SPEECHKIT_API_KEY', '')
SPEECHKIT_URL = os.getenv('SPEECHKIT_URL', '')