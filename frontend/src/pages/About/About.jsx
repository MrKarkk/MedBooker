import { useEffect } from 'react';
import ButtonAppointment from '../../components/Common/ButtonAppointment.jsx';
import './About.css';
import MissionsGif from '../../assets/gif/Target.gif';
import logger from '../../services/logger';


const About = () => {
    useEffect(() => {
        logger.info('Страница «О нас» открыта');
    }, []);

    return (
        <div className="about-page">
            <section className="about-page-section">
                <div className="about-page-container">
                    <div className="about-page-intro-content">
                        <div className="about-page-mission-box">
                            <img className='about-page-mission-icon' src={MissionsGif} alt="MissionsGif" />
                            <div className="about-page-mission-content">
                                <h3>Наша миссия</h3>
                                <p>
                                Упростить путь к качественной медицине. Мы стремимся создать сервис, который позволит людям получать 
                                необходимую помощь без лишних ожиданий, сложностей и бюрократии.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="about-page-section">
                <div className="about-page-container">
                    <div className="about-page-section-header">
                        <h2 className="about-page-section-title">Что мы делаем</h2>
                        <p className="about-page-section-subtitle">
                        Мы создаём удобную цифровую среду для всех участников медицинского процесса
                        </p>
                    </div>

                    <div className="about-page-what-we-do-grid">
                        <div className="about-page-what-we-do-card">
                            <div className="about-page-card-header">
                                <div className="about-page-card-icon">👥</div>
                                <h3>Пациенты</h3>
                            </div>
                        <ul className="about-page-benefits-list">
                            <li>
                                <span className="about-page-check-icon">✓</span>
                                <span>Легко находят врачей и клиники, подходящие по специальности, рейтингу и расположению</span>
                            </li>
                            <li>
                                <span className="about-page-check-icon">✓</span>
                                <span>Записываются на приём в несколько кликов</span>
                            </li>
                            <li>
                                <span className="about-page-check-icon">✓</span>
                                <span>Получают напоминания, рекомендации и доступ к истории посещений</span>
                            </li>
                            <li>
                                <span className="about-page-check-icon">✓</span>
                                <span>Экономят время и избегают очередей</span>
                            </li>
                        </ul>
                        </div>

                        <div className="about-page-what-we-do-card">
                            <div className="about-page-card-header">
                                <div className="about-page-card-icon">🏥</div>
                                <h3>Врачи и клиники</h3>
                            </div>
                            <ul className="about-page-benefits-list">
                                <li>
                                    <span className="about-page-check-icon">✓</span>
                                    <span>Эффективно управляют расписанием</span>
                                </li>
                                <li>
                                    <span className="about-page-check-icon">✓</span>
                                    <span>Привлекают новых клиентов</span>
                                </li>
                                <li>
                                    <span className="about-page-check-icon">✓</span>
                                    <span>Получают удобные инструменты для коммуникации с пациентами</span>
                                </li>
                                <li>
                                    <span className="about-page-check-icon">✓</span>
                                    <span>Оптимизируют рабочие процессы</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className="about-page-section">
                <div className="about-page-container">
                    <div className="about-page-section-header">
                        <h2 className="about-page-section-title">Почему именно MedBooker?</h2>
                    </div>

                    <div className="about-page-why-grid">
                        <div className="about-page-why-card">
                            <h3>Простота и удобство</h3>
                            <p>
                                Интуитивно понятный интерфейс помогает быстро найти нужного специалиста и подобрать удобное время.
                            </p>
                        </div>

                        <div className="about-page-why-card">
                            <h3>Достоверность и качество</h3>
                            <p>
                                Мы сотрудничаем только с проверенными клиниками и сертифицированными врачами.
                            </p>
                        </div>

                        <div className="about-page-why-card">
                            <h3>Экономия времени</h3>
                            <p>
                                Больше не нужно звонить в регистратуры — вся запись проходит онлайн, когда удобно вам.
                            </p>
                        </div>

                        <div className="about-page-why-card">
                            <h3>Надёжность</h3>
                            <p>
                                Ваши данные защищены и хранятся в соответствии с современными стандартами безопасности.
                            </p>
                        </div>

                        <div className="about-page-why-card">
                            <h3>Широкий выбор специалистов</h3>
                            <p>
                                Тысячи врачей различных специальностей и клиник по всей стране в одной платформе.
                            </p>
                        </div>

                        <div className="about-page-why-card">
                            <h3>Прозрачность и отзывы</h3>
                            <p>
                                Реальные отзывы пациентов и полная информация о врачах помогут сделать правильный выбор.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="about-page-section">
                <div className="about-page-container">
                    <div className="about-page-goal-content">
                        <h2>Наша цель</h2>
                        <p>
                            Мы стремимся стать ведущей платформой для записи к врачам, которая поможет людям заботиться о здоровье 
                            легче, быстрее и с уверенностью в результате.
                        </p>
                        <p className="about-page-goal-highlight">
                            <samp>MedBooker</samp> — это шаг в будущее, где медицина становится ближе каждому.
                        </p>
                    </div>
                </div>
            </section>

            <section className="about-page-section">
                <div className="about-page-container">
                    <div className="about-page-vision-content">
                        <h2>Наше видение</h2>
                        <div className="about-page-vision-text">
                        <p>
                            Мы верим, что цифровизация медицины способна повысить качество жизни миллионов людей.
                        </p>
                        <p className="about-page-vision-emphasis">
                            MedBooker — это не просто сервис.
                        </p>
                        <p className="about-page-vision-tagline">
                            Это платформа, которая помогает людям заботиться о себе и своих близких.
                        </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="about-page-section">
                <div className="about-page-container">
                    <div className="about-page-cta-content">
                        <h2>Присоединяйтесь к MedBooker</h2>
                        <p>Начните заботиться о своём здоровье уже сегодня</p>
                        <ButtonAppointment link="appointment" text="Записаться на приём" />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
