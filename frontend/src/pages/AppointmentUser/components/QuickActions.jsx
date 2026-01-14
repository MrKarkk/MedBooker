import Select from '../../../components/Common/Select/Select';

/**
 * Компонент быстрых действий для карточки записи
 * Отображается по-разному для разных ролей
 */
const QuickActions = ({ 
    appointment, 
    userRole, 
    onStatusChange, 
    onDelete 
}) => {
    const isSuperAdmin = userRole === 'super_admin' || userRole === 'is_superuser';
    const isClinicAdmin = userRole === 'clinic_admin' || userRole === 'doctor';

    // Для админа клиники и суперадмина - полные быстрые действия
    if (isClinicAdmin || isSuperAdmin) {
        const { status } = appointment;
        
        return (
            <div className="quick-actions">
                {/* Подтвердить (если статус ожидание) */}
                {status === 'pending' && (
                    <button
                        className="quick-action-btn confirm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(appointment.id, 'confirmed');
                        }}
                    >
                        Подтвердить
                    </button>
                )}

                {status === 'confirmed' && (
                    <button
                        className="quick-action-btn invited"
                        onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(appointment.id, 'invited');
                        }}
                    >
                        Пригласить
                    </button>
                )}

                {status === 'confirmed' && (
                    <button
                        className="quick-action-btn urgent"
                        onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(appointment.id, 'urgent');
                        }}
                    >
                        Срочный
                    </button>
                )}

                {['invited', 'urgent'].includes(status) && (
                    <button
                        className="quick-action-btn finish"
                        onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(appointment.id, 'finished');
                        }}
                    >
                        Завершить
                    </button>
                )}

                {status === 'finished' && (
                    <button
                        className="quick-action-btn finish"
                    >
                        Прием завершен
                    </button>
                )}

                {status === 'rejected' && (
                    <button
                        className="quick-action-btn finish"
                    >
                        Отменено клиникой
                    </button>
                )}
            </div>
        );
    }

    // Для обычных пользователей - кнопка отмены
    return (
        <div className="appointment-actions">
            {appointment.status === 'pending' && (
                <button
                    className="btn-cancel-appointment"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(appointment);
                    }}
                >
                    Отменить запись
                </button>
            )}
        </div>
    );
};

export default QuickActions;
