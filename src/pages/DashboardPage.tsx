import React, { useEffect, useState } from 'react';
import { 
  UtensilsCrossed, 
  Coins, 
  CreditCard, 
  AlertTriangle, 
  Wallet, 
  PlusCircle, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp, 
  Clock,
  Sparkles,
  School
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatFCFA } from '../utils/currency';
import { getTodayDateString, formatDateLong, formatDateTimeFrench } from '../utils/dates';
import { getFinancialSummary, FinancialSummary } from '../services/reportService';
import { db } from '../db';
import { useAuth } from '../hooks/useAuth';
import type { Meal, Deposit, Student } from '../types';
import type { NavItem } from '../components/layout/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavItem) => void;
  onOpenNewStudentModal: () => void;
  onOpenDepositModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenNewStudentModal,
  onOpenDepositModal
}) => {
  const { schoolName } = useAuth();
  const today = getTodayDateString();
  const [stats, setStats] = useState<FinancialSummary | null>(null);
  const [totalStudentsCount, setTotalStudentsCount] = useState<number>(0);
  const [recentMeals, setRecentMeals] = useState<(Meal & { studentName?: string })[]>([]);
  const [recentDeposits, setRecentDeposits] = useState<(Deposit & { studentName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const summary = await getFinancialSummary(today, today);
      setStats(summary);

      const count = await db.students.count();
      setTotalStudentsCount(count);

      // Recent 5 meals today
      const meals = await db.meals
        .where('date')
        .equals(today)
        .reverse()
        .limit(6)
        .toArray();

      const students = await db.students.toArray();
      const studentMap = new Map(students.map(s => [s.id, `${s.first_name} ${s.last_name}`]));

      setRecentMeals(meals.map(m => ({
        ...m,
        studentName: studentMap.get(m.student_id) || 'Élève'
      })));

      // Recent 4 deposits
      const deposits = await db.deposits
        .reverse()
        .limit(4)
        .toArray();

      setRecentDeposits(deposits.map(d => ({
        ...d,
        studentName: studentMap.get(d.student_id) || 'Élève'
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Listen to sync and school switch changes
    window.addEventListener('sync-queue-updated', loadData);
    window.addEventListener('school-changed', loadData);
    return () => {
      window.removeEventListener('sync-queue-updated', loadData);
      window.removeEventListener('school-changed', loadData);
    };
  }, [today]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Welcome & Date Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-xl shadow-emerald-950/20">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-md mb-2">
            <School className="w-3.5 h-3.5 text-emerald-300" /> Cantine en direct • {schoolName || 'Établissement'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Tableau de Bord — {schoolName || 'Cantine Scolaire'}
          </h2>
          <p className="text-emerald-100 text-sm mt-1 capitalize">
            {formatDateLong(today)}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            className="bg-white text-emerald-900 hover:bg-emerald-50 shadow-none font-bold"
            icon={<UtensilsCrossed className="w-4 h-4 text-emerald-700" />}
            onClick={() => onNavigate('pointage')}
          >
            Pointage du Jour
          </Button>
          <Button
            variant="outline"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            icon={<Wallet className="w-4 h-4 text-emerald-200" />}
            onClick={onOpenDepositModal}
          >
            + Dépôt
          </Button>
          <Button
            variant="outline"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            icon={<PlusCircle className="w-4 h-4 text-emerald-200" />}
            onClick={onOpenNewStudentModal}
          >
            + Élève
          </Button>
        </div>
      </div>

      {/* New School Welcome Banner if 0 students */}
      {totalStudentsCount === 0 && !loading && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Nouveau
              </span>
              <h3 className="font-bold text-emerald-950 text-base sm:text-lg flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Bienvenue dans l'espace de gestion de « {schoolName} » !
              </h3>
            </div>
            <p className="text-emerald-800 text-sm max-w-2xl">
              Votre établissement est prêt avec ses 8 classes officielles (Section 1 à CM2). Pour lancer le service de cantine, commencez dès maintenant à inscrire vos élèves.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 justify-center shrink-0">
            <Button
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-700/20"
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={onOpenNewStudentModal}
            >
              Inscrire le 1er Élève
            </Button>
            <Button
              variant="outline"
              className="bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-semibold"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => onNavigate('classes')}
            >
              Voir les Classes (8)
            </Button>
          </div>
        </div>
      )}

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Recettes du Jour"
          value={formatFCFA(stats?.cashInHandToday || 0)}
          subtitle={`${formatFCFA(stats?.totalCash || 0)} espèces + ${formatFCFA(stats?.totalDeposits || 0)} dépôts`}
          icon={<Coins className="w-6 h-6" />}
          variant="emerald"
          onClick={() => onNavigate('reports')}
        />
        <StatCard
          title="Repas Servis Aujourd'hui"
          value={stats?.totalMeals || 0}
          subtitle="Total repas consommés"
          icon={<UtensilsCrossed className="w-6 h-6" />}
          variant="sky"
          onClick={() => onNavigate('pointage')}
        />
        <StatCard
          title="Repas sur Solde Prépayé"
          value={formatFCFA(stats?.totalPrepaidConsumed || 0)}
          subtitle="Déduit des comptes parents"
          icon={<CreditCard className="w-6 h-6" />}
          variant="indigo"
          onClick={() => onNavigate('reports')}
        />
        <StatCard
          title="Impayés / Crédits du Jour"
          value={formatFCFA(stats?.totalCreditGenerated || 0)}
          subtitle={`Dette cumulée totale: ${formatFCFA(stats?.totalCurrentUnpaid || 0)}`}
          icon={<AlertTriangle className="w-6 h-6" />}
          variant={stats?.totalCreditGenerated ? 'rose' : 'amber'}
          onClick={() => onNavigate('reports')}
        />
      </div>

      {/* Operation Breakdown details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Financial Breakdown */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Ventilation Financière du Jour</h3>
              <p className="text-xs text-slate-500">Règles comptables strictes - Distinction des flux</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Voir détails <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Espèces du Jour</span>
                <Badge variant="success">Encaissé</Badge>
              </div>
              <p className="text-xl font-extrabold text-slate-900">{formatFCFA(stats?.totalCash || 0)}</p>
              <p className="text-xs text-slate-500 mt-1">Repas payés au comptant aujourd'hui</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Dépôts Reçus</span>
                <Badge variant="info">Recharge</Badge>
              </div>
              <p className="text-xl font-extrabold text-slate-900">{formatFCFA(stats?.totalDeposits || 0)}</p>
              <p className="text-xs text-slate-500 mt-1">Avances et recharges données par les parents</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Repas sur Solde</span>
                <Badge variant="neutral">Consommation</Badge>
              </div>
              <p className="text-xl font-extrabold text-slate-900">{formatFCFA(stats?.totalPrepaidConsumed || 0)}</p>
              <p className="text-xs text-slate-500 mt-1">Valeur déduite des crédits prépayés</p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">À Crédit (Aujourd'hui)</span>
                <Badge variant="danger">À Recouvrer</Badge>
              </div>
              <p className="text-xl font-extrabold text-rose-700">{formatFCFA(stats?.totalCreditGenerated || 0)}</p>
              <p className="text-xs text-rose-600 mt-1">Repas accordés sous forme de dette</p>
            </div>
          </div>

          <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                FCFA
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-900 uppercase">Caisse Physique du Jour</p>
                <p className="text-xs text-emerald-700">Espèces des repas + Dépôts en espèces reçus</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-900">{formatFCFA(stats?.cashInHandToday || 0)}</span>
            </div>
          </div>
        </Card>

        {/* Right 1 Col: Recent Pointage Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Derniers Repas Pointés
            </h3>
            <button
              onClick={() => onNavigate('pointage')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Voir tout
            </button>
          </div>

          {recentMeals.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Aucun repas pointé pour l'instant aujourd'hui.</p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => onNavigate('pointage')}
              >
                Commencer le pointage
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentMeals.map((meal) => {
                let badgeVariant: 'success' | 'warning' | 'info' | 'danger' = 'info';
                let methodLabel = 'Espèces';
                if (meal.payment_method === 'prepaid') {
                  badgeVariant = 'success';
                  methodLabel = 'Solde prépayé';
                } else if (meal.payment_method === 'credit') {
                  badgeVariant = 'danger';
                  methodLabel = 'À crédit';
                }

                return (
                  <div
                    key={meal.id}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-800 truncate">{meal.studentName}</p>
                      <p className="text-[11px] text-slate-400">{formatDateTimeFrench(meal.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant={badgeVariant}>{methodLabel}</Badge>
                      <p className="font-bold text-slate-700 mt-0.5">{formatFCFA(meal.amount)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {recentDeposits.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Derniers Dépôts Parents</h4>
              <div className="space-y-2">
                {recentDeposits.map((dep) => (
                  <div key={dep.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-50/40 border border-emerald-100">
                    <span className="font-medium text-slate-800 truncate">{dep.studentName}</span>
                    <span className="font-extrabold text-emerald-700 shrink-0">+{formatFCFA(dep.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
