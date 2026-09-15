import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatFCFA } from '../../utils/currency';
import type { Student, PaymentMethod } from '../../types';
import { Wallet, Coins, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PaymentChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  mealPrice: number;
  onConfirm: (method: PaymentMethod) => void;
}

export const PaymentChoiceModal: React.FC<PaymentChoiceModalProps> = ({
  isOpen,
  onClose,
  student,
  mealPrice,
  onConfirm
}) => {
  if (!student) return null;

  const canUsePrepaid = student.balance >= mealPrice;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enregistrer le repas">
      <div className="space-y-5">
        {/* Student summary banner */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-base">{student.first_name} {student.last_name}</h4>
            <p className="text-xs text-slate-500">Repas de la cantine ({formatFCFA(mealPrice)})</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">Solde actuel</span>
            <span className={`text-base font-extrabold ${student.balance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatFCFA(student.balance)}
            </span>
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Choisissez le mode de règlement :
        </p>

        {/* 3 Payment Options */}
        <div className="space-y-3">
          {/* Option 1: Prepaid Balance */}
          <div
            onClick={() => canUsePrepaid && onConfirm('prepaid')}
            className={`p-4 rounded-2xl border transition-all ${
              canUsePrepaid
                ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer shadow-sm'
                : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${canUsePrepaid ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    Option 1 — Solde prépayé
                    {canUsePrepaid && <Badge variant="success">Recommandé</Badge>}
                  </h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Déduire {formatFCFA(mealPrice)} du compte de l'élève.
                  </p>
                  {canUsePrepaid ? (
                    <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                      Nouveau solde après repas : {formatFCFA(student.balance - mealPrice)}
                    </p>
                  ) : (
                    <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Solde insuffisant pour utiliser le paiement prépayé.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Cash Today */}
          <div
            onClick={() => onConfirm('cash')}
            className="p-4 rounded-2xl border border-sky-200 bg-sky-50/40 hover:bg-sky-50 hover:border-sky-400 cursor-pointer transition-all shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-sky-600 text-white">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-slate-800">
                  Option 2 — Payé aujourd'hui (Espèces)
                </h5>
                <p className="text-xs text-slate-600 mt-0.5">
                  L'élève paie {formatFCFA(mealPrice)} en espèces comptant.
                </p>
                <p className="text-[11px] font-medium text-sky-700 mt-1">
                  Encaissé directement dans la caisse du jour.
                </p>
              </div>
            </div>
          </div>

          {/* Option 3: Credit / Debt */}
          <div
            onClick={() => onConfirm('credit')}
            className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-400 cursor-pointer transition-all shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-600 text-white">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-slate-800">
                  Option 3 — À crédit (Dette)
                </h5>
                <p className="text-xs text-slate-600 mt-0.5">
                  Repas accordé sans paiement immédiat.
                </p>
                <p className="text-[11px] font-semibold text-amber-800 mt-1">
                  Enregistre une dette de {formatFCFA(mealPrice)} au compte de l'élève.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </Modal>
  );
};
