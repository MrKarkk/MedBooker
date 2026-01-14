import { Link } from 'react-router-dom';
import './SiteCods.css';


const NotFound404 = () => {
    return (
        <div className="not-found-page">
            <div className="not-found-container">
                <div className="not-found-content">
                    {/* Большая цифра 404 */}
                    <div className="error-code">
                        <span className="error-digit">4</span>
                        <span className="error-digit highlight">0</span>
                        <span className="error-digit">4</span>
                    </div>

                    {/* Заголовок */}
                    <h1 className="error-title">Страница не найдена</h1>

                    {/* Описание */}
                    <p className="error-description">
                        К сожалению, запрашиваемая страница не существует или была перемещена.
                        Возможно, вы перешли по устаревшей ссылке или ввели неверный адрес.
                    </p>

                    {/* Действия */}
                    <div className="error-actions">
                        <Link to="/" className="btn-primary">
                            Вернуться на главную
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

export default NotFound404;
