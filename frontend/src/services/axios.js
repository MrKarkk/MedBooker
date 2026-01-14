import axios from 'axios';
import { API_BASE_URL } from '../config';


// Создаем экземпляр axios с поддержкой http-only cookies
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // КРИТИЧНО! Включаем отправку cookies
    headers: {
        'Content-Type': 'application/json',
    },
});


// Функция для получения CSRF токена из cookie
const getCSRFToken = () => {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};


// Request interceptor - добавляем CSRF токен к каждому запросу
apiClient.interceptors.request.use(
    (config) => {
        // Добавляем CSRF токен для методов, изменяющих данные
        if (['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
            const csrfToken = getCSRFToken();
            if (csrfToken) {
                config.headers['X-CSRFToken'] = csrfToken;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


// Response interceptor - автоматическое обновление токенов при 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => {
        // Успешный ответ - просто возвращаем
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Если 401 ошибка и это не повторный запрос
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Исключаем endpoints login, register, refresh, me из retry
            // /me/ исключаем, чтобы при первой загрузке не пытаться рефрешить
            if (originalRequest.url.includes('/login') || 
                originalRequest.url.includes('/register') ||
                originalRequest.url.includes('/refresh') ||
                originalRequest.url.includes('/me')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Если уже идет процесс обновления - добавляем запрос в очередь
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        return apiClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Пытаемся обновить токен
                await apiClient.post('/users/refresh/');
                
                isRefreshing = false;
                processQueue(null);
                
                // Повторяем оригинальный запрос
                return apiClient(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                processQueue(refreshError, null);
                
                // Если обновление не удалось - перенаправляем на логин
                // Это можно делать через событие или через navigation
                window.dispatchEvent(new CustomEvent('auth:logout'));
                
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);


export default apiClient;