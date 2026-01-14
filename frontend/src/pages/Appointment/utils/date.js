/**
 * Утилиты для работы с датами в модуле записи на приём
 */

/**
 * Форматирует дату в формате ISO в локализованную строку
 * @param {string} isoDate - Дата в формате ISO (YYYY-MM-DD)
 * @param {Object} options - Опции форматирования Intl.DateTimeFormat
 * @returns {string} - Отформатированная дата
 */
export const formatDate = (isoDate, options = {}) => {
    const date = new Date(isoDate);
    const defaultOptions = {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        ...options
    };
    return date.toLocaleDateString('ru-RU', defaultOptions);
};

/**
 * Форматирует дату для отображения в слотах (короткий формат)
 * @param {string} isoDate - Дата в формате ISO (YYYY-MM-DD)
 * @returns {string} - Отформатированная дата (например, "пт, 15 янв")
 */
export const formatSlotDate = (isoDate) => {
    return formatDate(isoDate, {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    });
};

/**
 * Получает текущую дату в формате ISO (YYYY-MM-DD)
 * @returns {string} - Сегодняшняя дата
 */
export const getTodayISO = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

/**
 * Проверяет, является ли дата прошедшей
 * @param {string} isoDate - Дата в формате ISO (YYYY-MM-DD)
 * @returns {boolean} - true если дата в прошлом
 */
export const isPastDate = (isoDate) => {
    const date = new Date(isoDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
};

/**
 * Получает дату через N дней от текущей
 * @param {number} days - Количество дней
 * @returns {string} - Дата в формате ISO (YYYY-MM-DD)
 */
export const getDateAfterDays = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};
