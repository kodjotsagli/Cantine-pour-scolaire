import React, { useState, useEffect } from 'react';
import { db } from '../db';
import type { ClassRoom } from '../types';
import { 
  FinancialSummary, 
  ClassBreakdownItem, 
  UnpaidStudentItem, 
  ReportPeriod,
  getDateRangeForPeriod,
  getFinancialSummary,
  getClassBreakdown,
  getUnpaidStudents
} from '../services/reportService';
import { exportFinancialReportCsv, exportUnpaidCsv } from '../services/exportService';
import { formatFCFA } from '../utils/currency';
import { formatDateShort } from '../utils/dates';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { VisualCharts } from '../components/reports/VisualCharts';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Printer, 
  Phone, 
  AlertTriangle, 
  GraduationCap, 
  Coins, 
  CreditCard, 
  Wallet,
  Users
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<ReportPeriod>('today');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'financial' | 'classes' | 'unpaid' | 'charts'>('financial');

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [breakdown, setBreakdown] = useState<ClassBreakdownItem[]>([]);
  const [unpaidList, setUnpaidList] = useState<UnpaidStudentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    db.classes.toArray().then(setClasses);
  }, []);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRangeForPeriod(period, customStart, customEnd);
      const classFilter = selectedClassId === 'all' ? undefined : selectedClassId;

      const [sum, bkd, unp] = await Promise.all([
        getFinancialSummary(start, end, classFilter),
        getClassBreakdown(start, end),
        getUnpaidStudents(classFilter)
      ]);

      setSummary(sum);
      setBreakdown(bkd);
      setUnpaidList(unp);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [period, customStart, customEnd, selectedClassId]);

  const handleExportCsv = () => {
    if (!summary) return;
    if (activeTab === 'unpaid') {
      exportUnpaidCsv();
    } else {
      exportFinancialReportCsv(summary.startDate, summary.endDate);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Rapports & Statistiques Cantine
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Analyse opérationnelle, comptabilité analytique et suivi des recouvrements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportCsv}
          >
            Exporter CSV Excel
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Imprimer
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Period quick filters */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(
              [
                { id: 'today', label: "Aujourd'hui" },
                { id: 'yesterday', label: 'Hier' },
                { id: 'this_week', label: 'Cette Semaine' },
                { id: 'this_month', label: 'Ce Mois' },
                { id: 'custom', label: 'Personnalisé' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p.id
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date range picker if custom selected */}
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 font-medium"
              />
              <span className="text-xs text-slate-400">au</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 font-medium"
              />
            </div>
          )}

          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-slate-400">Classe :</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Toutes les classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('financial')}
          className={`py-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'financial'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Rapport Financier
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`py-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'classes'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Répartition par Classe
        </button>
        <button
          onClick={() => setActiveTab('unpaid')}
          className={`py-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'unpaid'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Suivi des Impayés</span>
          {unpaidList.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
              {unpaidList.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`py-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'charts'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Graphiques Visuels
        </button>
      </div>

      {/* Tab 1: Financial Report */}
      {activeTab === 'financial' && summary && (
        <div className="space-y-6">
          {/* Main indicators grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-5 border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase">Repas servis</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{summary.totalMeals}</p>
              <p className="text-xs text-slate-500 mt-1">Période : {summary.periodLabel}</p>
            </Card>

            <Card className="p-5 border-sky-200 bg-sky-50/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-800 uppercase">Recette Espèces (Repas)</span>
                <Badge variant="info">Encaissé</Badge>
              </div>
              <p className="text-3xl font-extrabold text-sky-900 mt-1">{formatFCFA(summary.totalCash)}</p>
              <p className="text-xs text-sky-700 mt-1">Repas réglés au comptant</p>
            </Card>

            <Card className="p-5 border-emerald-200 bg-emerald-50/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 uppercase">Dépôts Reçus (Avances)</span>
                <Badge variant="success">Recharge</Badge>
              </div>
              <p className="text-3xl font-extrabold text-emerald-900 mt-1">{formatFCFA(summary.totalDeposits)}</p>
              <p className="text-xs text-emerald-700 mt-1">Argent avancé par les parents</p>
            </Card>

            <Card className="p-5 border-indigo-200 bg-indigo-50/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-800 uppercase">Consommé sur Solde</span>
                <Badge variant="neutral">Solde Déduit</Badge>
              </div>
              <p className="text-3xl font-extrabold text-indigo-900 mt-1">{formatFCFA(summary.totalPrepaidConsumed)}</p>
              <p className="text-xs text-indigo-700 mt-1">Consommation du crédit prépayé</p>
            </Card>

            <Card className="p-5 border-amber-200 bg-amber-50/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 uppercase">Crédits Accordés</span>
                <Badge variant="warning">Dette Période</Badge>
              </div>
              <p className="text-3xl font-extrabold text-amber-900 mt-1">{formatFCFA(summary.totalCreditGenerated)}</p>
              <p className="text-xs text-amber-700 mt-1">Repas servis sans paiement</p>
            </Card>

            <Card className="p-5 border-rose-200 bg-rose-50/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-800 uppercase">Total Impayés Global</span>
                <Badge variant="danger">À Recouvrer</Badge>
              </div>
              <p className="text-3xl font-extrabold text-rose-700 mt-1">{formatFCFA(summary.totalCurrentUnpaid)}</p>
              <p className="text-xs text-rose-600 mt-1">Dette cumulée totale des élèves</p>
            </Card>
          </div>

          {/* Cash In Hand Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div>
              <p className="text-xs uppercase font-bold text-emerald-200 tracking-wider">
                Total Espèces Physiques Encaissées
              </p>
              <h3 className="text-3xl font-black mt-1">{formatFCFA(summary.cashInHandToday)}</h3>
              <p className="text-xs text-emerald-100 mt-1">
                = Espèces des repas ({formatFCFA(summary.totalCash)}) + Dépôts reçus ({formatFCFA(summary.totalDeposits)})
              </p>
            </div>
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExportCsv}
            >
              Télécharger Rapport Excel
            </Button>
          </div>
        </div>
      )}

      {/* Tab 2: Class Breakdown */}
      {activeTab === 'classes' && (
        <Card className="overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Classe</th>
                  <th className="py-3.5 px-4 text-center">Effectif</th>
                  <th className="py-3.5 px-4 text-center">Repas Servis</th>
                  <th className="py-3.5 px-4 text-right">Espèces</th>
                  <th className="py-3.5 px-4 text-right">Solde Prépayé</th>
                  <th className="py-3.5 px-4 text-right">À Crédit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {breakdown.map((row) => (
                  <tr key={row.classId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {row.className} <span className="text-xs text-slate-400 font-normal">({row.level})</span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 font-semibold">
                      {row.totalStudents}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                      {row.mealsCount}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-800 font-semibold">
                      {formatFCFA(row.cashAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-800 font-semibold">
                      {formatFCFA(row.prepaidAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      {formatFCFA(row.creditAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Unpaid Debts Follow-up */}
      {activeTab === 'unpaid' && (
        <div className="space-y-4">
          <Card className="overflow-hidden border-slate-200">
            <div className="p-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <div>
                  <h4 className="font-bold text-rose-950 text-sm">
                    {unpaidList.length} élève(s) avec solde débiteur (impayés)
                  </h4>
                  <p className="text-xs text-rose-700">
                    Montant total à recouvrer auprès des parents :{' '}
                    <strong>
                      {formatFCFA(unpaidList.reduce((acc, u) => acc + u.debtAmount, 0))}
                    </strong>
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-rose-200 text-rose-700 hover:bg-rose-50"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={exportUnpaidCsv}
              >
                Exporter liste impayés
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Élève</th>
                    <th className="py-3.5 px-4">Classe</th>
                    <th className="py-3.5 px-4 text-right">Montant Dû</th>
                    <th className="py-3.5 px-4 text-center">Repas Impayés</th>
                    <th className="py-3.5 px-4">Parent / Tuteur</th>
                    <th className="py-3.5 px-4 text-right">Contact Téléphone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unpaidList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <p className="text-sm font-semibold text-emerald-700">
                          Excellente nouvelle : aucun élève n'a de repas impayé !
                        </p>
                      </td>
                    </tr>
                  ) : (
                    unpaidList.map((u) => (
                      <tr key={u.studentId} className="hover:bg-rose-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {u.lastName} {u.firstName}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="neutral">{u.className}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-rose-600">
                          {formatFCFA(u.debtAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                          {u.unpaidMealsCount}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                          {u.parentName}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {u.parentPhone && u.parentPhone !== 'Non renseigné' ? (
                            <a
                              href={`tel:${u.parentPhone}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              {u.parentPhone}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">Non renseigné</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Visual Charts */}
      {activeTab === 'charts' && summary && (
        <VisualCharts summary={summary} breakdown={breakdown} />
      )}
    </div>
  );
};
