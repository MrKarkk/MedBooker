import { useState, useEffect, useCallback } from 'react';
import axios from '../../../services/axios';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Хук для управления электронной очередью клиники админом
 * 
 * Функционал:
 * - Получение настроек клиники (услуги/врачи для записи)
 * - Создание записи через электронную очередь
 * - Автоматический выбор врача при записи по услуге
 * - Генерация номера талона
 * - Автоматическое определение статуса (invited/pending)
 * 
 * @param {number} clinicId - ID клиники
 */
export const useAdminClinicBooking = (clinicId) => {
    const { user } = useAuth();
    const [queueSettings, setQueueSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Проверка прав доступа
    // clinic_admin - может создавать записи и видеть очередь
    // clinic_queue_admin - может только видеть очередь
    const hasAccess = user?.role === 'clinic_admin' || user?.role === 'clinic_queue_admin';
    const canCreateAppointments = user?.role === 'clinic_admin';

    /**
     * Загрузка настроек электронной очереди клиники
     */
    const fetchQueueSettings = useCallback(async () => {
        if (!hasAccess || !clinicId) {
            return;
        }

        try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/appointment/clinic/${clinicId}/queue-settings/`);
        setQueueSettings(response.data);
        
        return response.data;
        } catch (err) {
        const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Ошибка загрузки настроек очереди';
        console.error('❌ Ошибка загрузки настроек:', err.response?.data || err.message);
        setError(errorMsg);
        throw err;
        } finally {
        setLoading(false);
        }
    }, [clinicId, hasAccess]);

    /**
     * Создание записи через электронную очередь
     * 
     * @param {Object} bookingData - Данные для создания записи
     * @param {string} bookingData.patient_full_name - ФИО пациента
     * @param {string} bookingData.patient_phone - Телефон пациента
     * @param {number} [bookingData.service_id] - ID услуги (если запись по услугам)
     * @param {number} [bookingData.doctor_id] - ID врача (если запись по врачам)
     * 
     * @returns {Promise<Object>} Созданная запись с number_coupon
     */
    const createQueueAppointment = useCallback(async (bookingData) => {
        // Только clinic_admin может создавать записи
        if (!canCreateAppointments || !clinicId) {
        throw new Error('Только администратор клиники может создавать записи');
        }

        if (!queueSettings) {
        throw new Error('Настройки очереди не загружены');
        }

        try {
        setLoading(true);
        setError(null);

        // Валидация входных данных
        const { patient_full_name, patient_phone, service_id, doctor_id } = bookingData;

        if (!patient_full_name || !patient_phone) {
            throw new Error('ФИО и телефон пациента обязательны');
        }

        // Проверка в зависимости от настроек клиники
        if (queueSettings.is_booking_for_services && !service_id) {
            throw new Error('Необходимо выбрать услугу');
        }

        if (queueSettings.is_booking_for_doctors && !doctor_id) {
            throw new Error('Необходимо выбрать врача');
        }

        // Отправка запроса на создание
        const response = await axios.post(
            `/appointment/clinic/${clinicId}/queue/create/`,
            {
            patient_full_name: patient_full_name.trim(),
            patient_phone: patient_phone.trim(),
            service: service_id, // Backend ожидает "service", а не "service_id"
            doctor: doctor_id,   // Backend ожидает "doctor", а не "doctor_id"
            }
        );

        return response.data;
        } catch (err) {
        const errorMsg = err.response?.data?.detail || 
                        err.response?.data?.error || 
                        err.message || 
                        'Ошибка создания записи';
        setError(errorMsg);
        console.error('Failed to create queue appointment:', err);
        throw new Error(errorMsg);
        } finally {
        setLoading(false);
        }
    }, [clinicId, canCreateAppointments, queueSettings]);

    /**
     * Загрузка настроек при монтировании
     */
    useEffect(() => {
        if (hasAccess && clinicId) {
        fetchQueueSettings();
        }
    }, [clinicId, hasAccess, fetchQueueSettings]);

    return {
        // Данные
        queueSettings,
        
        // Состояние
        loading,
        error,
        hasAccess,
        canCreateAppointments, // Может ли пользователь создавать записи
        
        // Методы
        createQueueAppointment,
        fetchQueueSettings,
        
        // Helpers
        isElectronicQueue: queueSettings?.is_electronic_queue || false,
        isBookingForServices: queueSettings?.is_booking_for_services || false,
        isBookingForDoctors: queueSettings?.is_booking_for_doctors || false,
        availableServices: queueSettings?.services || [],
        availableDoctors: queueSettings?.doctors || [],
    };
};
