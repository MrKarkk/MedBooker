import React, { useEffect } from 'react';
import './Notification.css';

const Notification = ({ type = 'info', message, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'loading':
        return (
          <div className="notification-spinner">
            <div className="spinner-ring"></div>
          </div>
        );
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-icon">
        {getIcon()}
      </div>
      <div className="notification-content">
        <p className="notification-message">{message}</p>
      </div>
      {type !== 'loading' && onClose && (
        <button className="notification-close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      )}
    </div>
  );
};

export default Notification;
