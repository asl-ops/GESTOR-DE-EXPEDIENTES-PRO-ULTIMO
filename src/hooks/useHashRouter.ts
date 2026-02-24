import { useState, useEffect, useMemo } from 'react';
import { FileCategory } from '@/types';

export const useHashRouter = () => {
    const [locationHash, setLocationHash] = useState(window.location.hash);

    useEffect(() => {
        const handleHashChange = () => setLocationHash(window.location.hash);
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const { currentView, fileNumberParam, newCaseCategory, duplicateOf } = useMemo(() => {
        const hash = locationHash.startsWith('#/') ? locationHash.substring(1) : '/';
        const pathPart = hash.split('?')[0];
        const parts = pathPart.split('/').filter(Boolean);
        const view = parts[0] || 'dashboard';

        const params = new URLSearchParams(locationHash.split('?')[1] || '');
        const category = params.get('category') as FileCategory | null;
        const duplicate = params.get('duplicateOf');

        if (view === 'detail' && parts[1]) {
            return { currentView: 'detail' as const, fileNumberParam: parts[1], newCaseCategory: category, duplicateOf: duplicate };
        }
        return { currentView: view as any, fileNumberParam: null, newCaseCategory: category, duplicateOf: duplicate };
    }, [locationHash]);

    const navigateTo = (path: string) => {
        window.location.hash = path;
    };

    return {
        currentView,
        fileNumberParam,
        newCaseCategory,
        duplicateOf,
        navigateTo
    };
};
