import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface CompanySettings {
    name: string;
    nif: string;
    address: string;
    city?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
}

const DEFAULT_COMPANY: CompanySettings = {
    name: 'Nombre de la Empresa',
    nif: 'B00000000',
    address: 'Dirección de la empresa',
    city: 'Ciudad',
    postalCode: '00000'
};

export const useCompanySettings = () => {
    const [company, setCompany] = useState<CompanySettings>(DEFAULT_COMPANY);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'company');
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    setCompany({ ...DEFAULT_COMPANY, ...snapshot.data() } as CompanySettings);
                }
            } catch (error) {
                console.error('[CompanySettings] Error fetching:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const updateCompanySettings = useCallback(async (newSettings: Partial<CompanySettings>) => {
        try {
            const docRef = doc(db, 'settings', 'company');
            const merged = { ...company, ...newSettings };
            await setDoc(docRef, merged, { merge: true });
            setCompany(merged);
            return true;
        } catch (error) {
            console.error('[CompanySettings] Error updating:', error);
            return false;
        }
    }, [company]);

    return { company, loading, updateCompanySettings };
};
