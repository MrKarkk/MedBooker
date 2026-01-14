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
    libffi-dev \
    && apk add --no-cache \
    ca-certificates

# Создаем виртуальное окружение
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Копируем и устанавливаем Python зависимости
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt && \
    find /opt/venv -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true && \
    find /opt/venv -type d -name "*.dist-info" -exec rm -rf {}/direct_url.json {} + 2>/dev/null || true

# Удаляем build-зависимости
RUN apk del .build-deps

# ==================== STAGE 2: Runtime ====================
FROM python:3.11-alpine AS runtime

# Устанавливаем переменные окружения
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"

# Устанавливаем только runtime зависимости
RUN apk add --no-cache \
    ca-certificates \
    && addgroup -g 1000 botuser \
    && adduser -D -u 1000 -G botuser botuser

# Создаем рабочую директорию
WORKDIR /app

# Копируем виртуальное окружение из builder
COPY --from=builder /opt/venv /opt/venv

# Копируем код приложения с правильными правами
COPY --chown=botuser:botuser . .

# Переключаемся на непривилегированного пользователя
USER botuser

# Открываем порт для FastAPI
EXPOSE 3000

# Запускаем бота через uvicorn
CMD ["python", "main.py"]
