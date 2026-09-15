import React, { useState, useEffect } from 'react';
import { db } from '../db';
import type { Deposit, Student } from '../types';
import { getDeposits } from '../services/depositService';
import { formatFCFA } from '../utils/currency';
import { formatDateShort, formatDateTimeFrench } from '../utils/dates';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  Wallet, 
  PlusCircle, 
  Search, 
  Printer, 
  Receipt,
  Calendar,
  UserCheck
} from 'lucide-react';
import { DepositFormModal } from '../components/deposits/DepositFormModal';
import { PrintableDepositReceipt } from '../components/print/PrintableDepositReceipt';
import type { DepositReceiptData } from '../services/depositService';

interface DepositsPageProps {
  onOpenNewDepositModal: () => void;
}

export const DepositsPage: React.FC<DepositsPageProps> = () => {
  const [deposits, setDeposits] = useState<(Deposit & { student?: Student })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<DepositReceiptData | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const loadDeposits = async () => {
    const list = await getDeposits(100);
    setDeposits(list);
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  const handleDepositSuccess = (receipt: DepositReceiptData) => {
    loadDeposits();
    setActiveReceipt(receipt);
    setIsReceiptModalOpen(true);
  };

  const handlePrintExisting = async (d: Deposit & { student?: Student }) => {
    if (!d.student) return;
    const settings = await db.settings.toCollection().first();
    const receiptData: DepositReceiptData = {
      deposit: d,
      student: d.student,
      previousBalance: d.student.balance - d.amount,
      newBalance: d.student.balance,
      schoolName: settings?.school_name || 'École Cantine'
    };
    setActiveReceipt(receiptData);
    setIsReceiptModalOpen(true);
  };

  const filtered = deposits.filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const studentName = d.student ? `${d.student.first_name} ${d.student.last_name}`.toLowerCase() : '';
    const ref = (d.reference || '').toLowerCase();
    const note = (d.note || '').toLowerCase();
    return studentName.includes(q) || ref.includes(q) || note.includes(q);
  });

  const totalDepositsSum = deposits.reduce((acc, d) => acc + d.amount, 0);

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-600" />
            Dépôts & Recharges des Parents
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Total cumulé des recharges : <strong>{formatFCFA(totalDepositsSum)}</strong> ({deposits.length} opérations)
          </p>
        </div>

        <Button
          variant="primary"
          icon={<PlusCircle className="w-4 h-4" />}
          onClick={() => setIsDepositModalOpen(true)}
          className="font-bold shadow-md shadow-emerald-700/20"
        >
          Enregistrer un Dépôt
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher un dépôt par nom d'élève, référence ou note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </Card>

      {/* Deposits Table */}
      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Référence</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Élève</th>
                <th className="py-3.5 px-4">Parent / Note</th>
                <th className="py-3.5 px-4 text-right">Montant Encaissé</th>
                <th className="py-3.5 px-4 text-right">Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Aucun dépôt parent trouvé.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-emerald-800 whitespace-nowrap">
                      {d.reference}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {formatDateShort(d.date)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {d.student ? `${d.student.last_name} ${d.student.first_name}` : 'Inconnu'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <span className="font-medium text-slate-800">{d.student?.parent_name || 'Parent'}</span>
                      {d.note && <span className="text-slate-400 block italic text-[11px]">{d.note}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                      +{formatFCFA(d.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Printer className="w-3.5 h-3.5" />}
                        onClick={() => handlePrintExisting(d)}
                        title="Imprimer le reçu"
                      >
                        Reçu
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Deposit Modal */}
      <DepositFormModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onDepositSuccess={handleDepositSuccess}
      />

      {/* Printable Receipt Modal */}
      <PrintableDepositReceipt
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={activeReceipt}
      />
    </div>
  );
};
