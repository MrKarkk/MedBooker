import { useState, useEffect } from 'react';
import appointmentAPI from '../../../services/appointment';

/**
 * Хук для управления загрузкой и фильтрацией записей
 * @param {Object} params - Параметры
 * @param {Object} params.notify - Объект для показа уведомлений
 * @param {Object} params.user - Текущий пользователь
 * @returns {Object} - Состояния и методы для работы с записями
 */
export function useAppointments({ notify, user }) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Проверка роли пользователя
    const isClinicAdmin = user?.role === 'clinic_admin';
    const userClinics = user?.clinics || [];

    // Загрузка записей при монтировании
    useEffect(() => {
        loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadAppointments = async () => {
        const loadingId = notify.loading('Загрузка записей...');
        try {
            setLoading(true);
            let data = [];

            if (isClinicAdmin && userClinics.length > 0) {
                const clinicId = userClinics[0].id;
                data = await appointmentAPI.getClinicAppointments(clinicId);
            } else if (user?.role === 'doctor') {
                data = await appointmentAPI.getUserAppointments();
                console.log('Загружены записи врача:', data);
            } else {
                console.warn('User role does not have access to appointments');
                data = [];
            }
            
            setAppointments(Array.isArray(data) ? data : []);
            notify.hide(loadingId);
        } catch (err) {
            notify.hide(loadingId);
            notify.error('Ошибка при загрузке записей');
            console.error('Ошибка загрузки записей:', err);
        } finally {
            setLoading(false);
        }
    };

    // Фильтрация записей
    const filteredAppointments = appointments.filter(apt => {
        const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
        
        if (!searchQuery.trim()) {
            return matchesStatus;
        }

        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
            apt.doctor?.full_name?.toLowerCase().includes(searchLower) ||
            apt.service?.name?.toLowerCase().includes(searchLower) ||
            apt.patient_full_name?.toLowerCase().includes(searchLower) ||
            apt.clinic_name?.toLowerCase().includes(searchLower);
        
        return matchesStatus && matchesSearch;
    });

    // Группировка записей по дате
    const groupedAppointments = filteredAppointments.reduce((groups, appointment) => {
        const date = appointment.date || appointment.appointment_date;
        if (!date) return groups;
        
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        if (!groups[formattedDate]) {
            groups[formattedDate] = {
                date: dateObj,
                appointments: []
            };
        }
        
        groups[formattedDate].appointments.push(appointment);
        return groups;
    }, {});

    return {
        appointments,
        loading,
        filterStatus,
        setFilterStatus,
        searchQuery,
        setSearchQuery,
        filteredAppointments,
        groupedAppointments,
        loadAppointments,
        isClinicAdmin,
    };
}
