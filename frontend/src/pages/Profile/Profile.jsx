import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../components/Notification/useNotification';
import NotificationContainer from '../../components/Notification/NotificationContainer';
import profileAPI from '../../services/profile';
import Unauthorized401 from '../../components/SiteCods/Unauthorized401';
import './Profile.css';


const Profile = () => {
    const { user, setUser } = useAuth();
    const { notifications, success, error, loading: showLoading, hide, removeNotification } = useNotification();
    
    // Состояния для формы профиля
    const [profileForm, setProfileForm] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        tg_id: ''
    });
    
    // Состояния для формы смены пароля
    const [passwordForm, setPasswordForm] = useState({
        old_password: '',
        new_password: '',
        new_password_confirm: ''
    });
    
    // Состояния для UI
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Загрузка данных пользователя при монтировании
    useEffect(() => {
        if (user) {
            setProfileForm({
                full_name: user.full_name || '',
                email: user.email || '',
                phone_number: user.phone_number || '',
                tg_id: user.tg_id || ''
            });
        }
    }, [user]);

    // Обработка изменений в форме профиля
    const handleProfileChange = (e) => {
        const { name, value} = e.target;
        setProfileForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Обработка изменений в форме пароля
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Отмена редактирования профиля
    const handleCancelEdit = () => {
        setIsEditingProfile(false);
        setProfileForm({
            full_name: user.full_name || '',
            email: user.email || '',
            phone_number: user.phone_number || '',
            tg_id: user.tg_id || ''
        });
    };

    // Сохранение профиля
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        const loadingId = showLoading('Сохранение профиля...');
        setLoadingProfile(true);

        try {
            const response = await profileAPI.updateProfile(profileForm);
            setUser(response.user);
            hide(loadingId);
            success('Профиль успешно обновлен!');
            setIsEditingProfile(false);
        } catch (err) {
            console.error('Ошибка обновления профиля:', err);
            hide(loadingId);
            if (err.response?.data) {
                const errors = err.response.data;
                const errorMessages = Object.entries(errors)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join(', ');
                error(errorMessages || 'Не удалось обновить профиль');
            } else {
                error('Не удалось обновить профиль');
            }
        } finally {
            setLoadingProfile(false);
        }
    };

    // Смена пароля
    const handleChangePassword = async (e) => {
        e.preventDefault();

        // Проверка совпадения паролей
        if (passwordForm.new_password !== passwordForm.new_password_confirm) {
            error('Новые пароли не совпадают');
            return;
        }

        const loadingId = showLoading('Изменение пароля...');
        setLoadingPassword(true);

        try {
            await profileAPI.changePassword(passwordForm);
            hide(loadingId);
            success('Пароль успешно изменен!');
            setPasswordForm({
                old_password: '',
                new_password: '',
                new_password_confirm: '',
                tg_id: ''
            });
            setIsChangingPassword(false);
        } catch (err) {
            console.error('Ошибка смены пароля:', err);
            hide(loadingId);
            if (err.response?.data) {
                const errors = err.response.data;
                if (errors.error) {
                    error(errors.error);
                } else {
                    const errorMessages = Object.values(errors)
                        .map((value) => `${Array.isArray(value) ? value.join(', ') : value}`)
                        .join(', ');
                    error(errorMessages || 'Не удалось изменить пароль');
                }
            } else {
                error('Не удалось изменить пароль');
            }
        } finally {
            setLoadingPassword(false);
        }
    };

    // Получение текста роли на русском
    const getRoleText = (role) => {
        const roles = {
            'patient': 'Пациент',
            'doctor': 'Врач',
            'clinic_admin': 'Администратор клиники',
            'super_admin': 'Супер администратор',
            'clinic_queue_admin': 'Администратор очереди клиники'
        };
        return roles[role] || role;
    };

    // Форматирование даты
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!user) {
        return (
            <Unauthorized401 />
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-content">
                <h1 className="profile-title">Мой профиль</h1>

                {/* Секция информации о профиле */}
                <div className="profile-card">
                    <div className="profile-card-header">
                        <h2>Личная информация</h2>
                        {!isEditingProfile && (
                            <button
                                className="profile-btn profile-btn-edit"
                                onClick={() => setIsEditingProfile(true)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Редактировать
                            </button>
                        )}
                    </div>

                    {!isEditingProfile ? (
                        <div className="profile-info">
                            <div className="profile-info-item">
                                <label>ФИО</label>
                                <p>{user.full_name}</p>
                            </div>
                            <div className="profile-info-item">
                                <label>Email</label>
                                <p>{user.email}</p>
                            </div>
                            <div className="profile-info-item">
                                <label>Телефон</label>
                                <p>{user.phone_number || 'Не указан'}</p>
                            </div>
                            <div className="profile-info-item">
                                <label>Telegram ID</label>
                                <p>{user.tg_id || 'Не указан'}</p>
                            </div>
                            <div className="profile-info-item">
                                <label>Роль</label>
                                <p className="profile-role">{getRoleText(user.role)}</p>
                            </div>
                            <div className="profile-info-item">
                                <label>Дата регистрации</label>
                                <p>{formatDate(user.date_joined)}</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSaveProfile} className="profile-form">
                            <div className="profile-form-group">
                                <label htmlFor="full_name">ФИО *</label>
                                <input
                                    type="text"
                                    id="full_name"
                                    name="full_name"
                                    value={profileForm.full_name}
                                    onChange={handleProfileChange}
                                    required
                                    disabled={loadingProfile}
                                />
                            </div>

                            <div className="profile-form-group">
                                <label htmlFor="email">Email *</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={profileForm.email}
                                    onChange={handleProfileChange}
                                    required
                                    disabled={loadingProfile}
                                />
                            </div>

                            <div className="profile-form-group">
                                <label htmlFor="phone_number">Телефон</label>
                                <input
                                    type="tel"
                                    id="phone_number"
                                    name="phone_number"
                                    value={profileForm.phone_number}
                                    onChange={handleProfileChange}
                                    placeholder="+7 (___) ___-__-__"
                                    disabled={loadingProfile}
                                />
                            </div>

                            <div className="profile-form-group">
                                <label htmlFor="tg_id">Telegram ID</label>
                                <input 
                                    type="text"
                                    id="tg_id"
                                    name="tg_id"
                                    value={profileForm.tg_id}
                                    onChange={handleProfileChange}
                                    placeholder="Введите ваш Telegram ID"
                                    disabled={loadingProfile}
                                />
                            </div>

                            <div className="profile-form-actions">
                                <button
                                    type="button"
                                    className="profile-btn profile-btn-cancel"
                                    onClick={handleCancelEdit}
                                    disabled={loadingProfile}
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="profile-btn profile-btn-save"
                                    disabled={loadingProfile}
                                >
                                    {loadingProfile ? 'Сохранение...' : 'Сохранить'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Секция смены пароля */}
                <div className="profile-card">
                    <div className="profile-card-header">
                        <h2>Безопасность</h2>
                        {!isChangingPassword && (
                            <button
                                className="profile-btn profile-btn-edit"
                                onClick={() => setIsChangingPassword(true)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                Сменить пароль
                            </button>
                        )}
                    </div>

                    {isChangingPassword ? (
                        <form onSubmit={handleChangePassword} className="profile-form">
                            <div className="profile-form-group">
                                <label htmlFor="old_password">Текущий пароль *</label>
                                <div className="profile-password-input">
                                    <input
                                        type={showOldPassword ? "text" : "password"}
                                        id="old_password"
                                        name="old_password"
                                        value={passwordForm.old_password}
                                        onChange={handlePasswordChange}
                                        required
                                        disabled={loadingPassword}
                                    />
                                    <button
                                        type="button"
                                        className="profile-password-toggle"
                                        onClick={() => setShowOldPassword(!showOldPassword)}
                                    >
                                        {showOldPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>

                            <div className="profile-form-group">
                                <label htmlFor="new_password">Новый пароль *</label>
                                <div className="profile-password-input">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        id="new_password"
                                        name="new_password"
                                        value={passwordForm.new_password}
                                        onChange={handlePasswordChange}
                                        required
                                        disabled={loadingPassword}
                                        minLength="8"
                                    />
                                    <button
                                        type="button"
                                        className="profile-password-toggle"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                                <small className="profile-form-hint">
                                    Минимум 8 символов, заглавные и строчные буквы, цифры
                                </small>
                            </div>

                            <div className="profile-form-group">
                                <label htmlFor="new_password_confirm">Подтверждение нового пароля *</label>
                                <div className="profile-password-input">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="new_password_confirm"
                                        name="new_password_confirm"
                                        value={passwordForm.new_password_confirm}
                                        onChange={handlePasswordChange}
                                        required
                                        disabled={loadingPassword}
                                        minLength="8"
                                    />
                                    <button
                                        type="button"
                                        className="profile-password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>

                            <div className="profile-form-actions">
                                <button
                                    type="button"
                                    className="profile-btn profile-btn-cancel"
                                    onClick={() => {
                                        setIsChangingPassword(false);
                                        setPasswordForm({
                                            old_password: '',
                                            new_password: '',
                                            new_password_confirm: ''
                                        });
                                    }}
                                    disabled={loadingPassword}
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="profile-btn profile-btn-save"
                                    disabled={loadingPassword}
                                >
                                    {loadingPassword ? 'Изменение...' : 'Изменить пароль'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="profile-info">
                            <p className="profile-security-text">
                                Регулярно меняйте пароль для обеспечения безопасности вашего аккаунта
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Notification Container */}
            <NotificationContainer notifications={notifications} onRemove={removeNotification} />
        </div>
    );
};

export default Profile;
