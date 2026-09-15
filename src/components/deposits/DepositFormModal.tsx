import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { db } from '../../db';
import type { Student } from '../../types';
import { createDeposit, DepositReceiptData } from '../../services/depositService';
import { formatFCFA } from '../../utils/currency';
import { getTodayDateString } from '../../utils/dates';
import { Wallet, Coins, Receipt } from 'lucide-react';

interface DepositFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStudentId?: string | null;
  onDepositSuccess: (receipt: DepositReceiptData) => void;
}

export const DepositFormModal: React.FC<DepositFormModalProps> = ({
  isOpen,
  onClose,
  preselectedStudentId,
  onDepositSuccess
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [amount, setAmount] = useState<number>(4000);
  const [date, setDate] = useState<string>(getTodayDateString());
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    db.students.toArray().then((allStds) => {
      const stdList = allStds.filter(s => s.active !== false);
      stdList.sort((a, b) => a.last_name.localeCompare(b.last_name));
      setStudents(stdList);

      if (preselectedStudentId) {
        setSelectedStudentId(preselectedStudentId);
      } else if (stdList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(stdList[0].id);
      }
    });
  }, [isOpen, preselectedStudentId]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const handleQuickAmount = (val: number) => {
    setAmount(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Veuillez sélectionner un élève.');
      return;
    }
    if (amount <= 0) {
      setError('Le montant doit être supérieur à 0 FCFA.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const receiptData = await createDeposit(selectedStudentId, amount, date, note);
      onDepositSuccess(receiptData);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'enregistrement du dépôt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enregistrer un Dépôt Parent">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        {/* Student Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Élève bénéficiaire *
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            required
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.last_name} {s.first_name} (Solde : {formatFCFA(s.balance)})
              </option>
            ))}
          </select>
        </div>

        {/* Current Balance & Projection Banner */}
        {selectedStudent && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Solde avant dépôt :</span>
              <strong className={selectedStudent.balance >= 0 ? 'text-emerald-800' : 'text-rose-600'}>
                {formatFCFA(selectedStudent.balance)}
              </strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Nouveau solde après dépôt :</span>
              <strong className="text-emerald-700 text-sm font-black">
                {formatFCFA(selectedStudent.balance + (amount || 0))}
              </strong>
            </div>
          </div>
        )}

        {/* Quick amounts buttons */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Montant du dépôt (FCFA) *
          </label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[2000, 4000, 8000, 10000].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAmount(val)}
                className={`py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  amount === val
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {formatFCFA(val)}
              </button>
            ))}
          </div>

          <Input
            type="number"
            min="100"
            step="100"
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Montant en FCFA"
            required
            icon={<Coins className="w-4 h-4" />}
          />
        </div>

        {/* Date & Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Date de réception"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label="Note ou Référence reçue"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ex: Avance mois de rentrée"
          />
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            icon={<Receipt className="w-4 h-4" />}
          >
            {loading ? 'Traitement...' : 'Enregistrer le dépôt'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
