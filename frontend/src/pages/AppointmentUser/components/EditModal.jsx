import Select from '../../../components/Common/Select/Select';
import { getAvailableStatuses, getStatusLabel } from '../utils/appointmentHelpers';

/**
 * Модальное окно просмотра/редактирования записи
 */
const EditModal = ({ 
    show, 
    appointment, 
    editForm,
    isEditing,
    onFormChange,
    onToggleEdit,
    onSave, 
    onClose, 
    loading 
}) => {
    if (!show || !appointment) return null;

    const statusOptions = getAvailableStatuses();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-edit" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isEditing ? 'Редактирование записи' : 'Детали записи'}</h2>{appointment.number_coupon}
                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    {isEditing ? (
                        // Режим редактирования
                        <div className="appointment-details-edit">
                            <div className="edit-field">
                                <label>Дата</label>
                                <input
                                    type="text"
                                    value={new Date(appointment.date || appointment.appointment_date).toLocaleDateString('ru-RU')}
                                    disabled
                                />
                            </div>
                            
                            <div className="edit-field">
                                <label>Время</label>
                                <input
                                    type="text"
                                    value={`${appointment.time_start}`}
                                    disabled
                                />
                            </div>

                            <div className="edit-field">
                                <label>Врач</label>
                                <input
                                    type="text"
                                    value={appointment.doctor_name || 
                                        (typeof appointment.doctor === 'object' && appointment.doctor !== null
                                            ? appointment.doctor.full_name 
                                            : null) || 'Не указано'}
                                    disabled
                                />
                            </div>

                            <div className="edit-field">
                                <label>Услуга</label>
                                <input
                                    type="text"
                                    value={appointment.service_name ||
                                        (typeof appointment.service === 'object' && appointment.service !== null
                                            ? appointment.service.name
                                            : null) || 'Не указано'}
                                    disabled
                                />
                            </div>

                            <div className="edit-field">
                                <label>ФИО пациента</label>
                                <input
                                    type="text"
                                    value={editForm.patient_full_name}
                                    onChange={(e) => onFormChange('patient_full_name', e.target.value)}
                                />
                            </div>

                            <div className="edit-field">
                                <label>Телефон</label>
                                <input
                                    type="tel"
                                    value={editForm.patient_phone}
                                    onChange={(e) => onFormChange('patient_phone', e.target.value)}
                                />
                            </div>

                            <div className="edit-field full-width">
                                <label>Статус</label>
                                <Select
                                    name="status"
                                    value={editForm.status}
                                    onChange={(e) => onFormChange('status', e.target.value)}
                                    options={statusOptions.map(opt => ({
                                        value: opt.value,
                                        label: opt.label
                                    }))}
                                />
                            </div>

                            <div className="edit-field full-width">
                                <label>Комментарий</label>
                                <textarea
                                    value={editForm.comment}
                                    onChange={(e) => onFormChange('comment', e.target.value)}
                                    placeholder="Дополнительная информация..."
                                />
                            </div>
                        </div>
                    ) : (
                        // Режим просмотра
                        <div className="appointment-details-view">
                            <div className="detail-group">
                                <label>Время</label>
                                <span>{appointment.time_start}</span>
                            </div>

                            <div className="detail-group">
                                <label>Врач</label>
                                <span>
                                    {appointment.doctor_name || 
                                        (typeof appointment.doctor === 'object' && appointment.doctor !== null
                                            ? appointment.doctor.full_name 
                                            : null) || 'Не указано'}
                                </span>
                            </div>

                            <div className="detail-group">
                                <label>Услуга</label>
                                <span>
                                    {appointment.service_name ||
                                        (typeof appointment.service === 'object' && appointment.service !== null
                                            ? appointment.service.name
                                            : null) || 'Не указано'}
                                </span>
                            </div>

                            <div className="detail-group">
                                <label>Пациент</label>
                                <span>{appointment.patient_full_name}</span>
                            </div>

                            <div className="detail-group">
                                <label>Телефон</label>
                                <span>{appointment.patient_phone}</span>
                            </div>

                            <div className="detail-group">
                                <label>Статус</label>
                                <span>{getStatusLabel(appointment.status)}</span>
                            </div>

                            {appointment.comment && (
                                <div className="detail-group full-width">
                                    <label>Комментарий</label>
                                    <p className="comment-text">{appointment.comment}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="modal-actions">
                        <button
                            className="btn-cancel"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Закрыть
                        </button>
                        {isEditing ? (
                            <button
                                className="btn-save-appointment"
                                onClick={() => onSave(appointment.id, editForm)}
                                disabled={loading}
                            >
                                {loading ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        ) : (
                            <button
                                className="btn-edit-appointment"
                                onClick={onToggleEdit}
                            >
                                Редактировать
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditModal;
