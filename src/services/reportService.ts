import { db } from '../db';
import type { Meal, Deposit, Student, ClassRoom } from '../types';
import { getTodayDateString, getYesterdayString, getStartOfWeek, getStartOfMonth } from '../utils/dates';

export type ReportPeriod = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom';

export interface FinancialSummary {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalMeals: number;
  totalCash: number; // Cash from meals
  totalPrepaidConsumed: number; // Deducted from prepaid balances
  totalCreditGenerated: number; // Consumed on credit
  totalDeposits: number; // Cash from parent recharges
  totalCurrentUnpaid: number; // Sum of negative balances
  cashInHandToday: number; // totalCash + totalDeposits (physical cash received)
}

export interface ClassBreakdownItem {
  classId: string;
  className: string;
  level: string;
  mealsCount: number;
  cashAmount: number;
  prepaidAmount: number;
  creditAmount: number;
  totalStudents: number;
}

export interface UnpaidStudentItem {
  studentId: string;
  firstName: string;
  lastName: string;
  className: string;
  debtAmount: number; // positive number representing what they owe
  unpaidMealsCount: number;
  parentName: string;
  parentPhone: string;
}

export function getDateRangeForPeriod(period: ReportPeriod, customStart?: string, customEnd?: string): { start: string; end: string } {
  const today = getTodayDateString();

  switch (period) {
    case 'today':
      return { start: today, end: today };
    case 'yesterday': {
      const yest = getYesterdayString();
      return { start: yest, end: yest };
    }
    case 'this_week':
      return { start: getStartOfWeek(), end: today };
    case 'this_month':
      return { start: getStartOfMonth(), end: today };
    case 'custom':
      return { start: customStart || today, end: customEnd || today };
  }
}

export async function getFinancialSummary(startDate: string, endDate: string, classId?: string): Promise<FinancialSummary> {
  const [allMeals, allDeposits, allStudents] = await Promise.all([
    db.meals.toArray(),
    db.deposits.toArray(),
    db.students.toArray()
  ]);

  // Filter students if classId specified
  const filteredStudents = classId ? allStudents.filter(s => s.class_id === classId) : allStudents;
  const studentIds = new Set(filteredStudents.map(s => s.id));

  // Filter meals in date range
  const rangeMeals = allMeals.filter(m => 
    m.date >= startDate && 
    m.date <= endDate && 
    m.status === 'confirmed' &&
    studentIds.has(m.student_id)
  );

  // Filter deposits in date range
  const rangeDeposits = allDeposits.filter(d =>
    d.date >= startDate &&
    d.date <= endDate &&
    studentIds.has(d.student_id)
  );

  let totalMeals = 0;
  let totalCash = 0;
  let totalPrepaidConsumed = 0;
  let totalCreditGenerated = 0;

  for (const m of rangeMeals) {
    totalMeals++;
    if (m.payment_method === 'cash') {
      totalCash += m.amount;
    } else if (m.payment_method === 'prepaid') {
      totalPrepaidConsumed += m.amount;
    } else if (m.payment_method === 'credit') {
      totalCreditGenerated += m.amount;
    }
  }

  let totalDeposits = 0;
  for (const d of rangeDeposits) {
    totalDeposits += d.amount;
  }

  // Calculate current unpaid debt (students with negative balance)
  let totalCurrentUnpaid = 0;
  for (const s of filteredStudents) {
    if (s.active && s.balance < 0) {
      totalCurrentUnpaid += Math.abs(s.balance);
    }
  }

  return {
    periodLabel: startDate === endDate ? startDate : `${startDate} au ${endDate}`,
    startDate,
    endDate,
    totalMeals,
    totalCash,
    totalPrepaidConsumed,
    totalCreditGenerated,
    totalDeposits,
    totalCurrentUnpaid,
    cashInHandToday: totalCash + totalDeposits
  };
}

export async function getClassBreakdown(startDate: string, endDate: string): Promise<ClassBreakdownItem[]> {
  const [allClasses, allStudents, meals] = await Promise.all([
    db.classes.toArray(),
    db.students.toArray(),
    db.meals.toArray()
  ]);
  const classes = allClasses.filter(c => c.active !== false);
  const students = allStudents.filter(s => s.active !== false);

  const studentsByClass = new Map<string, Student[]>();
  for (const s of students) {
    const list = studentsByClass.get(s.class_id) || [];
    list.push(s);
    studentsByClass.set(s.class_id, list);
  }

  const studentToClass = new Map(students.map(s => [s.id, s.class_id]));

  const breakdown: ClassBreakdownItem[] = [];

  for (const cls of classes) {
    const classStudents = studentsByClass.get(cls.id) || [];
    const classStudentIds = new Set(classStudents.map(s => s.id));

    const classMeals = meals.filter(m =>
      m.date >= startDate &&
      m.date <= endDate &&
      m.status === 'confirmed' &&
      classStudentIds.has(m.student_id)
    );

    let cashAmount = 0;
    let prepaidAmount = 0;
    let creditAmount = 0;

    for (const m of classMeals) {
      if (m.payment_method === 'cash') cashAmount += m.amount;
      else if (m.payment_method === 'prepaid') prepaidAmount += m.amount;
      else if (m.payment_method === 'credit') creditAmount += m.amount;
    }

    breakdown.push({
      classId: cls.id,
      className: cls.name,
      level: cls.level,
      mealsCount: classMeals.length,
      cashAmount,
      prepaidAmount,
      creditAmount,
      totalStudents: classStudents.length
    });
  }

  return breakdown;
}

export async function getUnpaidStudents(classId?: string): Promise<UnpaidStudentItem[]> {
  const [allStudents, classes, settings] = await Promise.all([
    db.students.toArray(),
    db.classes.toArray(),
    db.settings.toCollection().first()
  ]);
  const students = allStudents.filter(s => s.active !== false);

  const mealPrice = settings?.meal_price || 400;
  const classMap = new Map(classes.map(c => [c.id, c.name]));

  const unpaidStudents = students.filter(s => s.balance < 0 && (!classId || s.class_id === classId));

  return unpaidStudents.map(s => {
    const debt = Math.abs(s.balance);
    const unpaidMealsCount = Math.ceil(debt / mealPrice);

    return {
      studentId: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      className: classMap.get(s.class_id) || 'Classe inconnue',
      debtAmount: debt,
      unpaidMealsCount,
      parentName: s.parent_name || 'Non renseigné',
      parentPhone: s.parent_phone || 'Non renseigné'
    };
  }).sort((a, b) => b.debtAmount - a.debtAmount);
}
