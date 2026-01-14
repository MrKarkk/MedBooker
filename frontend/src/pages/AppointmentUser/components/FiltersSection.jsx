const FiltersSection = ({ 
    filterStatus, 
    onFilterChange, 
    searchQuery, 
    onSearchChange,
    onClearSearch,
    userRole
}) => {
    const isClinicAdminQueue = userRole === 'clinic_queue_admin';
    
    const filterButtons = [
        { value: 'all', label: 'Все' },
        { value: 'pending', label: 'Ожидают' },
        { value: 'confirmed', label: 'Подтверждены' },
        { value: 'finished', label: 'Завершены' },
        { value: 'canceled', label: 'Отменены' },
    ];

    return (
        <div className="filters-section">
            <div className="search-box">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Поиск по врачу, услуге, пациенту..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchQuery && (
                    <button
                        className="clear-search-btn"
                        onClick={onClearSearch}
                        title="Очистить поиск"
                    >
                        ×
                    </button>
                )}
            </div>
            
            {!isClinicAdminQueue && (
                <div className="filter-buttons">
                    {filterButtons.map(filter => (
                        <button
                            key={filter.value}
                            className={`filter-btn ${filterStatus === filter.value ? 'active' : ''}`}
                            onClick={() => onFilterChange(filter.value)}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FiltersSection;
