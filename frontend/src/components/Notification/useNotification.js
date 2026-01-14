import { useState, useCallback } from 'react';

let notificationId = 0;

export const useNotification = () => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((type, message, duration = 5000) => {
        const id = ++notificationId;
        const notification = { id, type, message, duration };
        
        setNotifications((prev) => [...prev, notification]);
        
        if (type !== 'loading') {
        setTimeout(() => {
            removeNotification(id);
        }, duration);
        }
        
        return id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const success = useCallback((message, duration) => {
        return showNotification('success', message, duration);
    }, [showNotification]);

    const error = useCallback((message, duration) => {
        return showNotification('error', message, duration);
    }, [showNotification]);

    const loading = useCallback((message) => {
        return showNotification('loading', message, null);
    }, [showNotification]);

    const hide = useCallback((id) => {
        removeNotification(id);
    }, [removeNotification]);

    return {
        notifications,
        success,
        error,
        loading,
        hide,
        removeNotification,
    };
};

export default useNotification;
