import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../components/Notification/useNotification';
import NotificationContainer from '../../components/Notification/NotificationContainer';
import Unauthorized401 from '../../components/SiteCods/Unauthorized401.jsx';

import { useAppointments } from './hooks/useAppointments';
import { useAppointmentActions } from './hooks/useAppointmentActions';
import { useAppointmentModals } from './hooks/useAppointmentModals';

import FiltersSection from './components/FiltersSection';
import AppointmentsList from './components/AppointmentsList';
import DeleteModal from './components/DeleteModal';
import EditModal from './components/EditModal';
import { canEditAppointment } from './utils/appointmentHelpers';

import './styles/appointmentUser.css';


const AppointmentAllPage = () => {
    const { user } = useAuth();
    const { notifications, success, error, loading, hide, removeNotification } = useNotification();

    // Создаём объект notify для передачи в хуки
    const notify = { success, error, loading, hide };

    // Определяем тип записей
    const isClinicAdminQueue = user?.role === 'clinic_queue_admin';

    // Хуки для управления данными
    const appointments = useAppointments({ notify, user });
    const actions = useAppointmentActions({ 
        notify, 
        onSuccess: appointments.loadAppointments,
        isQueueOnly: isClinicAdminQueue  // Передаём флаг для админа очереди
    });
    const modals = useAppointmentModals();

    // Обработчики для карточек
    const handleCardClick = (appointment) => {
        if (canEditAppointment(user)) {
            modals.openEditModal(appointment, false);
        }
    };

    const handleStatusChange = async (appointmentId, newStatus) => {
        await actions.updateAppointmentStatus(appointmentId, newStatus);
    };

    const handleEdit = (appointment) => {
        modals.openEditModal(appointment, true);
    };

    const handleDelete = (appointment) => {
        modals.openDeleteModal(appointment);
    };

    // Обработчики для модальных окон
    const handleConfirmDelete = async () => {
        if (modals.appointmentToDelete) {
            await actions.deleteAppointment(modals.appointmentToDelete.id);
            modals.closeDeleteModal();
        }
    };

    const handleSaveEdit = async (appointmentId, formData) => {
        const success = await actions.updateAppointment(appointmentId, formData);
        if (success) {
            modals.closeEditModal();
        }
    };

    // Проверка авторизации
    if (!user) {
        return <Unauthorized401 />;
    }

    // Загрузка
    if (appointments.loading) {
        return (
            <div className="loading-message">
                Загрузка записей...
            </div>
        );
    }

    return (
        <div className="appointment-user-content">
            <div className="appointment-user-container">
                {/* Фильтры и поиск */}
                <FiltersSection
                    filterStatus={appointments.filterStatus}
                    onFilterChange={appointments.setFilterStatus}
                    searchQuery={appointments.searchQuery}
                    onSearchChange={appointments.setSearchQuery}
                    onClearSearch={() => appointments.setSearchQuery('')}
                    userRole={user.role}
                />

                {/* Список записей */}
                <AppointmentsList
                    groupedAppointments={appointments.groupedAppointments}
                    userRole={user.role}
                    onCardClick={handleCardClick}
                    onStatusChange={handleStatusChange}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />

                {/* Модальное окно удаления */}
                <DeleteModal
                    show={modals.showDeleteModal}
                    appointment={modals.appointmentToDelete}
                    onConfirm={handleConfirmDelete}
                    onClose={modals.closeDeleteModal}
                    loading={actions.actionLoading}
                />

                {/* Модальное окно редактирования */}
                <EditModal
                    show={modals.showEditModal}
                    appointment={modals.selectedAppointment}
                    editForm={modals.editForm}
                    isEditing={modals.isEditing}
                    onFormChange={modals.handleEditFormChange}
                    onToggleEdit={modals.toggleEditMode}
                    onSave={handleSaveEdit}
                    onClose={modals.closeEditModal}
                    loading={actions.actionLoading}
                />

                {/* Уведомления */}
                <NotificationContainer 
                    notifications={notifications} 
                    onRemove={removeNotification} 
                />
            </div>
        </div>
    );
};

export default AppointmentAllPage;
