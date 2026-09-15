import React from 'react';
import { Card } from '../ui/Card';
import { formatFCFA } from '../../utils/currency';
import type { ClassSummary } from '../../types';
import { Users, Utensils, Coins, CreditCard, AlertCircle } from 'lucide-react';

interface PointageSummaryProps {
  summary: ClassSummary;
  classNameTitle: string;
}

export const PointageSummary: React.FC<PointageSummaryProps> = ({ summary, classNameTitle }) => {
  return (
    <div className="sticky bottom-16 md:bottom-4 z-10 transition-all">
      <Card className="p-4 bg-slate-900 text-white border-slate-800 shadow-2xl backdrop-blur-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Récapitulatif de la classe : <span className="text-emerald-400">{classNameTitle}</span>
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Taux de service : {summary.totalStudents > 0 ? Math.round((summary.mealsServed / summary.totalStudents) * 100) : 0}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total élèves</span>
            <span className="text-base font-extrabold text-white">{summary.totalStudents}</span>
          </div>

          <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/50">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Repas servis</span>
            <span className="text-base font-extrabold text-emerald-400">{summary.mealsServed}</span>
          </div>

          <div className="p-2 rounded-xl bg-sky-950/60 border border-sky-800/50">
            <span className="text-[10px] uppercase font-bold text-sky-300 block">Payé espèces</span>
            <span className="text-base font-extrabold text-sky-400">{summary.paidCash}</span>
          </div>

          <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-800/50">
            <span className="text-[10px] uppercase font-bold text-indigo-300 block">Sur solde</span>
            <span className="text-base font-extrabold text-indigo-400">{summary.paidPrepaid}</span>
          </div>

          <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800/50">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">À crédit</span>
            <span className="text-base font-extrabold text-amber-400">{summary.paidCredit}</span>
          </div>

          <div className="p-2 rounded-xl bg-teal-950/60 border border-teal-800/50">
            <span className="text-[10px] uppercase font-bold text-teal-300 block">Encaissé cash</span>
            <span className="text-sm sm:text-base font-extrabold text-teal-400">{formatFCFA(summary.totalCollectedCash)}</span>
          </div>

          <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800/50">
            <span className="text-[10px] uppercase font-bold text-rose-300 block">Impayés</span>
            <span className="text-sm sm:text-base font-extrabold text-rose-400">{formatFCFA(summary.totalUnpaidCredit)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
