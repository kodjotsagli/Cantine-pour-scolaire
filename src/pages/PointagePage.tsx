import React, { useState, useEffect } from 'react';
import { db } from '../db';
import type { Student, ClassRoom, Meal, PaymentMethod, ClassSummary } from '../types';
import { getTodayDateString, formatDateLong } from '../utils/dates';
import { formatFCFA } from '../utils/currency';
import { recordMeal, cancelMeal, getClassSummaryForDate, getMealPrice } from '../services/mealService';
import { PaymentChoiceModal } from '../components/pointage/PaymentChoiceModal';
import { PointageSummary } from '../components/pointage/PointageSummary';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { 
  UtensilsCrossed, 
  Search, 
  Calendar, 
  CheckCircle2, 
  RotateCcw, 
  AlertCircle,
  Clock,
  Sparkles,
  Wallet
} from 'lucide-react';

import { getActiveClasses } from '../services/classService';

interface PointagePageProps {
  onOpenDepositModalForStudent?: (studentId: string) => void;
}

export const PointagePage: React.FC<PointagePageProps> = ({ onOpenDepositModalForStudent }) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [mealsMap, setMealsMap] = useState<Map<string, Meal>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [mealPrice, setMealPrice] = useState<number>(400);

  // Modal state
  const [selectedStudentForMeal, setSelectedStudentForMeal] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Summary state
  const [classSummary, setClassSummary] = useState<ClassSummary>({
    totalStudents: 0,
    mealsServed: 0,
    paidCash: 0,
    paidPrepaid: 0,
    paidCredit: 0,
    totalCollectedCash: 0,
    totalUnpaidCredit: 0
  });

  // Load classes & meal price on mount
  useEffect(() => {
    getActiveClasses().then((cls) => {
      setClasses(cls);
      if (cls.length > 0 && !selectedClassId) {
        setSelectedClassId(cls[0].id);
      }
    });
    getMealPrice().then(setMealPrice);
  }, []);

  // Load students, meals and summary when class or date changes
  const loadClassData = async () => {
    if (!selectedClassId) return;

    // 1. Get active students in class
    const allClassStudents = await db.students
      .where('class_id')
      .equals(selectedClassId)
      .toArray();
    const classStudents = allClassStudents.filter(s => s.active !== false);

    // Sort alphabetically
    classStudents.sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name));
    setStudents(classStudents);

    // 2. Get meals for this date
    const dateMeals = await db.meals.where('date').equals(selectedDate).toArray();
    const map = new Map<string, Meal>();
    for (const m of dateMeals) {
      if (m.status === 'confirmed') {
        map.set(m.student_id, m);
      }
    }
    setMealsMap(map);

    // 3. Get summary
    const summary = await getClassSummaryForDate(selectedDate, selectedClassId);
    setClassSummary(summary);
  };

  useEffect(() => {
    loadClassData();
  }, [selectedDate, selectedClassId]);

  const handleOpenMealModal = (student: Student) => {
    setSelectedStudentForMeal(student);
    setIsModalOpen(true);
    setActionMessage(null);
  };

  const handleConfirmMeal = async (method: PaymentMethod) => {
    if (!selectedStudentForMeal) return;

    const res = await recordMeal(selectedStudentForMeal.id, selectedDate, method);
    setIsModalOpen(false);

    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      await loadClassData();
    } else {
      setActionMessage({ type: 'error', text: res.message });
    }

    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleCancelMeal = async (meal: Meal, studentName: string) => {
    if (confirm(`Confirmez-vous l'annulation du repas de ${studentName} pour le ${selectedDate} ? Le solde ou la dette sera automatiquement régularisé.`)) {
      const res = await cancelMeal(meal.id);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        await loadClassData();
      } else {
        setActionMessage({ type: 'error', text: res.message });
      }
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const filteredStudents = students.filter(s => {
    if (!searchQuery) return true;
    const full = `${s.first_name} ${s.last_name}`.toLowerCase();
    return full.includes(searchQuery.toLowerCase());
  });

  const currentClassName = classes.find(c => c.id === selectedClassId)?.name || 'Classe';

  return (
    <div className="space-y-6 pb-28 animate-fadeIn">
      {/* Title & Filters Card */}
      <Card className="p-5 bg-white border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <UtensilsCrossed className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Pointage Quotidien des Repas</h2>
                <p className="text-xs text-slate-500">
                  Tarif cantine : <strong>{formatFCFA(mealPrice)}</strong> / repas
                </p>
              </div>
            </div>
          </div>

          {/* Date & Class Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date input */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
              />
            </div>

            {/* Class tabs or dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <span className="text-xs font-bold uppercase text-slate-500">Classe :</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-transparent text-sm font-bold text-emerald-800 focus:outline-none"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.level})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Rechercher un élève de la classe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1"
            >
              Effacer
            </button>
          )}
        </div>
      </Card>

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-2 shadow-sm animate-fadeIn ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Students List for Pointage */}
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <Card className="p-12 text-center text-slate-400">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <h4 className="font-bold text-slate-700 text-base">Aucun élève trouvé</h4>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery
                ? 'Aucun élève ne correspond à votre recherche.'
                : 'Cette classe ne compte encore aucun élève actif.'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredStudents.map((student) => {
              const meal = mealsMap.get(student.id);
              const hasMeal = !!meal;

              let methodLabel = 'Espèces';
              let badgeVariant: 'success' | 'warning' | 'danger' | 'info' = 'info';
              if (meal?.payment_method === 'prepaid') {
                methodLabel = 'Solde prépayé';
                badgeVariant = 'success';
              } else if (meal?.payment_method === 'credit') {
                methodLabel = 'À crédit';
                badgeVariant = 'danger';
              }

              return (
                <Card
                  key={student.id}
                  className={`p-4 transition-all duration-150 border ${
                    hasMeal
                      ? 'bg-emerald-50/40 border-emerald-200 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {student.last_name} {student.first_name}
                        </span>
                        {hasMeal && (
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                        )}
                      </div>

                      {/* Balance preview */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">Solde :</span>
                        <span
                          className={`text-xs font-bold ${
                            student.balance > 0
                              ? 'text-emerald-700'
                              : student.balance < 0
                              ? 'text-rose-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {formatFCFA(student.balance)}
                        </span>
                        {student.balance < mealPrice && student.balance >= 0 && (
                          <span className="text-[10px] text-amber-600 font-medium">(Prépayé insuffisant)</span>
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="shrink-0 flex items-center gap-2">
                      {hasMeal ? (
                        <div className="flex items-center gap-2">
                          <div className="text-right hidden sm:block">
                            <Badge variant={badgeVariant}>{methodLabel}</Badge>
                            <p className="text-[10px] text-slate-400 mt-0.5">Repas confirmé</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Annuler ce repas"
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200"
                            onClick={() => handleCancelMeal(meal, `${student.first_name} ${student.last_name}`)}
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            <span className="text-xs">Annuler</span>
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="md"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2"
                          icon={<UtensilsCrossed className="w-4 h-4" />}
                          onClick={() => handleOpenMealModal(student)}
                        >
                          REPAS PRIS
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Class Real-Time Summary at the Bottom */}
      <PointageSummary summary={classSummary} classNameTitle={currentClassName} />

      {/* Payment choice modal */}
      <PaymentChoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        student={selectedStudentForMeal}
        mealPrice={mealPrice}
        onConfirm={handleConfirmMeal}
      />
    </div>
  );
};
