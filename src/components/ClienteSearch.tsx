import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, XMarkIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';
import { Client } from '../types';

interface ClienteSearchProps {
    searchQuery: string;
    setSearchQuery: (value: string) => void;
}

const ClienteSearch: React.FC<ClienteSearchProps> = ({ searchQuery, setSearchQuery }) => {
    const { savedClients } = useAppContext();
    const [suggestions, setSuggestions] = useState<Client[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedClientName, setSelectedClientName] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (searchQuery.length > 0) {
            const filtered = savedClients.filter((c) =>
                `${c.surnames} ${c.firstName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.nif || '').toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSuggestions(filtered.slice(0, 5));
            setShowSuggestions(filtered.length > 0);

            // Find if the search query matches a client's NIF exactly
            const matchedClient = savedClients.find(c => (c.nif || '').toLowerCase() === searchQuery.toLowerCase());
            if (matchedClient) {
                setSelectedClientName(`${matchedClient.surnames}, ${matchedClient.firstName}`);
            } else {
                setSelectedClientName('');
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
            setSelectedClientName('');
        }
    }, [searchQuery, savedClients]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectClient = (client: Client) => {
        // Set the DNI/CIF/NIE instead of the full name for clearer filtering
        setSearchQuery(client.nif || '');
        setSelectedClientName(`${client.surnames}, ${client.firstName}`);
        setShowSuggestions(false);
    };

    return (
        <div ref={wrapperRef} className="grid grid-cols-2 gap-2">
            {/* DNI/CIF/NIE Field */}
            <div className="relative">
                <div className="flex items-center bg-white border border-slate-300 rounded px-2">
                    <SearchIcon className="w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="DNI/NIE/CIF…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        className="ml-2 py-1 outline-none text-sm w-full"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedClientName('');
                            }}
                            className="ml-1 text-slate-400 hover:text-slate-600"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute top-full left-0 mt-1 bg-white border border-slate-300 rounded shadow-lg z-10 w-full max-h-48 overflow-y-auto">
                        {suggestions.map((c) => (
                            <li
                                key={c.id}
                                className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer border-b last:border-b-0"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectClient(c);
                                }}
                            >
                                <div className="font-medium text-sky-700">{c.nif}</div>
                                <div className="text-xs text-slate-600">{c.surnames}, {c.firstName}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Client Name Display (Read-only) */}
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded px-3 py-1">
                <span className="text-sm text-slate-700 truncate" title={selectedClientName}>
                    {selectedClientName || 'Nombre del cliente'}
                </span>
            </div>
        </div>
    );
};

export default ClienteSearch;
