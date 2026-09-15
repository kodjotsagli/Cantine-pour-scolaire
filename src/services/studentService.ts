import { db } from '../db';
import type { Student, Meal, Deposit } from '../types';
import { addToSyncQueue } from './syncService';

export interface StudentTransaction {
  id: string;
  date: string;
  type: 'deposit' | 'meal';
  label: string;
  amount: number; // positive for deposit, negative for meal
  paymentMethod?: string;
  status?: string;
  note?: string;
  reference?: string;
}

export async function getStudents(classId?: string, activeOnly: boolean = false): Promise<Student[]> {
  let students = await db.students.toArray();

  if (activeOnly) {
    students = students.filter(s => s.active);
  }
  if (classId) {
    students = students.filter(s => s.class_id === classId);
  }

  // Sort alphabetically by last_name, then first_name
  return students.sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name));
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  return await db.students.get(id);
}

export async function createStudent(data: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> {
  const newStudent: Student = {
    ...data,
    id: `std-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    balance: data.balance || 0,
    active: data.active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sync_status: 'pending'
  };

  await db.students.add(newStudent);
  await addToSyncQueue('students', 'create', newStudent.id, newStudent);
  return newStudent;
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<void> {
  const updatedData = {
    ...updates,
    updated_at: new Date().toISOString(),
    sync_status: 'pending' as const
  };

  await db.students.update(id, updatedData);
  const full = await db.students.get(id);
  if (full) {
    await addToSyncQueue('students', 'update', id, full);
  }
}

export async function deleteOrDeactivateStudent(id: string): Promise<{ deactivated: boolean; message: string }> {
  // Check if student has meals or deposits
  const mealCount = await db.meals.where('student_id').equals(id).count();
  const depositCount = await db.deposits.where('student_id').equals(id).count();

  if (mealCount > 0 || depositCount > 0) {
    // Soft delete (deactivate) to preserve accounting history
    await updateStudent(id, { active: false });
    return {
      deactivated: true,
      message: 'Cet élève possède un historique comptable (repas ou dépôts). Il a été désactivé pour préserver l\'intégrité des données.'
    };
  } else {
    // Safe to delete physically
    await db.students.delete(id);
    await addToSyncQueue('students', 'delete', id, { id });
    return {
      deactivated: false,
      message: 'Élève supprimé avec succès.'
    };
  }
}

export async function getStudentTransactions(studentId: string): Promise<StudentTransaction[]> {
  const [meals, deposits] = await Promise.all([
    db.meals.where('student_id').equals(studentId).toArray(),
    db.deposits.where('student_id').equals(studentId).toArray()
  ]);

  const transactions: StudentTransaction[] = [];

  for (const dep of deposits) {
    transactions.push({
      id: dep.id,
      date: dep.date,
      type: 'deposit',
      label: `Dépôt parent (${dep.reference || 'Recharge'})`,
      amount: dep.amount, // positive
      note: dep.note,
      reference: dep.reference
    });
  }

  for (const meal of meals) {
    let methodLabel = 'Espèces';
    if (meal.payment_method === 'prepaid') methodLabel = 'Solde prépayé';
    if (meal.payment_method === 'credit') methodLabel = 'À crédit (dette)';

    const isCancelled = meal.status === 'cancelled';

    transactions.push({
      id: meal.id,
      date: meal.date,
      type: 'meal',
      label: isCancelled ? `Repas annulé (${methodLabel})` : `Repas consommé (${methodLabel})`,
      amount: isCancelled ? 0 : -meal.amount, // negative when consumed
      paymentMethod: meal.payment_method,
      status: meal.status
    });
  }

  // Sort descending by date, then created_at
  transactions.sort((a, b) => b.date.localeCompare(a.date));
  return transactions;
}
