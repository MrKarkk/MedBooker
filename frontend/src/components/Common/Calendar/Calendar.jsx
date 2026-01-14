import React, { useState, useRef, useEffect } from 'react';
import './Calendar.css';

const Calendar = ({ 
    value, 
    onChange, 
    label, 
    name, 
    required, 
    minDate = null, // Минимальная дата (для запрета прошлых дат)
    maxDate = null, // Максимальная дата
    placeholder = 'Выберите дату' 
    }) => {
    const [open, setOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const calendarRef = useRef(null);
    const openTimeoutRef = useRef(null);

    // Закрытие при клике вне
    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
        if (calendarRef.current && !calendarRef.current.contains(e.target)) {
            setOpen(false);
        }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    // Очистка таймаута
    useEffect(() => {
        return () => {
        if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
        };
    }, []);

    // Установка текущего месяца при открытии
    useEffect(() => {
        if (open && value) {
        const date = new Date(value);
        if (!isNaN(date)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCurrentMonth(date);
        }
        }
    }, [open, value]);

    const handleToggle = () => {
        if (!open) {
        openTimeoutRef.current = setTimeout(() => setOpen(true), 80);
        } else {
        setOpen(false);
        }
    };

    const handleDateSelect = (date) => {
        const formattedDate = formatDate(date);
        onChange({ target: { name, value: formattedDate } });
        setOpen(false);
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return placeholder;
        const date = new Date(dateStr);
        if (isNaN(date)) return placeholder;
        const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const isDateDisabled = (date) => {
        if (minDate) {
        const min = new Date(minDate);
        min.setHours(0, 0, 0, 0);
        if (date < min) return true;
        }
        if (maxDate) {
        const max = new Date(maxDate);
        max.setHours(23, 59, 59, 999);
        if (date > max) return true;
        }
        return false;
    };

    const changeMonth = (delta) => {
        setCurrentMonth(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + delta);
        return newDate;
        });
    };

    const getDaysInMonth = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Понедельник = 0

        const days = [];
        
        // Пустые ячейки для начала месяца
        for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
        }
        
        // Дни текущего месяца
        for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
        }
        
        return days;
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isSelected = (date) => {
        if (!date || !value) return false;
        const selectedDate = new Date(value);
        return date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
    };

    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
        <div className="custom-calendar-wrapper" ref={calendarRef}>
        {label && <label className="custom-calendar-label">{label}</label>}
        <button
            type="button"
            className={`custom-calendar-input${open ? ' active' : ''}`}
            onClick={handleToggle}
            required={required}
        >
            <span className={`custom-calendar-value${!value ? ' placeholder' : ''}`}>
            {formatDisplayDate(value)}
            </span>
            <span className="custom-select-arrow" />
        </button>
        
        {open && (
            <div className="custom-calendar-dropdown">
            <div className="calendar-header">
                <button type="button" className="calendar-nav" onClick={() => changeMonth(-1)}>‹</button>
                <span className="calendar-month-year">
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button type="button" className="calendar-nav" onClick={() => changeMonth(1)}>›</button>
            </div>
            
            <div className="calendar-weekdays">
                {weekDays.map(day => (
                <div key={day} className="calendar-weekday">{day}</div>
                ))}
            </div>
            
            <div className="calendar-days">
                {getDaysInMonth().map((date, index) => {
                if (!date) {
                    return <div key={`empty-${index}`} className="calendar-day empty" />;
                }
                
                const disabled = isDateDisabled(date);
                const today = isToday(date);
                const selected = isSelected(date);
                
                return (
                    <button
                    key={index}
                    type="button"
                    className={`calendar-day${disabled ? ' disabled' : ''}${today ? ' today' : ''}${selected ? ' selected' : ''}`}
                    onClick={() => !disabled && handleDateSelect(date)}
                    disabled={disabled}
                    >
                    {date.getDate()}
                    </button>
                );
                })}
            </div>
            </div>
        )}
        </div>
    );
};

export default Calendar;
