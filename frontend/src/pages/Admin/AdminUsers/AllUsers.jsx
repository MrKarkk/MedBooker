import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../components/Notification/useNotification';
import NotificationContainer from '../../../components/Notification/NotificationContainer';
import adminAPI from '../../../services/admin';
import Unauthorized401 from '../../../components/SiteCods/Unauthorized401';
import './AllUsers.css';


const AllUsers = () => {
    const { user } = useAuth();
    const { notifications, success, error, loading: showLoading, hide, removeNotification } = useNotification();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        role: '',
        password: '',
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    
    // Состояния для сортировки и поиска
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [searchQuery, setSearchQuery] = useState('');

    const roleLabels = {
        patient: 'Пациент',
        doctor: 'Врач',
        clinic_admin: 'Админ клиники',
        super_admin: 'Супер админ',
    };

    useEffect(() => {
        if (user?.role === 'super_admin') {
            loadUsers();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadUsers = async () => {
        const loadingId = showLoading('Загрузка пользователей...');
        setLoading(true);
        try {
            const data = await adminAPI.getAllUsers();
            setUsers(data);
            hide(loadingId);
        } catch (err) {
            hide(loadingId);
            error('Ошибка при загрузке пользователей');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (userToEdit) => {
        setEditingUser(userToEdit.id);
        setEditForm({
            full_name: userToEdit.full_name,
            email: userToEdit.email,
            phone_number: userToEdit.phone_number,
            role: userToEdit.role,
            password: '',
        });
    };

    const cancelEditing = () => {
        setEditingUser(null);
        setEditForm({
            full_name: '',
            email: '',
            phone_number: '',
            role: '',
            password: '',
        });
    };

    const handleInputChange = (field, value) => {
        setEditForm((prev) => ({ ...prev, [field]: value }));
    };

    const saveChanges = async (userId) => {
        const loadingId = showLoading('Сохранение изменений...');
        try {
            const updateData = { ...editForm };
            
            // Если пароль не указан, удаляем его из данных
            if (!updateData.password) {
                delete updateData.password;
            }

            const response = await adminAPI.updateUser(userId, updateData);
            
            // Обновляем список пользователей
            setUsers((prev) =>
                prev.map((u) => (u.id === userId ? response.user : u))
            );
            
            hide(loadingId);
            success('Данные пользователя успешно обновлены');
            cancelEditing();
        } catch (err) {
            hide(loadingId);
            const errorMsg = err.response?.data?.error || 'Ошибка при сохранении данных';
            error(errorMsg);
            console.error(err);
        }
    };

    const confirmDelete = (userId) => {
        setShowDeleteConfirm(userId);
    };

    const deleteUser = async () => {
        const userId = showDeleteConfirm;
        const loadingId = showLoading('Удаление пользователя...');
        try {
            await adminAPI.deleteUser(userId);
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            hide(loadingId);
            success('Пользователь успешно удален');
            setShowDeleteConfirm(null);
        } catch (err) {
            hide(loadingId);
            const errorMsg = err.response?.data?.error || 'Ошибка при удалении пользователя';
            error(errorMsg);
            console.error(err);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    // Функция сортировки
    const handleSort = (key) => {
        let direction = 'asc';
        
        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') {
                direction = 'desc';
            } else if (sortConfig.direction === 'desc') {
                // Третий клик - сброс сортировки
                setSortConfig({ key: null, direction: null });
                return;
            }
        }
        
        setSortConfig({ key, direction });
    };

    // Функция фильтрации и сортировки
    const getFilteredAndSortedUsers = () => {
        let filteredUsers = [...users];

        // Фильтрация по поисковому запросу
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredUsers = filteredUsers.filter((user) =>
                user.full_name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                user.phone_number.toLowerCase().includes(query)
            );
        }

        // Сортировка
        if (sortConfig.key) {
            filteredUsers.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Специальная обработка для даты
                if (sortConfig.key === 'date_joined') {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }

                // Специальная обработка для роли (сортировка по локализованному названию)
                if (sortConfig.key === 'role') {
                    aValue = roleLabels[aValue] || aValue;
                    bValue = roleLabels[bValue] || bValue;
                }

                // Сравнение
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filteredUsers;
    };

    // Индикатор сортировки
    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    };

    if (user?.role !== 'super_admin') {
        return <Forbidden403 />;
    }

    return (
        <div className="all-users-page">
            <div className="all-users-container">
                <div className="all-users-header">
                    <h1 className="all-users-title">Управление пользователями</h1>
                    <p className="all-users-subtitle">Всего пользователей: {users.length}</p>
                </div>

                {/* Поле поиска */}
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Поиск по ФИО, Email или телефону..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button
                            className="clear-search-btn"
                            onClick={() => setSearchQuery('')}
                            title="Очистить поиск"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="loading-state">Загрузка...</div>
                ) : (
                    <div className="users-table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('id')} className="sortable-header">
                                        ID{getSortIndicator('id')}
                                    </th>
                                    <th onClick={() => handleSort('full_name')} className="sortable-header">
                                        ФИО{getSortIndicator('full_name')}
                                    </th>
                                    <th onClick={() => handleSort('email')} className="sortable-header">
                                        Email{getSortIndicator('email')}
                                    </th>
                                    <th onClick={() => handleSort('phone_number')} className="sortable-header">
                                        Телефон{getSortIndicator('phone_number')}
                                    </th>
                                    <th onClick={() => handleSort('role')} className="sortable-header">
                                        Роль{getSortIndicator('role')}
                                    </th>
                                    <th onClick={() => handleSort('date_joined')} className="sortable-header">
                                        Дата регистрации{getSortIndicator('date_joined')}
                                    </th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getFilteredAndSortedUsers().map((userItem) => (
                                    <tr key={userItem.id}>
                                        {editingUser === userItem.id ? (
                                            // Режим редактирования
                                            <>
                                                <td>{userItem.id}</td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={editForm.full_name}
                                                        onChange={(e) =>
                                                            handleInputChange('full_name', e.target.value)
                                                        }
                                                        className="edit-input"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="email"
                                                        value={editForm.email}
                                                        onChange={(e) =>
                                                            handleInputChange('email', e.target.value)
                                                        }
                                                        className="edit-input"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="tel"
                                                        value={editForm.phone_number}
                                                        onChange={(e) =>
                                                            handleInputChange('phone_number', e.target.value)
                                                        }
                                                        className="edit-input"
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        value={editForm.role}
                                                        onChange={(e) =>
                                                            handleInputChange('role', e.target.value)
                                                        }
                                                        className="edit-select"
                                                    >
                                                        <option value="patient">Пациент</option>
                                                        <option value="doctor">Врач</option>
                                                        <option value="clinic_admin">Админ клиники</option>
                                                        <option value="super_admin">Супер админ</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="password"
                                                        value={editForm.password}
                                                        onChange={(e) =>
                                                            handleInputChange('password', e.target.value)
                                                        }
                                                        placeholder="Новый пароль (опционально)"
                                                        className="edit-input"
                                                    />
                                                </td>
                                                <td className="actions-cell">
                                                    <button
                                                        className="btn-save-small"
                                                        onClick={() => saveChanges(userItem.id)}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        className="btn-cancel-small"
                                                        onClick={cancelEditing}
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            // Режим просмотра
                                            <>
                                                <td>{userItem.id}</td>
                                                <td>{userItem.full_name}</td>
                                                <td>{userItem.email}</td>
                                                <td>{userItem.phone_number}</td>
                                                <td>
                                                    <span className={`role-badge role-${userItem.role}`}>
                                                        {roleLabels[userItem.role]}
                                                    </span>
                                                </td>
                                                <td>{formatDate(userItem.date_joined)}</td>
                                                <td className="actions-cell">
                                                    <button
                                                        className="btn-edit-small"
                                                        onClick={() => startEditing(userItem)}
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        className="btn-delete-small"
                                                        onClick={() => confirmDelete(userItem.id)}
                                                        disabled={userItem.id === user.id}
                                                    >
                                                        🗑
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Модальное окно подтверждения удаления */}
            {showDeleteConfirm && (
                <div className="delete-modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Подтверждение удаления</h3>
                        <p>Вы уверены, что хотите удалить этого пользователя?</p>
                        <p className="warning-text">Это действие необратимо!</p>
                        <div className="modal-actions">
                            <button
                                className="btn-cancel-delete"
                                onClick={() => setShowDeleteConfirm(null)}
                            >
                                Отмена
                            </button>
                            <button className="btn-confirm-delete" onClick={deleteUser}>
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <NotificationContainer notifications={notifications} onRemove={removeNotification} />
        </div>
    );
};

export default AllUsers;
