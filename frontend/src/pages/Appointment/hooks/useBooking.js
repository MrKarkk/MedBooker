import { useState, useEffect } from 'react';
import appointmentAPI from '../../../services/appointment';

/**
 * Хук для управления бронированием записей
 * @param {Object} params - Параметры
 * @param {Object} params.notify - Объект для показа уведомлений
 * @param {Object} params.user - Текущий пользователь
 * @param {Function} params.onSuccess - Коллбэк при успешном создании записи
 * @returns {Object} - Состояния и методы для бронирования
 */
export function useBooking({ notify, user, onSuccess }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingData, setBookingData] = useState({
        patient_full_name: '',
        patient_phone: '',
        comment: '',
    });
    const [loading, setLoading] = useState(false);

    // Автозаполнение данных пациента если пользователь авторизован
    useEffect(() => {
        if (user) {
            setBookingData((prev) => ({
                ...prev,
                patient_full_name: user.full_name || '',
                patient_phone: user.phone_number || '',
            }));
        }
    }, [user]);

    // Открытие модального окна бронирования
    const openModal = (doctor, date, slot) => {
        setSelectedSlot({ doctor, date, slot });
        setShowModal(true);
    };

    // Закрытие модального окна
    const closeModal = () => {
        setShowModal(false);
        setSelectedSlot(null);
    };

    // Обработка изменений в форме
    const handleChange = (e) => {
        const { name, value } = e.target;
        setBookingData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Подтверждение бронирования
    const confirmBooking = async (serviceId) => {
        if (!bookingData.patient_full_name || !bookingData.patient_phone) {
            notify.error('Заполните обязательные поля');
            return;
        }

        const loadingId = notify.loading('Создание записи...');
        setLoading(true);

        try {
            const appointmentData = {
                patient_full_name: bookingData.patient_full_name,
                patient_phone: bookingData.patient_phone,
                comment: bookingData.comment,
                clinic: selectedSlot.doctor.clinic.id,
                doctor: selectedSlot.doctor.id,
                service: parseInt(serviceId),
                date: selectedSlot.date,
                time_start: selectedSlot.slot.time_start,
                source: user && user.email ? user.email : 'User',
            };

            await appointmentAPI.createAppointment(appointmentData);

            notify.hide(loadingId);
            notify.success('Запись успешно создана! Ожидайте подтверждения от клиники.');
            closeModal();
            
            // Вызов коллбэка для обновления результатов поиска
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            console.error('Ошибка создания записи:', err);
            notify.hide(loadingId);
            
            if (err.response?.data) {
                const errors = err.response.data;
                const errorMessages = Object.entries(errors)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join(', ');
                notify.error(errorMessages || 'Не удалось создать запись');
            } else {
                notify.error('Не удалось создать запись. Попробуйте еще раз.');
            }
        } finally {
            setLoading(false);
        }
    };

    return {
        showModal,
        selectedSlot,
        bookingData,
        loading,
        openModal,
        closeModal,
        handleChange,
        confirmBooking,
    };
}
