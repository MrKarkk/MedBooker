import { useState } from 'react';
import appointmentAPI from '../../../services/appointment';

/**
 * Хук для управления действиями над записями
 * @param {Object} params - Параметры
 * @param {Object} params.notify - Объект для показа уведомлений
 * @param {Function} params.onSuccess - Коллбэк при успешном действии
 * @returns {Object} - Методы для работы с записями
 */
export function useAppointmentActions({ notify, onSuccess }) {
    const [actionLoading, setActionLoading] = useState(false);

    // Удаление записи
    const deleteAppointment = async (appointmentId) => {
        const loadingId = notify.loading('Удаление записи...');
        setActionLoading(true);

        try {
            await appointmentAPI.deleteAppointment(appointmentId);
            notify.hide(loadingId);
            notify.success('Запись успешно удалена');
            
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            notify.hide(loadingId);
            notify.error('Не удалось удалить запись');
            console.error('Ошибка удаления записи:', err);
        } finally {
            setActionLoading(false);
        }
    };

    // Изменение статуса записи
    const updateAppointmentStatus = async (appointmentId, newStatus) => {
        const loadingId = notify.loading('Обновление статуса...');
        setActionLoading(true);

        try {
            await appointmentAPI.updateAppointment(appointmentId, { status: newStatus });

            notify.hide(loadingId);
            notify.success('Статус обновлен');
            
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            notify.hide(loadingId);
            notify.error('Не удалось обновить статус');
            console.error('Ошибка обновления статуса:', err);
        } finally {
            setActionLoading(false);
        }
    };

    // Полное обновление записи
    const updateAppointment = async (appointmentId, data) => {
        const loadingId = notify.loading('Сохранение изменений...');
        setActionLoading(true);

        try {
            await appointmentAPI.updateAppointment(appointmentId, data);
            
            notify.hide(loadingId);
            notify.success('Запись обновлена');
            
            if (onSuccess) {
                onSuccess();
            }
            
            return true;
        } catch (err) {
            notify.hide(loadingId);
            notify.error('Не удалось обновить запись');
            console.error('Ошибка обновления записи:', err);
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        actionLoading,
        deleteAppointment,
        updateAppointmentStatus,
        updateAppointment,
    };
}
