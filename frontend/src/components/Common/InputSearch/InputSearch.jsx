import React, { useState, useRef, useEffect } from 'react';
import './InputSearch.css';
import '../Select/Select.css';


const InputSearch = ({
    mode = 'input',
    options = [],
    value = '',
    onChange,
    placeholder = 'Введите...',
    label,
    name,
    type = 'text',
    required = false,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Закрытие при клике вне
    useEffect(() => {
        const handleClick = (e) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
            setOpen(false);
        }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (option) => {
        onChange({ target: { name, value: option.value } });
        setSearch(option.label);
        setOpen(false);
    };

    return (
        <div className={`custom-select-wrapper${open ? ' open' : ''}`} ref={wrapperRef}>
            {label && <label className="custom-select-label">{label}</label>}

            {/* INPUT / SEARCH */}
            <div
                className={`custom-select${open ? ' active' : ''}`}
                onClick={() => mode === 'select' && setOpen(true)}
            >
                <input
                ref={inputRef}
                className="custom-select-input"
                type={type}
                name={name}
                value={mode === 'select' ? search : value}
                placeholder={placeholder}
                required={required}
                onChange={(e) => {
                    if (mode === 'select') {
                    setSearch(e.target.value);
                    setOpen(true);
                    } else {
                    onChange(e);
                    }
                }}
                onFocus={() => mode === 'select' && setOpen(true)}
                />

                {mode === 'select' && <span className="custom-select-arrow" />}
            </div>

            {/* DROPDOWN */}
            {mode === 'select' && open && (
                <ul className="custom-select-dropdown">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map(option => (
                    <li
                        key={option.value}
                        className="custom-select-option"
                        onClick={() => handleSelect(option)}
                    >
                        {option.label}
                    </li>
                    ))
                ) : (
                    <li className="custom-select-option custom-select-empty">
                    Ничего не найдено
                    </li>
                )}
                </ul>
            )}
        </div>
    );
};

export default InputSearch;