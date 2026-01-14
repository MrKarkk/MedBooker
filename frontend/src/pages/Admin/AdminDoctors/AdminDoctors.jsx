import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../components/Notification/useNotification';
import NotificationContainer from '../../../components/Notification/NotificationContainer';
import Unauthorized401 from '../../../components/SiteCods/Unauthorized401';
import Forbidden403 from '../../../components/SiteCods/Forbidden403';
import adminAPI from '../../../services/admin';
import './AdminDoctors.css';

const AdminDoctors = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { notifications, success, error, loading: showLoading, hide, removeNotification } = useNotification();

    const [doctors, setDoctors] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editedDoctor, setEditedDoctor] = useState({});
    const [deleteModal, setDeleteModal] = useState({ show: false, doctor: null });
    
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: null // null, 'asc', 'desc'
    });

    useEffect(() => {
        if (!user) {
            error('Доступ запрещен');
            navigate('/');
            return;
        }
        fetchDoctors();
        fetchClinics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        filterAndSortDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doctors, searchTerm, sortConfig]);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const data = await adminAPI.getAllDoctors();
            // Проверяем что data это массив
            if (Array.isArray(data)) {
                setDoctors(data);
            } else {
                console.error('Expected array but got:', data);
                setDoctors([]);
                error('Ошибка формата данных');
            }
        } catch (err) {
            error('Ошибка загрузки врачей');
            console.error('Error fetching doctors:', err);
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchClinics = async () => {
        try {
            const data = await adminAPI.getAllClinics();
            setClinics(data);
        } catch (error) {
            console.error('Error fetching clinics:', error);
        }
    };

    const filterAndSortDoctors = () => {
        let result = [...doctors];

        // Поиск
        if (searchTerm) {
            result = result.filter(doctor => {
                const searchLower = searchTerm.toLowerCase();
                return (
                    doctor.full_name?.toLowerCase().includes(searchLower) ||
                    doctor.specialty?.toLowerCase().includes(searchLower) ||
                    doctor.email?.toLowerCase().includes(searchLower) ||
                    doctor.clinic_name?.toLowerCase().includes(searchLower) ||
                    doctor.phone?.includes(searchTerm)
                );
            });
        }

        // Сортировка
        if (sortConfig.key && sortConfig.direction) {
            result.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Обработка null/undefined
                if (aValue === null || aValue === undefined) aValue = '';
                if (bValue === null || bValue === undefined) bValue = '';

                // Числовая сортировка
                if (sortConfig.key === 'id' || sortConfig.key === 'experience_years' || sortConfig.key === 'appointments_count') {
                    aValue = Number(aValue) || 0;
                    bValue = Number(bValue) || 0;
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

        setFilteredDoctors(result);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        
        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') {
                direction = 'desc';
            } else if (sortConfig.direction === 'desc') {
                direction = null;
                key = null;
            }
        }
        
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return '⇅';
        }
        if (sortConfig.direction === 'asc') {
            return '↑';
        }
        if (sortConfig.direction === 'desc') {
            return '↓';
        }
        return '⇅';
    };

    const handleEdit = (doctor) => {
        setEditingId(doctor.id);
        setEditedDoctor({ ...doctor });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditedDoctor({});
    };

    const handleSaveEdit = async () => {
        try {
            const loadingId = showLoading('Сохранение...');
            
            const updateData = {
                full_name: editedDoctor.full_name,
                specialty: editedDoctor.specialty,
                email: editedDoctor.email,
                phone: editedDoctor.phone,
                clinic: editedDoctor.clinic,
                bio: editedDoctor.bio,
                experience_years: editedDoctor.experience_years,
                education: editedDoctor.education,
                certificates: editedDoctor.certificates,
                working_hours: editedDoctor.working_hours
            };

            await adminAPI.updateDoctor(editingId, updateData);
            hide(loadingId);
            await fetchDoctors();
            setEditingId(null);
            setEditedDoctor({});
            success('Врач успешно обновлен');
        } catch (err) {
            error('Ошибка при сохранении');
            console.error('Error updating doctor:', err);
        }
    };

    const handleInputChange = (field, value) => {
        setEditedDoctor(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDeleteClick = (doctor) => {
        setDeleteModal({ show: true, doctor });
    };

    const handleDeleteConfirm = async () => {
        try {
            const loadingId = showLoading('Удаление...');
            await adminAPI.deleteDoctor(deleteModal.doctor.id);
            hide(loadingId);
            await fetchDoctors();
            setDeleteModal({ show: false, doctor: null });
            success('Врач успешно удален');
        } catch (err) {
            error('Ошибка при удалении');
            console.error('Error deleting doctor:', err);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ show: false, doctor: null });
    };

    if (user.role !== 'super_admin') {
        return <Forbidden403 />;
    }

    if (loading) {
        return (
            <div className="admin-doctors-page">
                <div className="loading-spinner">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="admin-doctors-page">
            <NotificationContainer 
                notifications={notifications} 
                removeNotification={removeNotification} 
            />
            <div className="admin-doctors-container">
                <div className="admin-doctors-header">
                    <h1 className="admin-doctors-title">Управление Врачами</h1>
                </div>

                <div className="admin-doctors-controls">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Поиск по ФИО, специальности, email, клинике, телефону..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="results-info">
                        Найдено: {filteredDoctors.length} из {doctors.length}
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="admin-doctors-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('id')} className="sortable">
                                    ID {getSortIcon('id')}
                                </th>
                                <th onClick={() => handleSort('full_name')} className="sortable">
                                    ФИО {getSortIcon('full_name')}
                                </th>
                                <th onClick={() => handleSort('specialty')} className="sortable">
                                    Специальность {getSortIcon('specialty')}
                                </th>
                                <th onClick={() => handleSort('clinic_name')} className="sortable">
                                    Клиника {getSortIcon('clinic_name')}
                                </th>
                                <th onClick={() => handleSort('email')} className="sortable">
                                    Email {getSortIcon('email')}
                                </th>
                                <th onClick={() => handleSort('phone')} className="sortable">
                                    Телефон {getSortIcon('phone')}
                                </th>
                                <th onClick={() => handleSort('experience_years')} className="sortable">
                                    Опыт (лет) {getSortIcon('experience_years')}
                                </th>
                                <th onClick={() => handleSort('appointments_count')} className="sortable">
                                    Записей {getSortIcon('appointments_count')}
                                </th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDoctors.map((doctor) => (
                                <tr key={doctor.id}>
                                    <td>{doctor.id}</td>
                                    <td>
                                        {editingId === doctor.id ? (
                                            <input
                                                type="text"
                                                className="edit-input"
                                                value={editedDoctor.full_name || ''}
                                                onChange={(e) => handleInputChange('full_name', e.target.value)}
                                            />
                                        ) : (
                                            doctor.full_name
                                        )}
                                    </td>
                                    <td>
                                        {editingId === doctor.id ? (
                                            <input
                                                type="text"
                                                className="edit-input"
                                                value={editedDoctor.specialty || ''}
                                                onChange={(e) => handleInputChange('specialty', e.target.value)}
                                            />
                                        ) : (
                                            doctor.specialty
                                        )}
                                    </td>
                                    <td>
                                        {editingId === doctor.id ? (
                                            <select
                                                className="edit-select"
                                                value={editedDoctor.clinic || ''}
                                                onChange={(e) => handleInputChange('clinic', e.target.value)}
                                            >
                                                <option value="">Выберите клинику</option>
                                                {clinics.map(clinic => (
                                                    <option key={clinic.id} value={clinic.id}>
                                                        {clinic.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            doctor.clinic_name || 'Не указана'
                                        )}
                                    </td>
                                    <td>
                                        {editingId === doctor.id ? (
                                            <input
                                                type="email"
                                                className="edit-input"
                                                value={editedDoctor.email || ''}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                            />
                                        ) : (
                                            doctor.email
                                        )}
                                    </td>
                                    <td>
                                        {editingId === doctor.id ? (
                                            <input
                                                type="tel"
                                                className="edit-input"
                                                value={editedDoctor.phone || ''}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                            />
                                        ) : (
                                            doctor.phone
                                        )}
                                    </td>
                                    <td>{doctor.experience_years || 0}</td>
                                    <td>
                                        <span className="badge badge-info">
                                            {doctor.appointments_count || 0}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {editingId === doctor.id ? (
                                                <>
                                                    <button
                                                        className="btn-save"
                                                        onClick={handleSaveEdit}
                                                        title="Сохранить"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        className="btn-cancel-edit"
                                                        onClick={handleCancelEdit}
                                                        title="Отмена"
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        className="btn-edit"
                                                        onClick={() => handleEdit(doctor)}
                                                        title="Редактировать"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        className="btn-delete"
                                                        onClick={() => handleDeleteClick(doctor)}
                                                        title="Удалить"
                                                    >
                                                        🗑
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredDoctors.length === 0 && (
                        <div className="no-results">
                            {searchTerm ? 'Врачи не найдены' : 'Нет врачей'}
                        </div>
                    )}
                </div>
            </div>

            {/* Модальное окно подтверждения удаления */}
            {deleteModal.show && (
                <div className="modal-overlay" onClick={handleDeleteCancel}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Подтверждение удаления</h3>
                        <p>
                            Вы уверены, что хотите удалить врача <strong>{deleteModal.doctor?.full_name}</strong>?
                        </p>
                        {deleteModal.doctor?.appointments_count > 0 && (
                            <p className="warning-text">
                                ⚠️ У этого врача есть записи ({deleteModal.doctor.appointments_count})
                            </p>
                        )}
                        <div className="modal-actions">
                            <button className="btn-modal-cancel" onClick={handleDeleteCancel}>
                                Отмена
                            </button>
                            <button className="btn-modal-confirm" onClick={handleDeleteConfirm}>
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDoctors;
