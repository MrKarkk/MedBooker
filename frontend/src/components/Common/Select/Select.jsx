import React, { useState, useRef, useEffect } from 'react';
import './Select.css';

const Select = ({ options = [], value, onChange, placeholder = 'Выберите...', label, name, required }) => {
    const [open, setOpen] = useState(false);
    const selectRef = useRef(null);
    const buttonRef = useRef(null);
    const openTimeoutRef = useRef(null);

    // Закрытие при клике вне
    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
        if (selectRef.current && !selectRef.current.contains(e.target)) {
            setOpen(false);
        }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    // Очистка таймаута при размонтировании
    useEffect(() => {
        return () => {
        if (openTimeoutRef.current) {
            clearTimeout(openTimeoutRef.current);
        }
        };
    }, []);

    // Плавное открытие по клику
    const handleToggle = (e) => {
        e.preventDefault();
        if (!open) {
        // Плавное открытие с небольшой задержкой
        openTimeoutRef.current = setTimeout(() => {
            setOpen(true);
        }, 80);
        } else {
        setOpen(false);
        }
    };

    // Выбор опции
    const handleSelect = (option) => {
        onChange({ target: { name, value: option.value } });
        setOpen(false);
    };

    // Клавиатурная навигация
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen((prev) => !prev);
        } else if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
        } else if (e.key === 'ArrowDown' && !open) {
        e.preventDefault();
        setOpen(true);
        }
    };

    const selected = options.find((opt) => opt.value === value);

    return (
        <div className={`custom-select-wrapper${open ? ' open' : ''}`} ref={selectRef}>
            {label && <label className="custom-select-label">{label}</label>}
            <button
                type="button"
                className={`custom-select${open ? ' active' : ''}`}
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                ref={buttonRef}
                tabIndex={0}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={label || placeholder}
                required={required}
            >
                <span className={`custom-select-value${!selected ? ' placeholder' : ''}`}>
                {selected ? selected.label : placeholder}
                </span>
                <span className="custom-select-arrow" />
            </button>
            {open && options.length > 0 && (
                <ul className="custom-select-dropdown" role="listbox">
                {options.map((option) => (
                    <li
                    key={option.value}
                    className={`custom-select-option${option.value === value ? ' selected' : ''}`}
                    onClick={() => handleSelect(option)}
                    role="option"
                    aria-selected={option.value === value}
                    tabIndex={-1}
                    >
                    {option.label}
                    </li>
                ))}
                </ul>
            )}
            {open && options.length === 0 && (
                <ul className="custom-select-dropdown" role="listbox">
                <li className="custom-select-option custom-select-empty">
                    Нет доступных опций
                </li>
                </ul>
            )}
        </div>
    );
};

export default Select;
