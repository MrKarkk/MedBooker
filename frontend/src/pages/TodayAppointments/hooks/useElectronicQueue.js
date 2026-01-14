import { useState, useEffect, useRef } from 'react';
import axios from '../../../services/axios';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Хук для отображения электронной очереди с SSE обновлениями
 * 
 * @param {number} clinicId - ID клиники
 * @param {Function} onVoiceAnnouncement - Callback для голосовых объявлений
 */
export const useElectronicQueue = (clinicId, onVoiceAnnouncement) => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading] = useState(false);
    const [error, setError] = useState(null);
    const [isElectronicQueue, setIsElectronicQueue] = useState(false);
    const [reconnectTrigger, setReconnectTrigger] = useState(0);
    const eventSourceRef = useRef(null);
    const onVoiceAnnouncementRef = useRef(onVoiceAnnouncement);

    // Обновляем ref при изменении callback
    useEffect(() => {
        onVoiceAnnouncementRef.current = onVoiceAnnouncement;
    }, [onVoiceAnnouncement]);

    // Проверка прав доступа
    const hasAccess = user?.role === 'clinic_admin';

    /**
     * Подключение к SSE для получения обновлений записей в реальном времени
     */
    useEffect(() => {
        if (!hasAccess || !clinicId) {
            return;
        }

        // Закрываем предыдущее соединение, если есть
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        // Получаем SSE токен из обычного cookie (не http-only)
        const getCookie = (name) => {
            const nameEQ = name + '=';
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        };
        
        const sseToken = getCookie('sse_token');
        if (!sseToken) {
            console.error('SSE token not found. Please re-login.');
            return;
        }

        const url = `${axios.defaults.baseURL}/appointment/clinic/${clinicId}/queue/sse/?token=${sseToken}`;
        const eventSource = new EventSource(url);

        eventSource.onopen = () => {
            setError(null);
        };

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'connected') {
                // console.log('Connected to SSE:', data);
            } else if (data.type === 'initial') {
                // Начальная загрузка всех записей на сегодня
                setAppointments(data.appointments || []);
                setIsElectronicQueue(true);
            } else if (data.type === 'update') {
                // Обновление всех записей
                setAppointments(data.appointments || []);
                
                // Обработка голосовых объявлений
                if (data.voice_announcements && data.voice_announcements.length > 0) {
                    data.voice_announcements.forEach(announcement => {
                        if (onVoiceAnnouncementRef.current) {
                            onVoiceAnnouncementRef.current(announcement);
                        }
                    });
                }
            } else if (data.type === 'new') {
                // Новая запись (может быть создана другим админом)
                setAppointments(prev => {
                    // Проверяем, чтобы не добавить дубликат
                    if (prev.some(apt => apt.id === data.appointment.id)) {
                        return prev;
                    }
                    return [data.appointment, ...prev];
                });
            } else if (data.type === 'delete') {
                // Удаление записи
                setAppointments(prev => prev.filter(apt => apt.id !== data.appointment_id));
            }
        };

        eventSource.onerror = (err) => {
            console.error('SSE error:', err);
            setError('Потеряно соединение с сервером. Переподключение...');
            
            // Попытка переподключения через 5 секунд
            setTimeout(() => {
                setReconnectTrigger(prev => prev + 1);
            }, 5000);
        };

        eventSourceRef.current = eventSource;

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [clinicId, hasAccess, reconnectTrigger]); // Убрали onVoiceAnnouncement из зависимостей

    return {
        appointments,
        loading,
        error,
        hasAccess,
        isElectronicQueue,
    };
};
