import React, { useState, useEffect, useRef } from 'react';

interface CurrencyInputProps {
    value: number;
    onChange: (value: number) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    autoFocus?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
    value,
    onChange,
    className = "",
    placeholder = "0,00",
    disabled = false,
    autoFocus = false
}) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Format helper
    const formatValue = (val: number, focused: boolean) => {
        if (!val && val !== 0) return '';
        if (focused) {
            // Raw numeric representation for editing (no symbol, comma as unit)
            return val.toString().replace('.', ',');
        } else {
            // Formatted for viewing with symbol
            return val.toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) + ' €';
        }
    };

    // Sync with prop value when NOT focused or when value changes externally
    useEffect(() => {
        if (!isFocused) {
            setDisplayValue(value || value === 0 ? formatValue(value, false) : '');
        }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputValue = e.target.value;

        // Normalize: swap dot for comma
        inputValue = inputValue.replace('.', ',');

        // Validate: only numbers and at most one comma
        if (!/^[0-9]*\,?[0-9]*$/.test(inputValue)) {
            return;
        }

        setDisplayValue(inputValue);

        // Notify parent with the numeric conversion
        const numericString = inputValue.replace(',', '.');
        const numericValue = parseFloat(numericString) || 0;
        onChange(numericValue);
    };

    const handleFocus = () => {
        setIsFocused(true);
        // Show raw number for easier editing
        setDisplayValue(value ? value.toString().replace('.', ',') : '');
    };

    const handleBlur = () => {
        setIsFocused(false);
        // Return to formatted view with symbol
        setDisplayValue(value || value === 0 ? formatValue(value, false) : '');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Confirm with Enter
        if (e.key === 'Enter') {
            inputRef.current?.blur();
        }
        // Tab is allowed by default browser behavior
    };

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    return (
        <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className={className}
        />
    );
};
