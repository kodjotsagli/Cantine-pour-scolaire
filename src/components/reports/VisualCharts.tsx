import React from 'react';
import { Card } from '../ui/Card';
import { formatFCFA } from '../../utils/currency';
import { FinancialSummary, ClassBreakdownItem } from '../../services/reportService';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

interface VisualChartsProps {
  summary: FinancialSummary;
  breakdown: ClassBreakdownItem[];
}

export const VisualCharts: React.FC<VisualChartsProps> = ({ summary, breakdown }) => {
  const totalMeals = summary.totalMeals || 1;
  const totalFinancialFlow = (summary.totalCash + summary.totalPrepaidConsumed + summary.totalCreditGenerated) || 1;

  // Breakdown percentages
  const cashPercent = Math.round((summary.totalCash / totalFinancialFlow) * 100);
  const prepaidPercent = Math.round((summary.totalPrepaidConsumed / totalFinancialFlow) * 100);
  const creditPercent = Math.max(0, 100 - cashPercent - prepaidPercent);

  // Find max meals in classes for scaling
  const maxClassMeals = Math.max(...breakdown.map(b => b.mealsCount), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Payment Methods Distribution */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">
              Répartition des Règlements de Repas
            </h4>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {summary.totalMeals} repas
          </span>
        </div>

        {/* Progress Bar Stack */}
        <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-100 shadow-inner">
          <div
            style={{ width: `${cashPercent}%` }}
            className="bg-sky-500 transition-all duration-500 relative group"
            title={`Espèces: ${cashPercent}% (${formatFCFA(summary.totalCash)})`}
          />
          <div
            style={{ width: `${prepaidPercent}%` }}
            className="bg-emerald-500 transition-all duration-500 relative group"
            title={`Solde: ${prepaidPercent}% (${formatFCFA(summary.totalPrepaidConsumed)})`}
          />
          <div
            style={{ width: `${creditPercent}%` }}
            className="bg-amber-500 transition-all duration-500 relative group"
            title={`Crédit: ${creditPercent}% (${formatFCFA(summary.totalCreditGenerated)})`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 mt-5 text-center">
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-100">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span className="text-[11px] font-bold text-sky-900 uppercase">Espèces</span>
            </div>
            <p className="text-base font-extrabold text-sky-950">{cashPercent}%</p>
            <p className="text-[11px] text-sky-700 font-semibold">{formatFCFA(summary.totalCash)}</p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-bold text-emerald-900 uppercase">Solde</span>
            </div>
            <p className="text-base font-extrabold text-emerald-950">{prepaidPercent}%</p>
            <p className="text-[11px] text-emerald-700 font-semibold">{formatFCFA(summary.totalPrepaidConsumed)}</p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-[11px] font-bold text-amber-900 uppercase">À Crédit</span>
            </div>
            <p className="text-base font-extrabold text-amber-950">{creditPercent}%</p>
            <p className="text-[11px] text-amber-700 font-semibold">{formatFCFA(summary.totalCreditGenerated)}</p>
          </div>
        </div>
      </Card>

      {/* Chart 2: Repas servis par classe */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">
              Fréquentation de la Cantine par Classe
            </h4>
          </div>
        </div>

        <div className="space-y-3">
          {breakdown.map((item) => {
            const widthPercent = Math.round((item.mealsCount / maxClassMeals) * 100);
            return (
              <div key={item.classId} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">{item.className}</span>
                  <span className="text-slate-500 font-bold">
                    {item.mealsCount} repas {item.totalStudents > 0 && `(${item.totalStudents} élèves)`}
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${widthPercent}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
