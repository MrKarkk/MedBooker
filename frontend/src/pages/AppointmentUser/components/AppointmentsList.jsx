import AppointmentCard from './AppointmentCard';

/**
 * Список записей с группировкой по датам
 */
const AppointmentsList = ({ 
    groupedAppointments,
    userRole,
    onCardClick,
    onStatusChange,
    onEdit,
    onDelete
}) => {
    // Сортировка дат
    const sortedDates = Object.keys(groupedAppointments).sort((a, b) => {
        return groupedAppointments[b].date - groupedAppointments[a].date;
    });

    if (sortedDates.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>Записей не найдено</h3>
                <p>Попробуйте изменить фильтры или создать новую запись</p>
            </div>
        );
    }

    return (
        <div className="appointments-list">
            {sortedDates.map(dateKey => {
                const group = groupedAppointments[dateKey];
                
                return (
                    <div key={dateKey} className="appointments-group">
                        <h3 className="group-title">{dateKey}</h3>
                        <div className="appointments-grid">
                            {group.appointments.map(appointment => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    userRole={userRole}
                                    onClick={onCardClick}
                                    onStatusChange={onStatusChange}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AppointmentsList;
