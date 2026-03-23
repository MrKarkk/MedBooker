import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../components/Notification/useNotification';
import { API_BASE_URL } from '../config';
import './Register.css';


const Register = () => {
    const { register, isAuthenticated } = useAuth();
    const { success, error } = useNotification();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agreed: false
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Перенаправление на главную, если пользователь уже авторизован
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Введите ФИО';
        } else if (formData.fullName.trim().split(' ').length < 2) {
            newErrors.fullName = 'Введите полное имя (Фамилия Имя)';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Введите email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Некорректный email';
        }

        if (!formData.password) {
            newErrors.password = 'Введите пароль';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Минимум 8 символов';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Пароль должен содержать заглавные, строчные буквы и цифры';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Повторите пароль';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Пароли не совпадают';
        }

        if (!formData.agreed) {
            newErrors.agreed = 'Необходимо согласие с условиями';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            setIsLoading(true);
            setErrors({});
            
            const result = await register({
                email: formData.email,
                full_name: formData.fullName,
                phone_number: formData.phone || '+70000000000',
                password: formData.password,
                password_confirm: formData.confirmPassword
            });
            
            setIsLoading(false);
            
            if (result.success) {
                success('Регистрация успешна! Добро пожаловать в MedBooker!');
                setTimeout(() => navigate('/', { replace: true }), 1500);
            } else {
                // Обработка ошибок с сервера
                if (result.errors) {
                    const serverErrors = {};
                    if (result.errors.email) serverErrors.email = Array.isArray(result.errors.email) ? result.errors.email[0] : result.errors.email;
                    if (result.errors.password) serverErrors.password = Array.isArray(result.errors.password) ? result.errors.password.join(', ') : result.errors.password;
                    if (result.errors.full_name) serverErrors.fullName = Array.isArray(result.errors.full_name) ? result.errors.full_name[0] : result.errors.full_name;
                    if (result.errors.phone_number) serverErrors.phone = Array.isArray(result.errors.phone_number) ? result.errors.phone_number[0] : result.errors.phone_number;
                    setErrors(serverErrors);
                    error(result.error || 'Ошибка регистрации. Проверьте введённые данные.');
                } else {
                    error(result.error || 'Ошибка регистрации. Попробуйте позже.');
                }
            }
        }
    };

    const getPasswordStrength = () => {
        const password = formData.password;
        if (!password) return { strength: 0, text: '' };
        
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        const levels = ['Слабый', 'Средний', 'Хороший', 'Отличный'];
        return { strength, text: levels[Math.min(strength - 1, 3)] || '' };
    };

    const passwordStrength = getPasswordStrength();
    
    function EyeOpen() {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <title>Eye-open SVG Icon</title>
                <g fill="none" stroke="#D2B48C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
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
                <path fill="#D2B48C" d="M12 17.5c-3.8 0-7.2-2.1-8.8-5.5H1c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5h-2.2c-1.6 3.4-5 5.5-8.8 5.5"></path>
            </svg>
        )
    }

    return (
        <div className="register">
            <div className="register-container">
                <div className="register-content">

                    {/* Right Side - Form */}
                    <div className="register-form-section">
                        <div className="register-header">
                            <h1>Создать аккаунт</h1>
                            <p>Заполните данные для регистрации</p>
                        </div>

                        <form className="register-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="fullName">ФИО <span className='span-appointmen'>⁕</span></label>
                                <div className="input-wrapper">
                                    <span className="input-icon">👤</span>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Иванов Иван Иванович"
                                        className={errors.fullName ? 'error' : ''}
                                        style={{padding: '1rem 1rem 1rem 3rem'}}
                                    />
                                </div>
                                {errors.fullName && (
                                    <span className="auth-page-error-message">{errors.fullName}</span>
                                )}
                            </div>

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
                                <label htmlFor="phone">Телефон <span className='span-appointmen'>⁕</span></label>
                                <div className="input-wrapper">
                                    <span className="input-icon">📱</span>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+7 (999) 123-45-67"
                                        className={errors.phone ? 'error' : ''}
                                        style={{padding: '1rem 1rem 1rem 3rem'}}
                                    />
                                </div>
                                {errors.phone && (
                                    <span className="auth-page-error-message">{errors.phone}</span>
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
                                        placeholder="Минимум 8 символов"
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
                                {formData.password && passwordStrength.text && (
                                    <div className="password-strength">
                                        <div className="strength-bars">
                                            {[...Array(4)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`strength-bar ${
                                                        i < passwordStrength.strength ? 'active' : ''
                                                    }`}
                                                ></div>
                                            ))}
                                        </div>
                                        <span className="strength-text">{passwordStrength.text}</span>
                                    </div>
                                )}
                                {errors.password && (
                                    <span className="auth-page-error-message">{errors.password}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Повторите пароль <span className='span-appointmen'>⁕</span></label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🔒</span>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Повторите пароль"
                                        className={errors.confirmPassword ? 'error' : ''}
                                        style={{padding: '1rem 1rem 1rem 3rem'}}
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showPassword ? EyeOpen() : EyeClosed()}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <span className="auth-page-error-message">{errors.confirmPassword}</span>
                                )}
                            </div>

                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="agreed"
                                        checked={formData.agreed}
                                        onChange={handleChange}
                                        className={errors.agreed ? 'error' : ''}
                                    />
                                    <span className="checkbox-custom"></span>
                                    <span className="checkbox-text">
                                        Я согласен с{' '}
                                        <a href={`${API_BASE_URL}/core/document/terms-of-service/`} target="_blank">Условиями использования</a>
                                        {' '}и{' '}
                                        <a href={`${API_BASE_URL}/core/document/privacy-policy/`} target="_blank">Политикой конфиденциальности</a>
                                    </span>
                                </label>
                                {errors.agreed && (
                                    <span className="auth-page-error-message">{errors.agreed}</span>
                                )}
                            </div>

                            <button type="submit" className="btn-one" style={{width: '100%'}} disabled={isLoading}>
                                {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                            </button>
                        </form>

                        <div className="register-redirect">
                            <p>
                                Уже есть аккаунт?{' '}
                                <a href="/login">Войти</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
