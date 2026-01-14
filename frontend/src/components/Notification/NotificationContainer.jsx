import Notification from './Notification';
import './Notification.css';

const NotificationContainer = ({ notifications, onRemove }) => {
    if (!notifications || notifications.length === 0) return null;

    return (
        <div className="notifications-container">
        {notifications.map((notification) => (
            <Notification
            key={notification.id}
            type={notification.type}
            message={notification.message}
            duration={notification.duration}
            onClose={() => onRemove(notification.id)}
            />
        ))}
        </div>
    );
};

export default NotificationContainer;
