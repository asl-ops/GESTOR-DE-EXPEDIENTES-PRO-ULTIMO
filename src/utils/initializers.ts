import { Client, Vehicle, EconomicData, Communication, FileConfig, FileCategory } from '@/types';

export const getInitialClient = (): Client => ({ id: '', nombre: '', surnames: '', firstName: '', nif: '', address: '', city: '', province: '', postalCode: '', phone: '', email: '' });

export const getInitialVehicle = (): Vehicle => ({ vin: '', brand: '', model: '', year: '', engineSize: '', fuelType: '' });

export const getInitialEconomicData = (): EconomicData => ({ lines: [], subtotalAmount: 0, vatAmount: 0, totalAmount: 0 });

export const getInitialCommunicationsData = (userId: string): Communication[] => [{ id: `comm-${Date.now()}`, date: new Date().toISOString().split('T')[0], concept: '', authorUserId: userId }];

export const getInitialFileConfig = (userId: string, category: FileCategory = 'GE-MAT', fileType: string = 'General'): FileConfig => ({
    fileType,
    category,
    responsibleUserId: userId,
    customValues: {}
});

export const getFileNumber = (counter: number) => {
    return `EXP-${String(counter).padStart(4, '0')}`;
};
