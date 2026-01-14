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
    canCreateAppointments = false
}) => {
    const [formData, setFormData] = useState({
        patient_full_name: '',
        patient_phone: '',
        service_id: '',
        doctor_id: '',
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
                                required
                            />
                            
                            <InputSearch
                                name="patient_phone"
                                type="tel"
                                value={formData.patient_phone}
                                onChange={handleChange}
                                placeholder="+7 (999) 000-00-00"
                                required
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
                                        label: `${d.full_name} - ${d.specialization}` 
                                    }))}
                                    onChange={handleChange}
                                    value={formData.doctor_id}
                                    placeholder="Выберите врача"
                                    required
                                />
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
                </div>
            </section>
        </div>
    );
};

export default QueueBookingForm;
