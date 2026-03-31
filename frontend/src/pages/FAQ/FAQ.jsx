import { useState, useEffect } from 'react';
import core from '../../services/core';
import logger from '../../services/logger';
import './FAQ.css';

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);
    const [faqData, setFaqData] = useState([]);

    useEffect(() => {
        logger.info('Страница FAQ открыта');
        const fetchFAQ = async () => {
            try {
                const data = await core.getFAQEntries();
                setFaqData(data);
                logger.info('FAQ загружены', { count: data.length });
            } catch (err) {
                logger.error('Ошибка загрузки FAQ', { error: err?.message });
            }
        };

        fetchFAQ();
    }, []);
    const toggleAccordion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div style={{padding: '6rem 0'}}>
            <div className="faq-page-container">
                <div className="faq-page-intro">
                    <p>
                        Не нашли ответ на свой вопрос?{' '}
                        <a href="/contact" className="faq-page-contact-link link">Свяжитесь с нами</a>
                    </p>
                </div>

                <div className="faq-page-list">
                    {faqData.map((item, index) => (
                        <div 
                            key={index} 
                            className={`faq-page-item ${openIndex === index ? 'active' : ''}`}
                        >
                            <button 
                                className="faq-page-question"
                                onClick={() => toggleAccordion(index)}
                            >
                                <span>{item.question}</span>
                                <span className="faq-page-icon"></span>
                            </button>
                            <div className="faq-page-answer">
                                <p>{item.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FAQ;
