import './Commercial.css';

const VITE_API_URL = import.meta.env.VITE_API_URL;


const Commercial = () => {

    const handleDocument = (version) => {
        const url = `${VITE_API_URL}/core/document/commercial/${version}/`;
        window.open(url, '_blank');
    };

    return (
        <div className="commercial-page">

            {/* CTA Section */}
            <section className="section cta-section-commercial">
                <div className="section-content">                    
                    {/* Download Buttons */}
                    <div className="download-section">
                        <div className="download-buttons">
                            <button 
                                className="download-btn download-btn-life"
                                onClick={() => handleDocument('life')}
                            >
                                <span className="btn-icon">📄</span>
                                <span className="btn-text">
                                    <span className="btn-main">Краткая версия</span>
                                    <span className="btn-sub">Основная информация</span>
                                </span>
                            </button>
                            <button 
                                className="download-btn download-btn-full"
                                onClick={() => handleDocument('full')}
                            >
                                <span className="btn-icon">📋</span>
                                <span className="btn-text">
                                    <span className="btn-main">Полная версия</span>
                                    <span className="btn-sub">Детальное описание</span>
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="contact-info">
                        <h3 className="contact-title">Контакты</h3>
                        <div className="contact-links">
                            <a href="tel:+992903634554" className="contact-link-commercial">
                                <span className="contact-icon">📞</span>
                                <span>Телефон: +992903634554</span>
                            </a>
                            <a href="https://t.me/mrkarkk" target="_blank" rel="noopener noreferrer" className="contact-link-commercial">
                                <span className="contact-icon">💬</span>
                                <span>Telegram: @aziz070724</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Commercial;
