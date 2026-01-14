const statusOptions = [
    { value: 'pending', label: 'Ожидает подтверждения', color: '#FFA500' },
    { value: 'confirmed', label: 'Подтверждено', color: '#4CAF50' },
    { value: 'canceled', label: 'Отменено пациентом', color: '#F44336' },
    { value: 'rejected', label: 'Отменено клиникой', color: '#E91E63' },
    { value: 'finished', label: 'Прием завершен', color: '#2196F3' },
    { value: 'no_show', label: 'Не пришел', color: '#9E9E9E' },
    { value: 'urgent', label: 'Срочный', color: '#FF5722' },
    { value: 'invited', label: 'Приглашен', color: '#3F51B5' },
];

/**
 * Получить label статуса
 */
export const getStatusLabel = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
};

/**
 * Получить класс статуса
 */
export const getStatusClass = (status) => {
    return `status-${status}`;
};

/**
 * Получить цвет статуса
 */
export const getStatusColor = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.color : '#9E9E9E';
};

/**
 * Получить доступные статусы
 */
export const getAvailableStatuses = () => {
    return statusOptions;
};

/**
 * Проверить, может ли пользователь редактировать запись
 */
export const canEditAppointment = (user) => {
    return user?.is_superuser || 
        user?.role === 'super_admin' || 
        user?.role === 'clinic_admin';
};

/**
 * Проверить, может ли пользователь выполнять быстрые действия
 */
export const canPerformQuickActions = (user) => {
    return user?.is_superuser || 
        user?.role === 'super_admin' || 
        user?.role === 'clinic_admin' ||
        user?.role === 'clinic_queue_admin';
};

/**
 * Получить следующий статус для быстрого действия (для админа очереди)
 */
export const getNextQuickStatus = (currentStatus) => {
    const transitions = {
        'pending': 'invited',
        'invited': 'finished', 
        'urgent': 'invited',
    };
    return transitions[currentStatus] || null;
};

/**
 * Получить текст кнопки быстрого действия
 */
export const getQuickActionLabel = (currentStatus) => {
    const labels = {
        'pending': 'Пригласить',
        'invited': 'Завершить',
        'urgent': 'Пригласить',
    };
    return labels[currentStatus] || null;
};
