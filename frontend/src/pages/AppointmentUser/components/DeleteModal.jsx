/**
 * Модальное окно подтверждения удаления
 */
const DeleteModal = ({ 
    show, 
    appointment, 
    onConfirm, 
    onClose, 
    loading 
}) => {
    if (!show || !appointment) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Подтверждение удаления</h2>
                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    <p className="delete-warning">
                        Вы действительно хотите отменить эту запись?
                    </p>
                    
                    <div className="appointment-details">
                        <p>
                            <strong>Дата:</strong>{' '}
                            {new Date(appointment.date || appointment.appointment_date).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                        <p>
                            <strong>Время:</strong> {appointment.time_start}
                        </p>
                        <p>
                            <strong>Врач:</strong>{' '}
                            {appointment.doctor_name || 
                                (typeof appointment.doctor === 'object' && appointment.doctor !== null
                                    ? appointment.doctor.full_name 
                                    : null) || 'Не указано'}
                        </p>
                        <p>
                            <strong>Услуга:</strong>{' '}
                            {appointment.service_name ||
                                (typeof appointment.service === 'object' && appointment.service !== null
                                    ? appointment.service.name
                                    : null) || 'Не указано'}
                        </p>
                        <p>
                            <strong>Пациент:</strong>{' '}
                            {appointment.patient_full_name || appointment.patient_name || 'Не указано'}
                        </p>
                        <p>
                            <strong>Телефон:</strong>{' '}
                            {appointment.patient_phone || 'Не указано'}
                        </p>
                    </div>

                    <div className="modal-actions">
                        <button
                            className="btn-cancel"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Отмена
                        </button>
                        <button
                            className="btn-confirm-delete"
                            onClick={() => onConfirm(appointment.id)}
                            disabled={loading}
                        >
                            {loading ? 'Удаление...' : 'Удалить'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;
