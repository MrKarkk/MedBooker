const BookingModal = ({
    show,
    slot,
    services,
    bookingData,
    onChange,
    onSubmit,
    onClose,
    loading
}) => {
    if (!show || !slot) return null;

    const selectedService = services.find(s => s.id === slot?.serviceId);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Подтверждение записи</h2>
                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    <div className="booking-summary">
                        <p>
                            <strong>Врач:</strong> {slot.doctor.full_name} 
                            <span className='span-appointmen'> § </span> 
                            {slot.doctor.specialty}
                        </p>
                        <p>
                            <strong>Дата:</strong>{' '}
                            {new Date(slot.date).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                            })} 
                            <span className='span-appointmen'> § </span>
                            {slot.slot.time_start} - {slot.slot.time_end}
                        </p>
                        <p>
                            <strong>Услуга:</strong>{' '}
                            {selectedService?.name || 'Не указана'}
                            <span className='span-appointmen'> § </span>
                            {slot.doctor.price
                                ? ` ${slot.doctor.price.toLocaleString()} ₽`
                                : 'Не указана'}
                        </p>
                    </div>

                    <form onSubmit={onSubmit} className="booking-form">
                        <div className="form-group">
                            <label htmlFor="patient_full_name">
                                ФИО <span className='span-appointmen'> ⁕ </span>
                            </label>
                            <input
                                type="text"
                                id="patient_full_name"
                                name="patient_full_name"
                                value={bookingData.patient_full_name}
                                onChange={onChange}
                                placeholder="Иванов Иван Иванович"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="patient_phone">
                                Телефон <span className='span-appointmen'> ⁕ </span>
                            </label>
                            <input
                                type="tel"
                                id="patient_phone"
                                name="patient_phone"
                                value={bookingData.patient_phone}
                                onChange={onChange}
                                placeholder="+7 (999) 123-45-67"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="comment">Комментарий</label>
                            <textarea
                                id="comment"
                                name="comment"
                                value={bookingData.comment}
                                onChange={onChange}
                                placeholder="Укажите дополнительную информацию"
                                rows="3"
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-cancel-booking"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                className="btn-confirm-booking"
                                disabled={loading}
                            >
                                {loading ? 'Запись...' : 'Записаться'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
