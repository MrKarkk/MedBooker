import api from './api';

const coreAPI = {
    // Получение списка часто задаваемых вопросов (FAQ)
    getFAQEntries: async () => {
        const response = await api.get('/core/faq/');
        return response.data.faq_entries;
    }
};

export default coreAPI;