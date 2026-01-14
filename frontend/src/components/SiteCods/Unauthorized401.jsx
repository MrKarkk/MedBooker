import { Link } from 'react-router-dom';
import './SiteCods.css';


const Unauthorized401 = () => {
    return (
        <div className="not-found-page">
            <div className="not-found-container">
                <div className="not-found-content">
                    {/* Большая цифра 401 */}
                    <div className="error-code">
                        <span className="error-digit">4</span>
                        <span className="error-digit highlight">0</span>
                        <span className="error-digit">1</span>
                    </div>

                    {/* Заголовок */}
                    <h1 className="error-title">Требуется авторизация</h1>

                    {/* Описание */}
                    <p className="error-description">
                        Для доступа к этой странице необходимо войти в систему.<br />
                        Пожалуйста, выполните вход или зарегистрируйтесь, чтобы продолжить.
                    </p>

                    {/* Действия */}
                    <div className="error-actions">
                        <Link to="/register" className="btn-primary">
                            Регистрация
                        </Link>
                        <Link to="/login" className="btn-secondary">
                            Войти
                        </Link>
                        <Link to="/contact" className="btn-secondary">
                            Связаться с нами
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Unauthorized401;
