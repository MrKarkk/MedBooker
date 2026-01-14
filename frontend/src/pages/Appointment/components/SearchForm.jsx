import Select from '../../../components/Common/Select/Select';
import Calendar from '../../../components/Common/Calendar/Calendar';


const SearchForm = ({ 
    services, 
    cities, 
    params, 
    onChange, 
    onSubmit, 
    loading,
    minDate 
}) => {
    return (
        <section className="appointment-search-section">
            <div className="appointment-container">
                <div className="search-form-container">
                    <form onSubmit={onSubmit} className="appointment-search-form">
                        <div className="form-group">
                            <Select
                                name="service"
                                value={params.service}
                                onChange={onChange}
                                required
                                placeholder="Выберите услугу"
                                options={services.map((service) => ({
                                    value: service.id,
                                    label: service.name
                                }))}
                            />
                        </div>

                        <div className="form-group">
                            <Select
                                name="city"
                                value={params.city}
                                onChange={onChange}
                                required
                                placeholder="Выберите город"
                                options={cities.map((city) => ({
                                    value: city,
                                    label: city
                                }))}
                            />
                        </div>

                        <div className="form-group">
                            <Calendar
                                name="date"
                                value={params.date}
                                onChange={onChange}
                                minDate={minDate}
                                required
                                placeholder="Выберите дату"
                            />
                        </div>

                        <button type="submit" className="btn-search" disabled={loading}>
                            {loading ? 'Поиск...' : 'Найти врача'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default SearchForm;
