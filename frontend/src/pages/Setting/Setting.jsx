import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useNotification } from '../../components/Notification/useNotification';
import NotificationContainer from '../../components/Notification/NotificationContainer';
import Unauthorized401 from '../../components/SiteCods/Unauthorized401.jsx';
import './Setting.css';


const Setting = () => {
    const { isAuthenticated } = useAuth();
    const { notifications, removeNotification } = useNotification();

    if (!isAuthenticated) {
        return (
            <Unauthorized401 />
        );
    }

    return (
        <div className="settings-page">
            <div className="settings-container">
                {/* Заголовок */}
                <div className="settings-header">
                    <h1 className="settings-title">Настройки</h1>
                    <p className="settings-subtitle">Управление вашим аккаунтом и данными</p>
                </div>

                <section className="settings-section">
                    <div className='settings-list'>
                        <div className="settings-item">
                            <div className="settings-item-content">
                                <h3>Управление пользователями</h3>
                                <p>Просмотр и управление всеми пользователями платформы</p>
                            </div>
                            <Link to="/admin/users" className="btn-link">Перейти</Link>
                        </div>
                        <div className="settings-item">
                            <div className="settings-item-content">
                                <h3>Управление клиниками</h3>
                                <p>Просмотр и управление всеми клиниками на платформе</p>
                            </div>
                            <Link to="/admin/clinics" className="btn-link">Перейти</Link>
                        </div>
                        <div className='settings-item'>
                            <div className="settings-item-content">
                                <h3>Управление врачами</h3>
                                <p>Просмотр и модерация всех врачей на платформе</p>
                            </div>
                            <Link to="/admin/doctors" className="btn-link">Перейти</Link>
                        </div>
                    </div>
                </section>

                {/* Дополнительные настройки */}
                <section className="settings-section">
                    <div className="settings-list">
                        <div className="settings-item">
                            <div className="settings-item-content">
                                <h3>Безопасность</h3>
                                <p>Управление паролем и двухфакторной аутентификацией</p>
                            </div>
                            <Link to="/profile" className="btn-link">Настроить</Link>
                        </div>
                    </div>
                </section>
            </div>
            <NotificationContainer notifications={notifications} onRemove={removeNotification} />
        </div>
    );
};

export default Setting;
