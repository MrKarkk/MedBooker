import ButtonAppointment from '../../components/Common/ButtonAppointment';
import './Home.css';


const Home = () => {
    return (
        <>
            <section className="home-page-section">
                <div className="home-page-hero-content">
                    <h1 className="home-page-hero-title">
                        Лучшие врачи. <br />
                        Премиальный сервис. <br />
                        Надёжная запись.
                    </h1>
                    <p className="home-page-hero-subtitle">
                        Десятки подтверждённых клиник. <br />
                        Индивидуальная забота о вашем здоровье.
                    </p>

                    <ButtonAppointment link="appointment" text="Записаться на приём" />
                </div>
            </section>
        </>
    );
};

export default Home;
