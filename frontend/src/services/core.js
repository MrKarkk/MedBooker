import api from './api';

const coreAPI = {
    // Получение списка часто задаваемых вопросов (FAQ)
    getFAQEntries: async () => {
        const response = await api.get('/core/faq/');
        return response.data.faq_entries;
    },

    // Отправка полученного сообщения с контактной формы
    sendContactMessage: async (messageData) => {
        const response = await api.post('/core/contact/', messageData);
        return response.data;
    }
};

export default coreAPI;