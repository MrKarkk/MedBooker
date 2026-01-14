import { Link } from 'react-router-dom';
import './SiteCods.css';


const Forbidden403 = () => {
    return (
        <div className="not-found-page">
            <div className="not-found-container">
                <div className="not-found-content">
                    {/* Большая цифра 403 */}
                    <div className="error-code">
                        <span className="error-digit">4</span>
                        <span className="error-digit highlight">0</span>
                        <span className="error-digit">3</span>
                    </div>

                    {/* Заголовок */}
                    <h1 className="error-title">Доступ запрещён</h1>

                    {/* Описание */}
                    <p className="error-description">
                        У вас нет прав для просмотра этой страницы.<br />
                        Если вы считаете, что это ошибка — обратитесь в поддержку или войдите под другим аккаунтом.
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

export default Forbidden403;
