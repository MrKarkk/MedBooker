# ==================== STAGE 1: Dependencies ====================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Оптимизация npm для медленных сетей
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000

# Копируем только package files для кэширования слоя зависимостей
COPY package*.json ./

# Устанавливаем зависимости с оптимизацией
RUN npm ci --only=production --ignore-scripts --prefer-offline || \
    npm ci --only=production --ignore-scripts || \
    npm install --only=production --ignore-scripts && \
    npm cache clean --force

# ==================== STAGE 2: Builder ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Оптимизация npm
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000

# Копируем package files
COPY package*.json ./

# Устанавливаем все зависимости (включая dev) с retry
RUN npm ci --ignore-scripts --prefer-offline || \
    npm ci --ignore-scripts || \
    npm install --ignore-scripts && \
    npm cache clean --force

# Копируем исходный код
COPY . .

# Сборка production версии
RUN npm run build

# ==================== STAGE 3: Production Runtime ====================
FROM nginx:1.27-alpine AS production

# Устанавливаем переменные окружения
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d

# Удаляем дефолтную конфигурацию nginx
RUN rm -rf /etc/nginx/conf.d/* && \
    rm -rf /usr/share/nginx/html/*

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем оптимизированную nginx конфигурацию
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

# Запуск nginx
STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]
