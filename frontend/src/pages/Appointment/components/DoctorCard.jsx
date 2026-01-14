import SlotsList from './SlotsList';


const DoctorCard = ({ doctor, onSlotClick }) => {
    return (
        <div className="doctor-card">
            <div className="clinic-info-appointment">
                <p className="clinic-name">
                    <strong>Клиника:</strong> {doctor.clinic.name}
                </p>
                <p className='clinuc-doctor-name'>
                    <strong>Врач:</strong> {doctor.full_name}
                </p>
                <p className='clinic-doctor-price'>
                    <strong>Стоимость:</strong> 
                    {doctor.price ? ` ${doctor.price.toLocaleString()} ₽` : ' Не указана'}
                </p>
            </div>

            <SlotsList
                slots={doctor.slots}
                onSelect={(date, slot) => onSlotClick(doctor, date, slot)}
            />
        </div>
    );
};

export default DoctorCard;
