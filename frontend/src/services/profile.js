import api from './api';


const profileAPI = {
    // Обновление профиля
    updateProfile: async (profileData) => {
        const response = await api.patch('/users/profile/update/', profileData);
        return response.data;
    },

    // Смена пароля
    changePassword: async (passwordData) => {
        const response = await api.post('/users/password/change/', passwordData);
        return response.data;
    },
};

export default profileAPI;
