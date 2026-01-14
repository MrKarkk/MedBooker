/**
 * API сервис для работы с безопасной JWT аутентификацией через http-only cookies
 * Все токены хранятся в http-only cookies и автоматически отправляются с запросами
 */
import apiClient from './axios';


const authAPI = {
    /**
     * Регистрация нового пользователя
     * @param {Object} userData - Данные пользователя (email, full_name, phone_number, password, password_confirm, role)
     * @returns {Promise<Object>} - { user, access_token, message }
     */
    register: async (userData) => {
        const response = await apiClient.post('/users/register/', userData);
        return response.data;
    },

    /**
     * Вход в систему
     * @param {Object} credentials - Данные для входа (email, password)
     * @returns {Promise<Object>} - { user, access_token, message }
     */
    login: async (credentials) => {
        const response = await apiClient.post('/users/login/', credentials);
        return response.data;
    },

    /**
     * Выход из системы
     * Удаляет токены из cookies на бэкенде
     * @returns {Promise<Object>} - { message }
     */
    logout: async () => {
        const response = await apiClient.post('/users/logout/');
        return response.data;
    },

    /**
     * Обновление access токена
     * Использует refresh токен из http-only cookie
     * @returns {Promise<Object>} - { access }
     */
    refresh: async () => {
        const response = await apiClient.post('/users/refresh/');
        return response.data;
    },

    /**
     * Получение информации о текущем пользователе
     * @returns {Promise<Object>} - Данные пользователя
     */
    getMe: async () => {
        const response = await apiClient.get('/users/me/');
        return response.data;
    },

    /**
     * Обновление профиля пользователя
     * @param {Object} profileData - Данные для обновления
     * @returns {Promise<Object>} - { user, message }
     */
    updateProfile: async (profileData) => {
        const response = await apiClient.patch('/users/profile/update/', profileData);
        return response.data;
    },

    /**
     * Смена пароля
     * @param {Object} passwordData - { old_password, new_password, new_password_confirm }
     * @returns {Promise<Object>} - { message }
     */
    changePassword: async (passwordData) => {
        const response = await apiClient.post('/users/password/change/', passwordData);
        return response.data;
    },
};


export default authAPI;