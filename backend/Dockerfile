# ==================== STAGE 1: Builder ====================
FROM python:3.11-alpine AS builder

# Устанавливаем переменные окружения для оптимизации
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Используем более быстрое зеркало Alpine
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories || true

# Устанавливаем системные зависимости для сборки
RUN apk add --no-cache --virtual .build-deps \
    gcc \
    musl-dev \
    postgresql-dev \
    linux-headers \
    libffi-dev \
    jpeg-dev \
    zlib-dev \
    && apk add --no-cache \
    postgresql-libs \
    libpq \
    libjpeg

# Создаем виртуальное окружение для изоляции зависимостей
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Копируем и устанавливаем Python зависимости
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt && \
    find /opt/venv -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true && \
    find /opt/venv -type d -name "*.dist-info" -exec rm -rf {}/direct_url.json {} + 2>/dev/null || true

# Удаляем build-зависимости для уменьшения размера
RUN apk del .build-deps

# ==================== STAGE 2: Runtime ====================
FROM python:3.11-alpine AS runtime

# Устанавливаем переменные окружения
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH" \
    DJANGO_SETTINGS_MODULE=backend.settings

# Устанавливаем только runtime зависимости
RUN apk add --no-cache \
    postgresql-libs \
    libpq \
    libjpeg \
    wget \
    && addgroup -g 1000 django \
    && adduser -D -u 1000 -G django django

# Создаем рабочую директорию
WORKDIR /app

# Копируем виртуальное окружение из builder
COPY --from=builder /opt/venv /opt/venv

# Копируем код приложения с правильными правами
COPY --chown=django:django . .

# Создаем необходимые директории
RUN mkdir -p /app/staticfiles /app/media /app/logs && \
    chown -R django:django /app/staticfiles /app/media /app/logs && \
    chmod -R 755 /app/staticfiles /app/media /app/logs

# Переключаемся на непривилегированного пользователя
USER django

# Открываем порт
EXPOSE 8000

# Запускаем через gunicorn с оптимизированными параметрами
CMD ["gunicorn", \
    "--bind", "0.0.0.0:8000", \
    "--workers", "4", \
    "--worker-class", "gthread", \
    "--threads", "2", \
    "--timeout", "120", \
    "--keep-alive", "5", \
    "--max-requests", "1000", \
    "--max-requests-jitter", "50", \
    "--access-logfile", "-", \
    "--error-logfile", "-", \
    "--log-level", "info", \
    "backend.wsgi:application"]