import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';

interface SmartDatePickerProps {
    value: string; // ISO format YYYY-MM-DD
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    className?: string;
}

const SmartDatePicker: React.FC<SmartDatePickerProps> = ({
    value,
    onChange,
    label,
    placeholder = 'DD MM AAAA',
    className = ''
}) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Sync external value to internal text representation
    useEffect(() => {
        if (value) {
            try {
                const date = new Date(value);
                if (isValid(date)) {
                    setInputValue(format(date, 'dd/MM/yyyy'));
                    setError(null);
                }
            } catch (e) {
                // ignore
            }
        } else if (inputValue === '') {
            setInputValue('');
        }
    }, [value]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawVal = e.target.value;

        // Extract only digits
        const digits = rawVal.replace(/\D/g, '');

        let formatted = '';
        if (digits.length > 0) {
            formatted += digits.substring(0, 2);
            if (digits.length > 2) {
                formatted += '/' + digits.substring(2, 4);
            }
            if (digits.length > 4) {
                formatted += '/' + digits.substring(4, 8);
            }
        }

        setInputValue(formatted);

        // Reset error if length is less than full date
        if (digits.length < 8) {
            setError(null);
        }

        // Validate when we have a full date
        if (digits.length === 8) {
            const day = parseInt(digits.substring(0, 2));
            const month = parseInt(digits.substring(2, 4));
            const year = parseInt(digits.substring(4, 8));

            try {
                const parsedDate = parse(formatted, 'dd/MM/yyyy', new Date());

                // Strict validation: check if parts match to catch things like 31/02
                if (isValid(parsedDate) &&
                    parsedDate.getDate() === day &&
                    (parsedDate.getMonth() + 1) === month &&
                    parsedDate.getFullYear() === year) {

                    setError(null);
                    onChange(format(parsedDate, 'yyyy-MM-dd'));
                } else {
                    setError('Fecha inválida');
                }
            } catch (err) {
                setError('Fecha inválida');
            }
        } else if (digits.length === 0) {
            setError(null);
            onChange('');
        }
    };

    const handleIconClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (dateInputRef.current) {
            if ('showPicker' in dateInputRef.current) {
                (dateInputRef.current as any).showPicker();
            } else {
                (dateInputRef.current as HTMLInputElement).click();
            }
        }
    };

    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value; // YYYY-MM-DD
        if (val) {
            onChange(val);
            setError(null);
        }
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {label && <label className="text-[12px] font-bold text-[#4c739a] uppercase px-1">{label}</label>}
            <div className="relative group">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleTextChange}
                    placeholder={placeholder}
                    className={`w-full bg-slate-50 border ${error ? 'border-rose-500' : 'border-[#cfdbe7]'} rounded-lg h-12 px-3 pl-4 pr-10 text-sm font-normal text-[#0d141b] focus:ring-2 focus:ring-[#1380ec]/20 outline-none transition-all placeholder:text-slate-300`}
                />

                {/* Hidden date input to trigger browser picker */}
                <input
                    type="date"
                    ref={dateInputRef}
                    value={value || ''}
                    onChange={handleDateInputChange}
                    className="absolute inset-0 opacity-0 pointer-events-none -z-10"
                    tabIndex={-1}
                />

                <button
                    type="button"
                    onClick={handleIconClick}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#1380ec] transition-colors focus:outline-none"
                    title="Abrir calendario"
                >
                    <Calendar className="w-5 h-5 pointer-events-none" />
                </button>
            </div>
            {error && <span className="text-[10px] text-rose-500 font-bold px-1 animate-in fade-in slide-in-from-top-1">{error}</span>}
        </div>
    );
};

export default SmartDatePicker;
