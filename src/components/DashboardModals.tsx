import React from 'react';
import CaseCloseModal from './CaseCloseModal';
import SecureConfirmationModal from './SecureConfirmationModal';

interface DashboardModalsProps {
    isBatchCloseModalOpen: boolean;
    setIsBatchCloseModalOpen: (isOpen: boolean) => void;
    confirmBatchClose: (options: { createAlbaran: boolean; createProforma: boolean }) => void;
    selectedCasesCount: number;
    isBatchDeleteModalOpen: boolean;
    setIsBatchDeleteModalOpen: (isOpen: boolean) => void;
    confirmBatchDelete: () => void;
    deletePassword?: string;
}

const DashboardModals: React.FC<DashboardModalsProps> = ({
    isBatchCloseModalOpen,
    setIsBatchCloseModalOpen,
    confirmBatchClose,
    selectedCasesCount,
    isBatchDeleteModalOpen,
    setIsBatchDeleteModalOpen,
    confirmBatchDelete,
    deletePassword = '1812'
}) => {
    return (
        <>
            <CaseCloseModal
                isOpen={isBatchCloseModalOpen}
                onClose={() => setIsBatchCloseModalOpen(false)}
                onConfirm={confirmBatchClose}
                selectedCasesCount={selectedCasesCount}
            />
            <SecureConfirmationModal
                isOpen={isBatchDeleteModalOpen}
                title="Eliminado Crítico"
                message={`Esta acción moverá ${selectedCasesCount} registros al Almacén. Requiere validación de seguridad.`}
                onConfirm={confirmBatchDelete}
                onClose={() => setIsBatchDeleteModalOpen(false)}
                requirePassword={true}
                correctPassword={deletePassword}
            />
        </>
    );
};

export default DashboardModals;
