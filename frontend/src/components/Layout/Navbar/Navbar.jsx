import './Navbar.css';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';


const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    
    const { user, isAuthenticated, logout, loading } = useAuth();
    const userMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                // Проверяем, что клик не по кнопке меню
                const menuButton = document.querySelector('.mobile-menu-btn');
                if (menuButton && !menuButton.contains(event.target)) {
                    setIsMenuOpen(false);
                }
            }
        };

        if (isUserMenuOpen || isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isUserMenuOpen, isMenuOpen]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleUserMenu = () => {
        setIsUserMenuOpen(!isUserMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
        setOpenDropdown(null);
    };

    const closeUserMenu = () => {
        setIsUserMenuOpen(false);
    };

    const toggleDropdown = (dropdownName) => {
        setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
    };

    const confirmLogout = async () => {
        await logout();
        setIsUserMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-logo">
                    <Link to="/" onClick={closeMenu}>
                        <h1>MEDBOOKER</h1>
                    </Link>
                </div>
                
                <ul className={`navbar-menu ${isMenuOpen ? 'active' : ''}`} ref={mobileMenuRef}>
                
                {/* О нас - Dropdown */}
                <li className={`navbar-dropdown ${openDropdown === 'about' ? 'active' : ''}`}>
                    <button 
                        className="navbar-link dropdown-toggle link" 
                        onClick={() => toggleDropdown('about')}
                    >
                        О нас
                    </button>
                    <ul className="dropdown-menu">
                        <li><Link to="/about" onClick={closeMenu}>О нас</Link></li>
                        <li><Link to="/contact" onClick={closeMenu}>Контакты</Link></li>
                        <li><Link to="/help" onClick={closeMenu}>Помощь</Link></li>
                        <li><Link to="/commercial" onClick={closeMenu}>Коммерческое предложение</Link></li>
                    </ul>
                </li>

                {/* Клиники - Dropdown */}
                <li className={`navbar-dropdown ${openDropdown === 'clinics' ? 'active' : ''}`}>
                    <button 
                        className="navbar-link dropdown-toggle link" 
                        onClick={() => toggleDropdown('clinics')}
                    >
                        Клиники
                    </button>
                    <ul className="dropdown-menu">
                        <li><Link to="/clinics/reliable" onClick={closeMenu}>Надежные клиники</Link></li>
                        <li><Link to="/clinics/search" onClick={closeMenu}>Поиск клиники</Link></li>
                    </ul>
                </li>

                {/* Врачи - Dropdown */}
                <li className={`navbar-dropdown ${openDropdown === 'doctors' ? 'active' : ''}`}>
                    <button 
                        className="navbar-link dropdown-toggle link" 
                        onClick={() => toggleDropdown('doctors')}
                    >
                        Врачи
                    </button>
                    <ul className="dropdown-menu">
                        <li><Link to="/doctors/popular" onClick={closeMenu}>Популярные врачи</Link></li>
                        <li><Link to="/doctors/search" onClick={closeMenu}>Поиск врачей</Link></li>
                    </ul>
                </li>

                <li className="navbar-dropdown">
                    <button className="navbar-link dropdown-toggle link" >
                        <Link to="/appointment" className='color-accent-gold' onClick={closeMenu}>
                            Записаться на прием
                        </Link>
                    </button>
                </li>
            </ul>
            
            {!loading && (
                isAuthenticated ? (
                    <div className="navbar-user" ref={userMenuRef}>
                        <button 
                            className="user-avatar-btn"
                            onClick={toggleUserMenu}
                            aria-label="User menu"
                        >
                            <div className="user-avatar">
                                <span>{user?.full_name?.charAt(0) || 'U'}</span>
                            </div>
                        </button>

                        {isUserMenuOpen && (
                            <div className="user-menu">
                                <div className="user-menu-header">
                                    <div className="user-menu-avatar">
                                        <span>{user?.full_name?.charAt(0) || 'U'}</span>
                                    </div>
                                    <div className="user-menu-info">
                                        <p className="user-menu-name">{user?.full_name || 'Пользователь'}</p>
                                        <p className="user-menu-email">{user?.email || ''}</p>
                                    </div>
                                </div>
                                <div className="user-menu-divider"></div>
                                <ul className="user-menu-list">
                                    <li>
                                        <Link to="/profile" onClick={closeUserMenu}>
                                            <span className="menu-icon">👤</span>
                                            <span>Мой профиль</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/my-appointments" onClick={closeUserMenu}>
                                            <span className="menu-icon">📅</span>
                                            {user?.role === 'clinic_admin' || user?.role === 'super_admin' ? (
                                                <span>Все записи</span>
                                            ) : (
                                                <span>Мои записи</span>
                                            )}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/settings" onClick={closeUserMenu}>
                                            <span className="menu-icon">⚙️</span>
                                            <span>Настройки</span>
                                        </Link>
                                    </li>
                                    {user?.role === 'clinic_admin' || user?.role === 'clinic_queue_admin' ? (
                                        <li>
                                            <Link to="/today-appointments" onClick={closeUserMenu}>
                                                <span className="menu-icon">🪟</span>
                                                <span>Окно очередей</span>
                                            </Link>
                                        </li>
                                    ) : null}
                                    
                                </ul>
                                <div className="user-menu-divider"></div>
                                <button className="logout-btn" onClick={confirmLogout}>
                                    <span className="menu-icon">🚪</span>
                                    <span>Выйти</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`navbar-actions ${isMenuOpen ? 'active' : ''}`}>
                        <Link to="/login">
                            <button className="btn-secondary">Войти</button>
                        </Link>
                        <Link to="/register">
                            <button className="btn-primary">Регистрация</button>
                        </Link>
                    </div>
                )
            )}

                <button 
                    className={`mobile-menu-btn ${isMenuOpen ? 'active' : ''}`}
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
