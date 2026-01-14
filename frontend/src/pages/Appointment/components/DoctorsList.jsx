import DoctorCard from './DoctorCard';


const DoctorsList = ({ doctors, onSlotClick }) => {
    if (doctors.length === 0) {
        return null;
    }

    return (
        <section className="appointment-results-section">
            <div className="appointment-container">
                <div className="doctors-grid">
                    {doctors.map((doctor) => (
                        <DoctorCard
                            key={doctor.id}
                            doctor={doctor}
                            onSlotClick={onSlotClick}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default DoctorsList;
