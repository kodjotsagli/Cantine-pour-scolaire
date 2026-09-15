import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { DepositReceiptData } from '../../services/depositService';
import { formatFCFA } from '../../utils/currency';
import { formatDateShort, formatDateTimeFrench } from '../../utils/dates';
import { Printer, CheckCircle2, School } from 'lucide-react';

interface PrintableDepositReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: DepositReceiptData | null;
}

export const PrintableDepositReceipt: React.FC<PrintableDepositReceiptProps> = ({
  isOpen,
  onClose,
  receiptData
}) => {
  if (!receiptData) return null;

  const { deposit, student, previousBalance, newBalance, schoolName } = receiptData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reçu de Dépôt de Cantine">
      <div className="space-y-6">
        {/* The receipt body (which is also styled for print) */}
        <div id="printable-receipt" className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-4 print:border-none print:p-0">
          {/* Header */}
          <div className="text-center border-b border-slate-300 pb-4">
            <div className="inline-flex p-2 bg-emerald-100 text-emerald-800 rounded-xl mb-1">
              <School className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black tracking-tight">{schoolName}</h3>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-0.5">
              Service de Restauration Scolaire
            </p>
            <p className="text-xs font-mono font-bold text-emerald-800 mt-2 bg-emerald-50 inline-block px-3 py-1 rounded-full border border-emerald-200">
              REÇU N° {deposit.reference}
            </p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Date d'opération</span>
              <strong className="text-slate-900">{formatDateShort(deposit.date)}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block font-semibold uppercase">Heure d'enregistrement</span>
              <span className="text-slate-700">{formatDateTimeFrench(deposit.created_at)}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Élève :</span>
              <strong className="text-slate-900">{student.last_name} {student.first_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Parent / Tuteur :</span>
              <strong className="text-slate-800">{student.parent_name || 'Non précisé'}</strong>
            </div>
            {student.parent_phone && (
              <div className="flex justify-between">
                <span className="text-slate-500">Téléphone :</span>
                <span className="text-slate-800">{student.parent_phone}</span>
              </div>
            )}
            {deposit.note && (
              <div className="flex justify-between border-t border-slate-100 pt-1.5">
                <span className="text-slate-500">Motif :</span>
                <span className="text-slate-700 italic">{deposit.note}</span>
              </div>
            )}
          </div>

          {/* Amount Box */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-xs uppercase font-bold text-emerald-800 tracking-wider">
              Montant Encaissé
            </span>
            <p className="text-3xl font-black text-emerald-800 mt-1">
              {formatFCFA(deposit.amount)}
            </p>
          </div>

          {/* Accounting balance progression */}
          <div className="flex justify-between text-xs p-3 rounded-xl bg-white border border-slate-200 font-medium">
            <div>
              <span className="text-slate-400 block">Ancien solde</span>
              <span>{formatFCFA(previousBalance)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">Nouveau solde disponible</span>
              <strong className="text-emerald-700 text-sm font-extrabold">{formatFCFA(newBalance)}</strong>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-dashed border-slate-300 text-center text-[11px] text-slate-500">
            <div>
              <p className="font-semibold">Signature du Parent</p>
              <div className="h-12"></div>
            </div>
            <div>
              <p className="font-semibold">Le Responsable Cantine</p>
              <div className="h-12"></div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
          <Button
            variant="primary"
            icon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
            className="font-bold shadow-md"
          >
            Imprimer le Reçu
          </Button>
        </div>
      </div>
    </Modal>
  );
};
