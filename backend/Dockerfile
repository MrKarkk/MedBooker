# DEV
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"].


# PRODUCTION
# FROM python:3.11-slim

# WORKDIR /app

# ENV PYTHONUNBUFFERED=1 \
#     PYTHONDONTWRITEBYTECODE=1

# # зависимости системы
# RUN apt-get update && apt-get install -y \
#     libpq-dev \
#     gcc \
#     && rm -rf /var/lib/apt/lists/*

# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# COPY . .

# # создаем пользователя
# RUN useradd -m appuser
# USER appuser

# CMD ["gunicorn", "backend.wsgi:application",
#         "--bind", "0.0.0.0:8000",
#         "--workers", "2"]