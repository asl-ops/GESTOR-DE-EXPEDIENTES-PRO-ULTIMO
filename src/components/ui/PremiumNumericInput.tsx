import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface PremiumNumericInputProps {
    value: number;
    onChange: (value: number) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    autoFocus?: boolean;
    textAlign?: 'left' | 'center' | 'right';
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    blankWhenZero?: boolean;
}

export const PremiumNumericInput = forwardRef<HTMLInputElement, PremiumNumericInputProps>(({
    value,
    onChange,
    className = "",
    placeholder = "0,00",
    disabled = false,
    readOnly = false,
    textAlign = 'left',
    onKeyDown,
    blankWhenZero = false
}, ref) => {
    const [displayValue, setDisplayValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Expose the internal input to the parent ref
    useImperativeHandle(ref, () => inputRef.current!);

    // Formatear valor numérico a estilo español (1.234,56)
    const formatValue = (val: number | null | undefined): string => {
        if (val === null || val === undefined || isNaN(val)) return '';
        if (val === 0) return blankWhenZero ? '' : '0';

        // Usamos Intl.NumberFormat para el formateo estándar español
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(val);
    };

    // Sincronizar valor interno con prop externo (solo si no es el mismo valor numérico)
    useEffect(() => {
        const currentNumericValue = parseValue(displayValue);
        if (currentNumericValue !== value) {
            setDisplayValue(formatValue(value));
        }
    }, [value, blankWhenZero]);

    // Convertir string español a número puro
    const parseValue = (str: string): number => {
        if (!str) return 0;
        // Eliminar puntos de miles y cambiar coma por punto decimal
        const cleanStr = str.replace(/\./g, '').replace(',', '.');
        return parseFloat(cleanStr) || 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        const start = e.target.selectionStart || 0;
        const lastChar = val.substring(start - 1, start);

        // Si el usuario borra todo, dejarlo vacío
        if (val === '') {
            setDisplayValue('');
            onChange(0);
            return;
        }

        // Si el usuario teclea un punto, lo tratamos como coma (decimal)
        // ya que los puntos de miles los ponemos nosotros automáticamente.
        if (lastChar === '.') {
            val = val.substring(0, start - 1) + ',' + val.substring(start);
        }

        // Limpiar todos los puntos (que ahora solo pueden ser separadores de miles antiguos)
        val = val.replace(/\./g, '');

        // Permitir solo números y una única coma
        val = val.replace(/[^\d,]/g, '');

        // Asegurar solo una coma (la primera)
        const parts = val.split(',');
        if (parts.length > 2) {
            val = parts[0] + ',' + parts.slice(1).join('');
        }

        // Limitar a 2 decimales
        if (parts[1] && parts[1].length > 2) {
            val = parts[0] + ',' + parts[1].substring(0, 2);
        }

        const integerPart = parts[0];
        const decimalPart = parts.length > 1 ? ',' + parts[1] : (val.endsWith(',') ? ',' : '');

        let formattedInteger = '';
        if (integerPart) {
            // Eliminar ceros a la izquierda
            const normalizedInteger = integerPart.length > 1 && integerPart.startsWith('0') && !integerPart.startsWith('0,')
                ? parseInt(integerPart, 10).toString()
                : integerPart;

            const num = parseInt(normalizedInteger, 10);
            if (!isNaN(num)) {
                formattedInteger = new Intl.NumberFormat('es-ES').format(num);
            } else {
                formattedInteger = normalizedInteger;
            }
        } else if (val.startsWith(',')) {
            formattedInteger = '0';
        }

        const finalDisplay = formattedInteger + decimalPart;
        setDisplayValue(finalDisplay);

        // Notificar al padre
        const numericValue = parseValue(finalDisplay);
        onChange(numericValue);
    };

    const handleBlur = () => {
        // Al salir, asegurar formato con 2 decimales si hay valor
        if (value !== 0) {
            setDisplayValue(new Intl.NumberFormat('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value));
        } else {
            setDisplayValue(blankWhenZero ? '' : '0');
        }
    };

    const handleFocus = (_e: React.FocusEvent<HTMLInputElement>) => {
        // Al entrar, si es 0, borrar para facilitar escritura
        if (value === 0) {
            setDisplayValue('');
        }
    };

    return (
        <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={onKeyDown}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={placeholder}
            className={`bg-transparent border-none focus:ring-0 p-0 outline-none ${className}`}
            style={{ textAlign }}
        />
    );
});

PremiumNumericInput.displayName = 'PremiumNumericInput';
