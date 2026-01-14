import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../components/Notification/useNotification';
import NotificationContainer from '../../../components/Notification/NotificationContainer';
import Unauthorized401 from '../../../components/SiteCods/Unauthorized401';
import adminAPI from '../../../services/admin';
import './AdminClinics.css';


const AdminClinics = () => {
    const { user } = useAuth();
    const { notifications, success, error, loading: showLoading, hide, removeNotification } = useNotification();

    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingClinic, setEditingClinic] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user?.role === 'super_admin') {
            loadClinics();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadClinics = async () => {
        const loadingId = showLoading('Загрузка клиник...');
        setLoading(true);
        try {
            const data = await adminAPI.getAllClinics();
            setClinics(data);
            hide(loadingId);
        } catch (err) {
            hide(loadingId);
            error('Ошибка при загрузке клиник');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (clinic) => {
        setEditingClinic(clinic.id);
        setEditForm({
            name: clinic.name,
            city: clinic.city,
            address: clinic.address,
            phone_number: clinic.phone_number,
            email: clinic.email,
            description: clinic.description,
            website: clinic.website,
            rating: clinic.rating,
            is_verified: clinic.is_verified,
            is_active: clinic.is_active,
        });
    };

    const cancelEditing = () => {
        setEditingClinic(null);
        setEditForm({});
    };

    const handleInputChange = (field, value) => {
        setEditForm((prev) => ({ ...prev, [field]: value }));
    };

    const saveChanges = async (clinicId) => {
        const loadingId = showLoading('Сохранение изменений...');
        try {
            await adminAPI.updateClinic(clinicId, editForm);
            await loadClinics();
            hide(loadingId);
            success('Клиника успешно обновлена');
            cancelEditing();
        } catch (err) {
            hide(loadingId);
            const errorMsg = err.response?.data?.error || 'Ошибка при сохранении данных';
            error(errorMsg);
            console.error(err);
        }
    };

    const confirmDelete = (clinicId) => {
        setShowDeleteConfirm(clinicId);
    };

    const deleteClinic = async () => {
        const clinicId = showDeleteConfirm;
        const loadingId = showLoading('Удаление клиники...');
        try {
            const result = await adminAPI.deleteClinic(clinicId);
            setClinics((prev) => prev.filter((c) => c.id !== clinicId));
            hide(loadingId);
            success(result.message);
            setShowDeleteConfirm(null);
        } catch (err) {
            hide(loadingId);
            const errorMsg = err.response?.data?.error || 'Ошибка при удалении клиники';
            error(errorMsg);
            console.error(err);
        }
    };

    // Сортировка
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') {
                direction = 'desc';
            } else if (sortConfig.direction === 'desc') {
                setSortConfig({ key: null, direction: null });
                return;
            }
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    };

    // Фильтрация и сортировка
    const getFilteredAndSortedClinics = () => {
        let filteredClinics = [...clinics];

        // Поиск
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredClinics = filteredClinics.filter((clinic) =>
                clinic.name.toLowerCase().includes(query) ||
                clinic.city.toLowerCase().includes(query) ||
                clinic.email.toLowerCase().includes(query) ||
                clinic.phone_number.toLowerCase().includes(query)
            );
        }

        // Сортировка
        if (sortConfig.key) {
            filteredClinics.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'created_at') {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filteredClinics;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    if (user?.role !== 'super_admin') {
        return <Forbidden403 />;
    }

    return (
        <div className="admin-clinics-page">
            <div className="admin-clinics-container">
                <div className="admin-clinics-header">
                    <div>
                        <h1 className="admin-clinics-title">Управление клиниками</h1>
                        <p className="admin-clinics-subtitle">
                            Всего клиник: <strong>{clinics.length}</strong> | 
                            Показано: <strong>{getFilteredAndSortedClinics().length}</strong>
                        </p>
                    </div>
                </div>

                {/* Поиск */}
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Поиск по названию, городу, email или телефону..."
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
                    <div className="clinics-table-container">
                        <table className="clinics-table">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('id')} className="sortable-header">
                                        ID{getSortIndicator('id')}
                                    </th>
                                    <th onClick={() => handleSort('name')} className="sortable-header">
                                        Название{getSortIndicator('name')}
                                    </th>
                                    <th onClick={() => handleSort('city')} className="sortable-header">
                                        Город{getSortIndicator('city')}
                                    </th>
                                    <th>Email</th>
                                    <th>Телефон</th>
                                    <th onClick={() => handleSort('rating')} className="sortable-header">
                                        Рейтинг{getSortIndicator('rating')}
                                    </th>
                                    <th onClick={() => handleSort('doctors_count')} className="sortable-header">
                                        Врачей{getSortIndicator('doctors_count')}
                                    </th>
                                    <th>Статус</th>
                                    <th onClick={() => handleSort('created_at')} className="sortable-header">
                                        Дата создания{getSortIndicator('created_at')}
                                    </th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getFilteredAndSortedClinics().map((clinic) => (
                                    <tr key={clinic.id}>
                                        {editingClinic === clinic.id ? (
                                            <>
                                                <td>{clinic.id}</td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={editForm.name}
                                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                                        className="edit-input"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={editForm.city}
                                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                                        className="edit-input"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="email"
                                                        value={editForm.email}
                                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                                        className="edit-input"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="tel"
                                                        value={editForm.phone_number}
                                                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                                        className="edit-input"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="5"
                                                        value={editForm.rating}
                                                        onChange={(e) => handleInputChange('rating', parseFloat(e.target.value))}
                                                        className="edit-input"
                                                    />
                                                </td>
                                                <td>{clinic.doctors_count}</td>
                                                <td>
                                                    <select
                                                        value={editForm.is_active}
                                                        onChange={(e) => handleInputChange('is_active', e.target.value === 'true')}
                                                        className="edit-select"
                                                    >
                                                        <option value="true">Активна</option>
                                                        <option value="false">Неактивна</option>
                                                    </select>
                                                </td>
                                                <td>{formatDate(clinic.created_at)}</td>
                                                <td className="actions-cell">
                                                    <button
                                                        className="btn-save-small"
                                                        onClick={() => saveChanges(clinic.id)}
                                                        title="Сохранить"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        className="btn-cancel-small"
                                                        onClick={cancelEditing}
                                                        title="Отмена"
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{clinic.id}</td>
                                                <td>{clinic.name}</td>
                                                <td>{clinic.city}</td>
                                                <td>{clinic.email}</td>
                                                <td>{clinic.phone_number}</td>
                                                <td>⭐ {clinic.rating.toFixed(1)}</td>
                                                <td>{clinic.doctors_count}</td>
                                                <td>
                                                    <span className={`status-badge ${clinic.is_active ? 'active' : 'inactive'}`}>
                                                        {clinic.is_active ? 'Активна' : 'Неактивна'}
                                                    </span>
                                                </td>
                                                <td>{formatDate(clinic.created_at)}</td>
                                                <td className="actions-cell">
                                                    <button
                                                        className="btn-edit-small"
                                                        onClick={() => startEditing(clinic)}
                                                        title="Редактировать"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        className="btn-delete-small"
                                                        onClick={() => confirmDelete(clinic.id)}
                                                        title="Удалить"
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
                        <p>Вы уверены, что хотите удалить эту клинику?</p>
                        <p className="warning-text">Это действие необратимо! Все врачи и записи этой клиники также будут удалены.</p>
                        <div className="modal-actions">
                            <button
                                className="btn-cancel-delete"
                                onClick={() => setShowDeleteConfirm(null)}
                            >
                                Отмена
                            </button>
                            <button className="btn-confirm-delete" onClick={deleteClinic}>
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

export default AdminClinics;
