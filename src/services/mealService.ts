import { db } from '../db';
import type { Meal, PaymentMethod, ClassSummary } from '../types';
import { addToSyncQueue } from './syncService';

export async function getMealPrice(): Promise<number> {
  const settings = await db.settings.toCollection().first();
  return settings?.meal_price || 400;
}

export async function getMealsForDate(date: string): Promise<Meal[]> {
  return await db.meals.where('date').equals(date).toArray();
}

export async function getTodayMealForStudent(studentId: string, date: string): Promise<Meal | undefined> {
  const meal = await db.meals
    .where('[student_id+date]')
    .equals([studentId, date])
    .first();

  if (meal && meal.status !== 'cancelled') {
    return meal;
  }
  return undefined;
}

export async function recordMeal(
  studentId: string,
  date: string,
  paymentMethod: PaymentMethod
): Promise<{ success: boolean; message: string; meal?: Meal }> {
  const student = await db.students.get(studentId);
  if (!student) {
    return { success: false, message: 'Élève non trouvé.' };
  }

  // 1. Check duplicate for same date
  const existingMeal = await db.meals
    .where('[student_id+date]')
    .equals([studentId, date])
    .first();

  if (existingMeal && existingMeal.status !== 'cancelled') {
    return {
      success: false,
      message: 'Cet élève a déjà été enregistré pour cette journée.'
    };
  }

  const mealPrice = await getMealPrice();

  // 2. Validate prepaid balance if prepaid chosen
  if (paymentMethod === 'prepaid') {
    if (student.balance < mealPrice) {
      return {
        success: false,
        message: `Solde insuffisant (${student.balance} FCFA disponible) pour utiliser le solde prépayé. Repas : ${mealPrice} FCFA.`
      };
    }
  }

  // 3. Create or Reactivate meal
  const mealId = existingMeal ? existingMeal.id : `meal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const newMeal: Meal = {
    id: mealId,
    school_id: student.school_id,
    student_id: studentId,
    date: date,
    amount: mealPrice,
    payment_method: paymentMethod,
    status: 'confirmed',
    created_at: existingMeal ? existingMeal.created_at : now,
    updated_at: now
  };

  // 4. Update student balance if prepaid or credit
  let newBalance = student.balance;
  if (paymentMethod === 'prepaid') {
    newBalance -= mealPrice; // Deduct from prepaid
  } else if (paymentMethod === 'credit') {
    newBalance -= mealPrice; // Increase debt (negative balance)
  }
  // Cash does not alter student's personal prepaid account

  if (newBalance !== student.balance) {
    await db.students.update(studentId, {
      balance: newBalance,
      updated_at: now
    });
  }

  if (existingMeal) {
    await db.meals.update(mealId, newMeal);
    await addToSyncQueue('meals', 'update', mealId, newMeal);
  } else {
    await db.meals.add(newMeal);
    await addToSyncQueue('meals', 'create', mealId, newMeal);
  }

  return {
    success: true,
    message: 'Repas pointé avec succès.',
    meal: newMeal
  };
}

export async function cancelMeal(mealId: string): Promise<{ success: boolean; message: string }> {
  const meal = await db.meals.get(mealId);
  if (!meal) {
    return { success: false, message: 'Repas introuvable.' };
  }

  if (meal.status === 'cancelled') {
    return { success: false, message: 'Ce repas est déjà annulé.' };
  }

  const student = await db.students.get(meal.student_id);
  if (!student) {
    return { success: false, message: 'Élève introuvable.' };
  }

  const now = new Date().toISOString();

  // Restore student balance
  let restoredBalance = student.balance;
  if (meal.payment_method === 'prepaid') {
    restoredBalance += meal.amount; // Give back prepaid funds
  } else if (meal.payment_method === 'credit') {
    restoredBalance += meal.amount; // Cancel debt
  }

  if (restoredBalance !== student.balance) {
    await db.students.update(student.id, {
      balance: restoredBalance,
      updated_at: now
    });
  }

  // Mark meal as cancelled
  await db.meals.update(mealId, {
    status: 'cancelled',
    cancelled_at: now,
    updated_at: now
  });

  await addToSyncQueue('meals', 'update', mealId, {
    ...meal,
    status: 'cancelled',
    cancelled_at: now
  });

  return {
    success: true,
    message: 'Le repas a été annulé et les montants ont été régularisés avec succès.'
  };
}

export async function getClassSummaryForDate(date: string, classId: string): Promise<ClassSummary> {
  const allClassStudents = await db.students
    .where('class_id')
    .equals(classId)
    .toArray();
  const classStudents = allClassStudents.filter(s => s.active !== false);

  const studentIds = new Set(classStudents.map(s => s.id));
  const meals = await db.meals.where('date').equals(date).toArray();

  const classMeals = meals.filter(m => studentIds.has(m.student_id) && m.status === 'confirmed');

  let paidCash = 0;
  let paidPrepaid = 0;
  let paidCredit = 0;
  let totalCollectedCash = 0;
  let totalUnpaidCredit = 0;

  for (const m of classMeals) {
    if (m.payment_method === 'cash') {
      paidCash++;
      totalCollectedCash += m.amount;
    } else if (m.payment_method === 'prepaid') {
      paidPrepaid++;
    } else if (m.payment_method === 'credit') {
      paidCredit++;
      totalUnpaidCredit += m.amount;
    }
  }

  return {
    totalStudents: classStudents.length,
    mealsServed: classMeals.length,
    paidCash,
    paidPrepaid,
    paidCredit,
    totalCollectedCash,
    totalUnpaidCredit
  };
}
