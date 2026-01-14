import { useState } from 'react';

/**
 * Хук для управления модальными окнами
 * @returns {Object} - Состояния и методы для управления модалками
 */
export function useAppointmentModals() {
    // Модальное окно удаления
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState(null);

    // Модальное окно редактирования
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isEditing, setIsEditing] = useState(false);

    // Открытие модального окна удаления
    const openDeleteModal = (appointment) => {
        setAppointmentToDelete(appointment);
        setShowDeleteModal(true);
    };

    // Закрытие модального окна удаления
    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setAppointmentToDelete(null);
    };

    // Открытие модального окна просмотра/редактирования
    const openEditModal = (appointment, editing = false) => {
        setSelectedAppointment(appointment);
        setEditForm({
            status: appointment.status || '',
            patient_full_name: appointment.patient_full_name || '',
            patient_phone: appointment.patient_phone || '',
            comment: appointment.comment || '',
        });
        setIsEditing(editing);
        setShowEditModal(true);
    };

    // Закрытие модального окна редактирования
    const closeEditModal = () => {
        setShowEditModal(false);
        setSelectedAppointment(null);
        setEditForm({});
        setIsEditing(false);
    };

    // Обработка изменений в форме редактирования
    const handleEditFormChange = (field, value) => {
        setEditForm((prev) => ({ ...prev, [field]: value }));
    };

    // Переключение режима редактирования
    const toggleEditMode = () => {
        setIsEditing((prev) => !prev);
    };

    return {
        // Delete modal
        showDeleteModal,
        appointmentToDelete,
        openDeleteModal,
        closeDeleteModal,
        
        // Edit modal
        showEditModal,
        selectedAppointment,
        editForm,
        isEditing,
        openEditModal,
        closeEditModal,
        handleEditFormChange,
        toggleEditMode,
    };
}
