/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../services/axios';


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Проверка авторизации при загрузке приложения
    useEffect(() => {
        checkAuth();

        // Слушаем событие выхода из системы (из axios interceptor)
        const handleAuthLogout = () => {
            setUser(null);
            setIsAuthenticated(false);
        };

        window.addEventListener('auth:logout', handleAuthLogout);

        return () => {
            window.removeEventListener('auth:logout', handleAuthLogout);
        };
    }, []);

    // Проверка текущей сессии
    const checkAuth = async () => {
        try {
            // Пытаемся получить данные пользователя
            // Токены хранятся в http-only cookies, axios автоматически их отправляет
            const response = await apiClient.get('/users/me/');
            setUser(response.data);
            setIsAuthenticated(true);
        } catch (error) {
            // 401 при первом запуске - это нормально (пользователь не авторизован)
            // Логируем только неожиданные ошибки
            if (error.response?.status !== 401) {
                console.error('Ошибка проверки авторизации:', error);
            }
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    // Регистрация
    const register = async (userData,) => {
        try {
            const response = await apiClient.post('/users/register/', userData);
            setUser(response.data.user);
            setIsAuthenticated(true);
            return { success: true, data: response.data };
        } catch (error) {
            const errorData = error.response?.data || {};
            const errorMessage = errorData.error || 
                                errorData.message ||
                                'Ошибка регистрации';
            return { 
                success: false, 
                error: errorMessage, 
                errors: errorData 
            };
        }
    };

    // Вход
    const login = async (credentials) => {
        try {
            const response = await apiClient.post('/users/login/', credentials);
            setUser(response.data.user);
            setIsAuthenticated(true);
            return { success: true, data: response.data };
        } catch (error) {
            const errorData = error.response?.data || {};
            const errorMessage = errorData.error || 
                                errorData.message ||
                                'Ошибка входа';
            return { 
                success: false, 
                error: errorMessage 
            };
        }
    };

    // Выход
    const logout = async () => {
        try {
            await apiClient.post('/users/logout/');
            window.location.href = '/'
        } catch (error) {
            console.error('Ошибка при выходе:', error);
        } finally {
            // Очищаем локальное состояние
            setUser(null);
            setIsAuthenticated(false);
            
            // Cookies удаляются на бэкенде
            // Диспатчим событие для других компонентов
            window.dispatchEvent(new Event('auth:logout'));
        }
    };

    // Обновление данных пользователя
    const updateUser = (userData) => {
        setUser(prevUser => ({...prevUser, ...userData}));
    };

    // Обновить профиль
    const updateProfile = async (profileData) => {
        try {
            const response = await apiClient.patch('/users/profile/update/', profileData);
            setUser(response.data.user);
            return { success: true, data: response.data };
        } catch (error) {
            const errorData = error.response?.data || {};
            const errorMessage = errorData.error || 'Ошибка обновления профиля';
            return { 
                success: false, 
                error: errorMessage,
                errors: errorData
            };
        }
    };

    const value = {
        user,
        setUser,
        loading,
        isAuthenticated,
        register,
        login,
        logout,
        updateUser,
        updateProfile,
        checkAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook для использования контекста
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth должен использоваться внутри AuthProvider');
    }
    return context;
};

export default AuthContext;
