import Navbar from './Navbar/Navbar';
import Footer from './Footer/Footer';
import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { prefetchOnIdle } from './utils/prefetch';
import Snowfall from 'react-snowfall'


const Layout = () => {
    // Предзагрузка часто посещаемых страниц после загрузки основного контента
    useEffect(() => {
        // Загружаем популярные страницы в фоне когда браузер свободен
        prefetchOnIdle(() => import('../../pages/About/About'));
        prefetchOnIdle(() => import('../../pages/Contacts/Contacts'));
        prefetchOnIdle(() => import('../../pages/Appointment/AppointmentPage'));
        prefetchOnIdle(() => import('../../pages/Login/Login'));
    }, []);

    return (
        <div className="app">
            <Navbar />
            <main className="main-content">
                {/* <Snowfall color='white' snowflakeCount={200} /> */}
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
