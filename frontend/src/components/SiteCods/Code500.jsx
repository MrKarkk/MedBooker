import { Link } from 'react-router-dom';
import './SiteCods.css';


const Code500 = () => {
    return (
        <div className="not-found-page">
            <div className="not-found-container">
                <div className="not-found-content">
                    {/* Большая цифра 500 */}
                    <div className="error-code">
                        <span className="error-digit">5</span>
                        <span className="error-digit highlight">0</span>
                        <span className="error-digit">0</span>
                    </div>

                    {/* Заголовок */}
                    <h1 className="error-title">Внутренняя ошибка сервера</h1>

                    {/* Описание */}
                    <p className="error-description">
                        На сервере произошла непредвиденная ошибка.<br />
                        Пожалуйста, попробуйте обновить страницу или зайдите позже.<br />
                        Если проблема повторяется — обратитесь в поддержку.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Code500;
