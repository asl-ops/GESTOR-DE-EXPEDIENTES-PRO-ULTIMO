import React, { useEffect } from 'react';
import { EconomicData, EconomicLineItem } from '../types';
import { EconomicLinesEditor } from './EconomicLinesEditor';

interface EconomicDataSectionProps {
    economicData: EconomicData;
    setEconomicData: React.Dispatch<React.SetStateAction<EconomicData>>;
    onOpenRegisterModal?: () => void;
}

const EconomicDataSection: React.FC<EconomicDataSectionProps> = ({ economicData, setEconomicData }) => {

    const handleLinesChange = (newLines: EconomicLineItem[]) => {
        setEconomicData(prev => ({
            ...prev,
            lines: newLines
        }));
    };

    // Keep the effect to update totals in the parent state whenever lines change
    useEffect(() => {
        const subtotal = economicData.lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

        // Calculate VAT base (Logic matches EconomicLinesEditor for consistency)
        const vatBase = economicData.lines
            .filter(line =>
                line.concept.toLowerCase().includes('honorarios') ||
                line.type === 'honorario' ||
                line.concept.toLowerCase().includes('gestión')
            )
            .reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

        const vat = vatBase * 0.21;
        const total = subtotal + vat;

        // Only update if values actually changed to avoid infinite loops if strict equality check fails
        if (
            Math.abs(economicData.subtotalAmount - subtotal) > 0.01 ||
            Math.abs(economicData.vatAmount - vat) > 0.01 ||
            Math.abs(economicData.totalAmount - total) > 0.01
        ) {
            setEconomicData(prev => ({
                ...prev,
                subtotalAmount: subtotal,
                vatAmount: vat,
                totalAmount: total
            }));
        }
    }, [economicData.lines, economicData.subtotalAmount, economicData.vatAmount, economicData.totalAmount, setEconomicData]);

    return (
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden h-full min-h-[400px]">
            <EconomicLinesEditor
                lines={economicData.lines}
                onChange={handleLinesChange}
            />
        </div>
    );
};

export default EconomicDataSection;