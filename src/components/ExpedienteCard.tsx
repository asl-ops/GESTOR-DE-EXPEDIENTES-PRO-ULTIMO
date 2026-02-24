import React from 'react';
import { CaseRecord, getCaseStatusBadgeColor } from '../types';
import { UserIcon, CarIcon } from './icons';
import { FolderOpen, Copy, Trash2 } from 'lucide-react';
import { getStatusColorClasses } from '../utils/statusColors';
import { Button } from './ui/Button';

interface ExpedienteCardProps {
  caseRecord: CaseRecord;
  onSelectCase: (caseRecord: CaseRecord) => void;
  onDelete: (fileNumber: string) => void;
  onDuplicate?: (caseRecord: CaseRecord) => void;
}

const ExpedienteCard: React.FC<ExpedienteCardProps> = ({
  caseRecord,
  onSelectCase,
  onDelete,
  onDuplicate
}) => {
  const { fileNumber, client, vehicle, status, fileConfig } = caseRecord;

  return (
    <div className={`relative bg-white rounded-xl shadow-md p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl ${getStatusColorClasses(status)}`}>
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg text-sky-600 font-mono">{fileNumber}</h3>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getCaseStatusBadgeColor(status)}`}>
          {status}
        </span>
      </div>

      <p className="text-sm text-slate-600 mb-4">{fileConfig.fileType}</p>

      <div className="space-y-3 text-sm">
        <div className="flex items-start space-x-3">
          <UserIcon />
          <div>
            <p className="font-semibold text-slate-800">
              {caseRecord.clientSnapshot?.nombre ||
                client.nombre ||
                `${client.surnames || ''}${client.firstName ? `, ${client.firstName}` : ''}`.trim() ||
                'Sin Titular'}
            </p>
            <p className="text-slate-500">
              {caseRecord.clientSnapshot?.documento || client.nif || '—'}
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <CarIcon />
          <div>
            <p className="font-semibold text-slate-800">{vehicle.brand} {vehicle.model}</p>
            <p className="text-slate-500 font-mono">{vehicle.vin}</p>
          </div>
        </div>
      </div>

      {/* Action Icons - Simplif icados */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Abrir expediente (unifica Ver y Editar) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSelectCase(caseRecord)}
              disabled={status === 'Cerrado'}
              title={status === 'Cerrado' ? 'Expediente cerrado: reabrir para editar' : 'Abrir expediente'}
              className="text-sky-600 hover:bg-sky-50"
              icon={FolderOpen}
            />

            {/* Duplicar expediente */}
            {onDuplicate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(caseRecord);
                }}
                title="Duplicar expediente"
                className="text-blue-600 hover:bg-blue-50"
                icon={Copy}
              />
            )}
          </div>

          {/* Eliminar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(fileNumber);
            }}
            title="Eliminar expediente"
            className="text-red-600 hover:bg-red-50"
            icon={Trash2}
          />
        </div>
      </div>
    </div>
  );
};

export default ExpedienteCard;