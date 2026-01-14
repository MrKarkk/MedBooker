import QuickActions from './QuickActions';


const AppointmentCard = ({ 
    appointment, 
    userRole,
    onClick, 
    onStatusChange,
    onEdit,
    onDelete,
}) => {
    const isClinicAdminQueue = userRole === 'clinic_queue_admin';
    
    // Получаем данные врача (может быть объектом, строкой или числом)
    const doctorName = appointment.doctor_name || 
        (typeof appointment.doctor === 'object' && appointment.doctor !== null
            ? appointment.doctor.full_name 
            : null) || 'Не указано';
    
    // Получаем данные услуги (может быть объектом, строкой или числом)
    const serviceName = appointment.service_name ||
        (typeof appointment.service === 'object' && appointment.service !== null
            ? appointment.service.name
            : null) || 'Не указано';
    
    // Получаем данные пациента
    const patientName = appointment.patient_full_name || appointment.patient_name || 'Не указано';

    // Получаем номер талона 
    const number_coupon = appointment.number_coupon || '—';

    const handleCardClick = () => {
        // Админ очереди не может открыть детали
        if (!isClinicAdminQueue && onClick) {
            onClick(appointment);
        }
    };

    return (
        <div 
            className={`appointment-card ${!isClinicAdminQueue && onClick ? 'clickable' : ''}`}
            onClick={handleCardClick}
        >

            {/* Тело карточки */}
            <div className="appointment-body">
                <>
                    <div className="appointment-info-row">
                        <span className="info-label">Врач:</span>
                        <span className="info-value">{doctorName}</span>
                    </div>
                    <div className="appointment-info-row">
                        <span className="info-label">Услуга:</span>
                        <span className="info-value">{serviceName}</span>
                    </div>
                    <div className="appointment-info-row">
                        <span className="info-label">Пациент:</span>
                        <span className="info-value">{patientName}</span>
                    </div>
                    <div className="appointment-info-row">
                        <span className="info-label">Номер талона:</span>
                        <span className="info-value">{number_coupon}</span>
                    </div>
                </>
            </div>

            {/* Быстрые действия */}
            <QuickActions
                appointment={appointment}
                userRole={userRole}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        </div>
    );
};

export default AppointmentCard;
