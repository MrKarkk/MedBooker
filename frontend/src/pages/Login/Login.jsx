import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../services/logger';
import './Login.css';


const Login = () => {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Лог открытия страницы
    useEffect(() => {
        logger.info('Страница входа открыта (гость)');
    }, []);

    // Перенаправление на главную, если пользователь уже авторизован
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Введите email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Некорректный email';
        }

        if (!formData.password) {
            newErrors.password = 'Введите пароль';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Минимум 6 символов';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            setIsLoading(true);
            setErrors({});
            
            const result = await login({
                email: formData.email,
                password: formData.password
            }, rememberMe);
            
            setIsLoading(false);
            
            if (result.success) {
                logger.info('Успешный вход в систему', { email: formData.email });
                navigate('/', { replace: true });
            } else {
                logger.warning('Ошибка входа в систему', { email: formData.email, error: result.error });
                setErrors({ general: result.error });
            }
        }
    };
    
    function EyeOpen() {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <title>Eye-open SVG Icon</title>
                <g fill="none" stroke="#C6A667" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                    <path d="M21.257 10.962c.474.62.474 1.457 0 2.076C19.764 14.987 16.182 19 12 19c-4.182 0-7.764-4.013-9.257-5.962a1.692 1.692 0 0 1 0-2.076C4.236 9.013 7.818 5 12 5c4.182 0 7.764 4.013 9.257 5.962"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </g>
            </svg>
        )
    }

    function EyeClosed() {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <title>Eye-closed SVG Icon</title>
                <path fill="#C6A667" d="M12 17.5c-3.8 0-7.2-2.1-8.8-5.5H1c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5h-2.2c-1.6 3.4-5 5.5-8.8 5.5"></path>
            </svg>
        )
    }

    return (
        <div className="login">
            <div className="login-container">
                <div className="login-content">
                    {/* Left Side - Form */}
                    <div className="login-form-section">
                        <div className="login-header">
                            <h1>Добро пожаловать</h1>
                            <p>Войдите в свой аккаунт MedBooker</p>
                        </div>

                        {errors.general && (
                            <div style={{
                                padding: '12px',
                                marginBottom: '20px',
                                backgroundColor: '#ff6b6b',
                                color: 'white',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                {errors.general}
                            </div>
                        )}

                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="email">Email <span className='span-appointmen'>⁕</span></label>
                                <div className="input-wrapper">
                                    <span className="input-icon">✉️</span>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="example@mail.com"
                                        className={errors.email ? 'error' : ''}
                                        style={{padding: '1rem 1rem 1rem 3rem'}}
                                    />
                                </div>
                                {errors.email && (
                                    <span className="auth-page-error-message">{errors.email}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Пароль <span className='span-appointmen'>⁕</span></label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🔒</span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Введите пароль"
                                        className={errors.password ? 'error' : ''}
                                        style={{padding: '1rem 1rem 1rem 3rem'}}
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? EyeOpen() : EyeClosed()}
                                    </button>
                                </div>
                                {errors.password && (
                                    <span className="auth-page-error-message">{errors.password}</span>
                                )}
                            </div>

                            <div className="form-footer">
                                <label className="remember-me">
                                    <input 
                                        type="checkbox" 
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span>Запомнить меня</span>
                                </label>
                                <a href="/forgot-password" className="forgot-link">
                                    Забыли пароль?
                                </a>
                            </div>

                            <button type="submit" className="btn-one" style={{width: '100%'}} disabled={isLoading}>
                                {isLoading ? 'Вход...' : 'Войти'}
                            </button>
                        </form>

                        <div className="login-redirect">
                            <p>
                                Нет аккаунта?{' '}
                                <a href="/register">Зарегистрироваться</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
