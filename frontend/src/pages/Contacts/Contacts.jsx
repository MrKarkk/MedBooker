import { useState } from 'react';
import TelGif from '../../assets/gif/Contact us.gif'
import EmailGif from '../../assets/gif/contact-email.gif' 
import ClockGif from '../../assets/gif/Waiting.gif'
import coreAPI from '../../services/core';
import './Contacts.css';


const Contacts = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        message: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Очистка ошибки при изменении поля
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
            newErrors.fullName = 'Пожалуйста, введите ваше ФИО';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Пожалуйста, введите email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Пожалуйста, введите корректный email';
        }

        if (!formData.message.trim()) {
            newErrors.message = 'Пожалуйста, введите сообщение';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const payload = {
            full_name: formData.fullName,
            email: formData.email,
            message: formData.message,
        };

        try {
            await coreAPI.sendReceivedMessage(payload);
            setIsSubmitted(true);

            // Очистка формы
            setFormData({ fullName: '', email: '', message: '' });

            // Скрыть сообщение об успехе через 5 секунд
            setTimeout(() => setIsSubmitted(false), 5000);
        } catch (err) {
            // Показываем простую ошибку — можно расширить
            setErrors(prev => ({ ...prev, submit: err?.response?.data?.error || 'Ошибка отправки сообщения' }));
        }
    };

    return (
        <div style={{ padding: '6rem 0' }}>
            <div className="contact-page-container">
                <div className="contact-page-grid">
                    <div className="contact-page-info">
                        <h2>Мы всегда на связи</h2>
                        <p className="contact-page-description">
                            Если у вас есть вопросы, предложения или вам нужна помощь, 
                            мы будем рады помочь. Свяжитесь с нами удобным способом.
                        </p>

                        <div className="contact-page-methods">
                            <div className="contact-page-method">
                                <img className='contact-page-method-icon' src={TelGif} alt="Телефон" />
                                <div className="contact-page-method-content">
                                    <h3>Телефон</h3>
                                    <p>+992 (90) 363-45-54</p>
                                    <span className="contact-page-method-note">Звонок бесплатный</span>
                                </div>
                            </div>

                            <div className="contact-page-method">
                                <img className='contact-page-method-icon' src={EmailGif} alt="Email" />
                                <div className="contact-page-method-content">
                                    <h3>Email</h3>
                                    <p>abduaziz2208@gmail.com</p>
                                    <span className="contact-page-method-note">Ответим в течение 24 часов</span>
                                </div>
                            </div>

                            <div className="contact-page-method">
                                <img className='contact-page-method-icon' src={ClockGif} alt="Режим работы" />
                                <div className="contact-page-method-content">
                                    <h3>Режим работы</h3>
                                    <p>Круглосуточно, 24/7</p>
                                    <span className="contact-page-method-note">Без выходных</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="contact-page-form-wrapper">
                        <h2>Напишите нам</h2>
                        <p className="contact-page-form-description">
                            Заполните форму, и мы свяжемся с вами в ближайшее время
                        </p>

                        {isSubmitted && (
                            <div className="contact-page-success-message">
                                <span className="contact-page-success-icon">✓</span>
                                <p>Спасибо! Ваше сообщение успешно отправлено.</p>
                            </div>
                        )}

                        <form className="contact-page-contact-form" onSubmit={handleSubmit}>
                            <div className="contact-page-form-group">
                                <label htmlFor="fullName">ФИО <span className='span-appointmen'>⁕</span></label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Введите ваше полное имя"
                                    className={errors.fullName ? 'error' : ''}
                                />
                                {errors.fullName && (
                                    <span className="contact-page-error-message">{errors.fullName}</span>
                                )}
                            </div>

                            <div className="contact-page-form-group">
                                <label htmlFor="email">Email <span className='span-appointmen'>⁕</span></label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="example@mail.com"
                                    className={errors.email ? 'error' : ''}
                                />
                                {errors.email && (
                                    <span className="contact-page-error-message">{errors.email}</span>
                                )}
                            </div>

                            <div className="contact-page-form-group">
                                <label htmlFor="message">Сообщение <span className='span-appointmen'>⁕</span></label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Напишите ваше сообщение..."
                                    rows="6"
                                    className={errors.message ? 'error' : ''}
                                ></textarea>
                                {errors.message && (
                                    <span className="contact-page-error-message">{errors.message}</span>
                                )}
                            </div>

                            <button type="submit" className="btn-one contact-page-submit-btn">
                                Отправить сообщение
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contacts;
