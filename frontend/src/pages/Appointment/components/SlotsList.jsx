const SlotsList = ({ slots, onSelect }) => {
    return (
        <div className="available-slots">
            {Object.entries(slots).map(([date, slotsArray]) => {
                if (slotsArray.length === 0) return null;

                return (
                    <div key={date} className="slots-by-date">
                        <div className="date-label">
                            {new Date(date).toLocaleDateString('ru-RU', {
                                weekday: 'short',
                                day: '2-digit',
                                month: 'short'
                            })}
                        </div>
                        <div className="slots-grid">
                            {slotsArray.map((slot, index) => (
                                <button
                                    key={index}
                                    className="slot-button"
                                    onClick={() => onSelect(date, slot)}
                                >
                                    {slot.time_start}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SlotsList;
