import api from './api';


const appointmentAPI = {
    // Получение списка всех услуг и городов
    getServicesAndCities: async () => {
        const response = await api.get('/appointment/services_and_cities/');
        return response.data;
    },

    // Получение всех записей клиники
    getClinicAppointments: async (clinicId) => {
        const response = await api.get(`/appointment/clinic/${clinicId}/`);
        return response.data;
    },

    // Обновление записи
    updateAppointment: async (appointmentId, data) => {
        const response = await api.patch(`/appointment/${appointmentId}/update/`, data);
        return response.data;
    },

    // Поиск доступных врачей с слотами на 7 дней
    searchDoctors: async (service, city, date) => {
        const response = await api.post('/appointment/search/', {
            service,
            city,
            date,
        });
        return response.data;
    },

    // Создание новой записи на приём
    createAppointment: async (appointmentData) => {
        const response = await api.post('/appointment/create/', {
            ...appointmentData,
        });
        return response.data;
    },
    
    // Получение записей текущего пользователя
    getUserAppointments: async () => {
        const response = await api.get('/appointment/user-appointments/');
        return response.data;
    },
};

export default appointmentAPI;