import { API_BASE_URL } from '../../../config';
import { Link } from 'react-router-dom';
import './Footer.css';


const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-grid">
                    {/* О сервисе */}
                    <div className="footer-column display-none">
                        <h3 className="footer-title">О сервисе</h3>
                        <ul className="footer-links">
                        <li><Link to="/about">О нас</Link></li>
                        <li><a href="#">Как это работает</a></li>
                        <li><a href="#">Наши клиники</a></li>
                        <li><a href="#">Врачи</a></li>
                        </ul>
                    </div>

                    {/* Пациентам */}
                    <div className="footer-column display-none">
                        <h3 className="footer-title">Пациентам</h3>
                        <ul className="footer-links">
                        <li><Link to="/appointment">Поиск врача</Link></li>
                        <li><Link to="/appointment">Специальности</Link></li>
                        <li><Link to="/appointment">Цены</Link></li>
                        <li><a href="#">Отзывы</a></li>
                        </ul>
                    </div>

                    {/* Поддержка */}
                    <div className="footer-column display-none">
                        <h3 className="footer-title">Поддержка</h3>
                        <ul className="footer-links">
                        <li><Link to="/help">Частые вопросы</Link></li>
                        <li><Link to="/help">Помощь</Link></li>
                        <li><Link to="/contact">Контакты</Link></li>
                        <li><a href={`${API_BASE_URL}/core/document/privacy-policy/`} target="_blank" rel="noopener noreferrer">Политика конфиденциальности</a></li>
                        </ul>
                    </div>

                    {/* Контакты */}
                    <div className="footer-column">
                        <h3 className="footer-title">Контакты</h3>
                        <ul className="footer-contacts">
                            <li>
                                <a href="tel:+992903634554">+992 (90) 363-45-54</a>
                            </li>
                            <li>
                                <a href="mailto:abduaziz2208@gmail.com">abduaziz2208@gmail.com</a>
                            </li>
                            <li>
                                <span>GitHub: <a href="https://github.com/MrKarkk">@mrkark</a></span>
                            </li>
                            <li>
                                <span>Telegramm: <a href="https://t.me/aziz070724">@aziz070724</a></span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-divider"></div>

                <div className="footer-bottom">
                    <div className="footer-logo">
                        <h2>MEDBOOKER</h2>
                        <p>Премиальный сервис онлайн-записи к врачам</p>
                        
                    </div>
                    <div className="footer-copyright">
                        <p>&copy; 2025 MedBooker. Все права защищены.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
