import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './TodayAppointments.css';
import Forbidden403 from '../../components/SiteCods/Forbidden403';
import Unauthorized401 from '../../components/SiteCods/Unauthorized401';
import { useElectronicQueue } from './hooks/useElectronicQueue';
import logger from '../../services/logger';


const TodayAppointments = () => {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [audioEnabled, setAudioEnabled] = useState(false);
    const audioRef = useRef(null);
    const audioQueueRef = useRef([]);
    const isPlayingRef = useRef(false);

    // Функция включения аудио (требуется взаимодействие пользователя)
    const enableAudio = () => {
        setAudioEnabled(true);
        logger.info('Пользователь включил звук на экране очереди');
        // Создаем тихое аудио и воспроизводим для активации автовоспроизведения
        const silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
        silentAudio.play().then(() => {
        }).catch(err => {
            console.error('Не удалось активировать аудио:', err);
        });
    };

    // Функция воспроизведения аудио из base64
    const playAudioFromBase64 = (base64Audio) => {
        if (!audioEnabled) {
            console.warn('⚠️ Аудио не активировано. Нажмите кнопку "Включить звук"');
            return;
        }

        try {
            // Декодируем base64 в binary
            const binaryString = atob(base64Audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Создаем blob из binary data
            const blob = new Blob([bytes], { type: 'audio/ogg; codecs=opus' });
            const url = URL.createObjectURL(blob);
            
            
            // Останавливаем предыдущее аудио если играет
            if (audioRef.current) {
                audioRef.current.pause();
                if (audioRef.current.src.startsWith('blob:')) {
                    URL.revokeObjectURL(audioRef.current.src);
                }
            }
            
            // Создаем новый Audio объект
            const audio = new Audio(url);
            audio.volume = 1.0;
            audioRef.current = audio;
            
            audio.onloadedmetadata = () => {
            };
            
            audio.onended = () => {
                // Очищаем ресурсы после воспроизведения
                URL.revokeObjectURL(url);
                isPlayingRef.current = false;
                
                // Проигрываем следующее аудио из очереди
                playNextAudio();
            };
            
            audio.onerror = (e) => {
                console.error('❌ Ошибка воспроизведения аудио:', e);
                console.error('Audio error details:', audio.error);
                URL.revokeObjectURL(url);
                isPlayingRef.current = false;
                playNextAudio();
            };
            
            // Воспроизводим
            isPlayingRef.current = true;
            audio.play().then(() => {
            }).catch(error => {
                console.error('❌ Не удалось воспроизвести аудио:', error);
                URL.revokeObjectURL(url);
                isPlayingRef.current = false;
                playNextAudio();
            });
            
        } catch (error) {
            console.error('❌ Ошибка при обработке base64 аудио:', error);
            isPlayingRef.current = false;
            playNextAudio();
        }
    };

    // Функция для проигрывания следующего аудио из очереди
    const playNextAudio = () => {
        if (audioQueueRef.current.length > 0 && !isPlayingRef.current) {
            const nextAudio = audioQueueRef.current.shift();
            playAudioFromBase64(nextAudio);
        }
    };

    // Обработчик голосовых объявлений из SSE
    const handleVoiceAnnouncement = (announcement) => {
        if (announcement.audio_base64) {
            
            // Добавляем в очередь
            audioQueueRef.current.push(announcement.audio_base64);
            
            // Если ничего не играет, начинаем воспроизведение
            if (!isPlayingRef.current) {
                playNextAudio();
            }
        }
    };
    
    // Используем хук для управления электронной очередью
    const clinicId = user?.clinics?.[0]?.id;
    
    const {
        appointments,
        loading,
        error,
        hasAccess,
        isElectronicQueue
    } = useElectronicQueue(clinicId, handleVoiceAnnouncement);

    // Обновление времени каждую секунду
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Лог открытия страницы очереди
    useEffect(() => {
        if (user) {
            logger.info('Экран электронной очереди открыт', { clinic_id: clinicId, user: user?.email });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Очистка аудио ресурсов при размонтировании
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                if (audioRef.current.src) {
                    URL.revokeObjectURL(audioRef.current.src);
                }
            }
        };
    }, []);

    // Функция получения CSS класса статуса
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'status-pending';
            case 'confirmed':
                return 'status-pending';
            case 'invited':
                return 'status-invited';
            case 'urgent':
                return 'status-urgent';
        }
    };

    // Форматирование времени
    const formatTime = (date) => {
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="queue-loading">
                <div className="queue-loading-text">Подключение к серверу...</div>
            </div>
        );
    }

    if (user == null) {
        return (
            <Unauthorized401 />
        );
    }

    if (user?.role !== 'clinic_admin') {
        return (
            <Forbidden403 />
        );
    }

    // Проверка доступа к электронной очереди
    if (!hasAccess || !isElectronicQueue) {
        return (
            <Forbidden403 />
        );
    }

    // Показываем сообщение об ошибке, если есть
    if (error && !loading) {
        return (
            <div className="queue-container">
                <div className="queue-empty">
                    <div className="queue-empty-content">
                        <div className="queue-empty-title" style={{ color: '#ef4444' }}>
                            Ошибка подключения
                        </div>
                        <div className="queue-empty-subtitle">
                            {error}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="queue-container">
            {/* Навбар */}
            <nav className="queue-navbar">
                <div className="queue-navbar-content">
                    <div className="queue-navbar-inner">
                        {/* Логотип */}
                        <div className="queue-logo-section">
                            <Link to="/" className="queue-logo">
                                MEDBOOKER
                            </Link>
                        </div>

                        {/* Статус подключения и текущее время */}
                        <div className="queue-time">
                            {formatTime(currentTime)}
                        </div>

                        {/* Кнопка включения звука */}
                        {!audioEnabled && (
                            <button
                                onClick={enableAudio}
                                style={{
                                    marginLeft: '20px',
                                    padding: '10px 20px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                🔊 Включить звук
                            </button>
                        )}
                        {audioEnabled && (
                            <div style={{
                                marginLeft: '20px',
                                padding: '10px 20px',
                                backgroundColor: '#059669',
                                color: 'white',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                ✅ Звук включен
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Основная зона - Grid карточек */}
            <main className="queue-main">
                {appointments.filter(apt => !['missed', 'canceled', 'finished'].includes(apt.status?.toLowerCase())).length === 0 ? (
                    <div className="queue-empty">
                        <div className="queue-empty-content">
                            <div className="queue-empty-title">
                                Нет записей на сегодня
                            </div>
                            <div className="queue-empty-subtitle">
                                Записи появятся здесь автоматически
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="queue-grid">
                        {appointments
                            .filter(apt => !['missed', 'canceled', 'finished'].includes(apt.status?.toLowerCase()))
                            .map((appointment) => (
                            <div key={appointment.id} className="queue-card">
                                {/* Цветная полоса статуса */}
                                <div className={`queue-status-bar ${getStatusColor(appointment.status)}`}></div>

                                {/* Контент карточки */}
                                <div className="queue-card-content">
                                    {/* Фамилия пациента */}
                                    <div className="queue-patient-name">
                                        {appointment.patient_full_name?.split(' ')[0] || 'Пациент'}
                                    </div>

                                    <div className="queue-coupon-number-doctor-cabinet">
                                        {/* Номер талона */}
                                        <div className="queue-coupon-number">
                                            {appointment.number_coupon || (appointment.time_start ? appointment.time_start.slice(0, 5) : '')}
                                        </div>
                                        {/* Кабинет врача */}
                                        <div className="queue-doctor-cabinet">
                                            {appointment.doctor_cabinet_number || '—'}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default TodayAppointments;