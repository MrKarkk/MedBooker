import { useState } from 'react';
import InputSearch from '../../../components/Common/InputSearch/InputSearch';

const QueueBookingForm = ({
    loading,
    isBookingForServices,
    isBookingForDoctors,
    availableServices,
    availableDoctors,
    onCreateAppointment,
    notify,
    canCreateAppointments = false,
    stats = { total: 0, invited: 0, confirmed: 0 },
}) => {
    const [formData, setFormData] = useState({
        patient_full_name: '',
        patient_phone: '',
        service_id: '',
        doctor_id: '',
        is_urgent: false,
    });

    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        const loadingId = notify.loading('Создание записи...');
        
        try {
            const result = await onCreateAppointment(formData);
            
            // Очищаем форму
            setFormData({
                patient_full_name: '',
                patient_phone: '',
                service_id: '',
                doctor_id: '',
                is_urgent: false,
            });
            
            notify.hide(loadingId);
            notify.success(`Запись создана! Номер талона: ${result.number_coupon}`);
        } catch (err) {
            notify.hide(loadingId);
            notify.error(err.message || 'Ошибка создания записи');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="appointment-page">            
            <section className="appointment-search-section">
                <div className='appointment-container'>
                    <div className='search-form-container'>
                        {canCreateAppointments && (
                        <form 
                            onSubmit={handleSubmit} 
                            className="appointment-search-form" 
                        >
                            <InputSearch
                                name="patient_full_name"
                                value={formData.patient_full_name}
                                onChange={handleChange}
                                placeholder="ФИО пациента"
                                // required
                            />
                            
                            <InputSearch
                                name="patient_phone"
                                type="tel"
                                value={formData.patient_phone}
                                onChange={handleChange}
                                placeholder="+992 (90) 363-45-54"
                                // required
                            />

                            {isBookingForServices && (
                                <InputSearch
                                    mode="select"
                                    name="service_id"
                                    options={availableServices.map(service => ({
                                        value: service.id,
                                        label: service.name
                                    }))}
                                    onChange={handleChange}
                                    value={formData.service_id}
                                    placeholder="Выберите услугу"
                                    required
                                />
                            )}

                            {isBookingForDoctors && (
                                <InputSearch
                                    mode="select"
                                    name="doctor_id"
                                    options={availableDoctors.map(d => ({ 
                                        value: d.id, 
                                        label: `${d.full_name}` 
                                    }))}
                                    onChange={handleChange}
                                    value={formData.doctor_id}
                                    placeholder="Выберите врача"
                                    required
                                />
                            )}

                            {(isBookingForDoctors || isBookingForServices) && (
                                <button
                                    type="button"
                                    className={`btn-urgent-toggle${formData.is_urgent ? ' btn-urgent-toggle--active' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, is_urgent: !prev.is_urgent }))}
                                >
                                    ⚡ {formData.is_urgent ? 'Срочный вызов!' : 'Срочный вызов?'}
                                </button>
                            )}

                            <button 
                                type="submit" 
                                className="btn-search"
                                disabled={submitting || loading}
                            >
                                {submitting ? 'Создание...' : 'Добавить в очередь'}
                            </button>
                        </form>
                        )}
                    </div>

                    <div className="queue-stats">
                        <div className="queue-stats__grid">
                            <div className="queue-stats__card queue-stats__card--total">
                                <span className="queue-stats__value">{stats.total}</span>
                                <span className="queue-stats__label">Всего записей</span>
                            </div>
                            <div className="queue-stats__card queue-stats__card--urgent">
                                <span className="queue-stats__value">{stats.urgent}</span>
                                <span className="queue-stats__label">Срочные</span>
                            </div>
                            <div className="queue-stats__card queue-stats__card--waiting">
                                <span className="queue-stats__value">{stats.confirmed}</span>
                                <span className="queue-stats__label">Ожидают</span>
                            </div>
                            <div className="queue-stats__card queue-stats__card--invited">
                                <span className="queue-stats__value">{stats.invited}</span>
                                <span className="queue-stats__label">Приглашены</span>
                            </div>
                            <div className="queue-stats__card queue-stats__card--finished">
                                <span className="queue-stats__value">{stats.finished}</span>
                                <span className="queue-stats__label">Завершены</span>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default QueueBookingForm;
