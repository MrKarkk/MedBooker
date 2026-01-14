import { useState, useEffect } from 'react';
import appointmentAPI from '../../../services/appointment';

/**
 * Хук для поиска врачей и управления состоянием поиска
 * @param {Object} params - Параметры
 * @param {Object} params.notify - Объект для показа уведомлений
 * @returns {Object} - Состояния и методы для поиска
 */
export function useAppointmentSearch({ notify }) {
    const [searchParams, setSearchParams] = useState({
        service: '',
        city: '',
        date: '',
    });

    const [services, setServices] = useState([]);
    const [cities, setCities] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // Загрузка услуг и городов при монтировании
    useEffect(() => {
        const loadData = async () => {
            const loadingId = notify.loading('Загрузка данных...');
            try {
                const data = await appointmentAPI.getServicesAndCities();
                setServices(Array.isArray(data.services) ? data.services : []);
                setCities(Array.isArray(data.cities) ? data.cities : []);
                notify.hide(loadingId);


                // Проверка URL параметров для автоматического поиска
                const urlParams = new URLSearchParams(window.location.search);
                const service = urlParams.get('service');
                const city = urlParams.get('city');
                const date = urlParams.get('date');

                if (service && city && date) {
                    const params = { service, city, date };
                    setSearchParams(params);
                    
                    // Выполняем поиск автоматически
                    setTimeout(() => {
                        performSearch(params);
                    }, 100);
                }
            } catch (err) {
                notify.hide(loadingId);
                console.error('Ошибка загрузки данных:', err);
                notify.error('Не удалось загрузить данные для поиска');
            }
        };

        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Выполнение поиска врачей
    const performSearch = async (params) => {
        if (!params.service || !params.city || !params.date) {
            notify.error('Заполните все поля для поиска');
            return;
        }

        const loadingId = notify.loading('Поиск врачей...');
        setLoading(true);
        setSearched(true);

        try {
            const result = await appointmentAPI.searchDoctors(
                params.service,
                params.city,
                params.date
            );

            setDoctors(result.doctors || []);
            notify.hide(loadingId);

            if (result.doctors.length === 0) {
                notify.error('К сожалению, свободных слотов не найдено. Попробуйте другую дату или услугу.');
            } else {
                notify.success(`Найдено врачей: ${result.doctors.length}`);
            }
        } catch (err) {
            console.error('Ошибка поиска:', err);
            notify.hide(loadingId);
            notify.error('Произошла ошибка при поиске. Попробуйте еще раз.');
        } finally {
            setLoading(false);
        }
    };

    // Обработчик поиска из формы
    const search = async () => {
        await performSearch(searchParams);
    };

    return {
        searchParams,
        setSearchParams,
        services,
        cities,
        doctors,
        loading,
        searched,
        search,
    };
}
