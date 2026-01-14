import api from './api';

const coreAPI = {
    // Отправка сообшенияения от пользователя
    sendReceivedMessage: async (messageData) => {
        const response = await api.post('/core/messages/receive/', messageData);
        return response.data;
    },

    // Получение списка часто задаваемых вопросов (FAQ)
    getFAQEntries: async () => {
        const response = await api.get('/core/faq/');
        return response.data.faq_entries;
    }
};

export default coreAPI;