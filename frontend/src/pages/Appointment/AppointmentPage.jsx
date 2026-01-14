import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../components/Notification/useNotification';
import NotificationContainer from '../../components/Notification/NotificationContainer';
import Forbidden403 from '../../components/SiteCods/Forbidden403';

import { useAppointmentSearch } from './hooks/useAppointmentSearch';
import { useBooking } from './hooks/useBooking';
import { useAdminClinicBooking } from './hooks/useAdminClinicBooking';

import Hero from './components/Hero';
import SearchForm from './components/SearchForm';
import DoctorsList from './components/DoctorsList';
import BookingModal from './components/BookingModal';
import QueueBookingForm from './components/QueueBookingForm';

import './styles/appointment.css';


const AppointmentPage = () => {
    const { user } = useAuth();
    const { notifications, success, error, loading, hide, removeNotification } = useNotification();

    // Создаём объект notify для передачи в хуки
    const notify = { success, error, loading, hide };

    // Хуки для управления состоянием
    const search = useAppointmentSearch({ notify });
    const booking = useBooking({ 
        notify, 
        user,
        onSuccess: search.search // Перезагружаем результаты поиска после записи
    });
    
    // Хук для электронной очереди
    const clinicId = user?.clinics?.[0]?.id;
    const queue = useAdminClinicBooking(clinicId);

    // Получение минимальной даты (сегодня)
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    // Обработка изменений в форме поиска
    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        search.setSearchParams((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Обработка отправки формы поиска
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        search.search();
    };

    // Обработка отправки формы бронирования
    const handleBookingSubmit = (e) => {
        e.preventDefault();
        booking.confirmBooking(search.searchParams.service);
    };

    // Если пользователь - админ клиники, показываем форму для онлайн-очереди
    if (user?.role === 'clinic_admin') {
        // Проверка доступа
        if (!queue.hasAccess || !queue.isElectronicQueue) {
            return (
                <Forbidden403 />
            );
        }

        return (
            <>
                <QueueBookingForm
                    loading={queue.loading}
                    error={queue.error}
                    isBookingForServices={queue.isBookingForServices}
                    isBookingForDoctors={queue.isBookingForDoctors}
                    availableServices={queue.availableServices}
                    availableDoctors={queue.availableDoctors}
                    onCreateAppointment={queue.createQueueAppointment}
                    notify={notify}
                    canCreateAppointments={queue.canCreateAppointments}
                />
                <NotificationContainer 
                    notifications={notifications} 
                    onRemove={removeNotification} 
                />
            </>
        );
    }

    // Обычный режим - поиск и запись к врачам
    return (
        <div className="appointment-page">
            <Hero />

            <SearchForm
                services={search.services}
                cities={search.cities}
                params={search.searchParams}
                onChange={handleSearchChange}
                onSubmit={handleSearchSubmit}
                loading={search.loading}
                minDate={getTodayDate()}
            />

            {search.searched && !search.loading && (
                <DoctorsList
                    doctors={search.doctors}
                    onSlotClick={booking.openModal}
                />
            )}

            <BookingModal
                show={booking.showModal}
                slot={{
                    ...booking.selectedSlot,
                    serviceId: parseInt(search.searchParams.service)
                }}
                services={search.services}
                bookingData={booking.bookingData}
                onChange={booking.handleChange}
                onSubmit={handleBookingSubmit}
                onClose={booking.closeModal}
                loading={booking.loading}
            />

            <NotificationContainer 
                notifications={notifications} 
                onRemove={removeNotification} 
            />
        </div>
    );
};

export default AppointmentPage;
