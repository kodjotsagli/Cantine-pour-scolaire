import { db } from '../db';
import type { Deposit, Student } from '../types';
import { addToSyncQueue } from './syncService';

export interface DepositReceiptData {
  deposit: Deposit;
  student: Student;
  previousBalance: number;
  newBalance: number;
  schoolName: string;
}

export async function createDeposit(
  studentId: string,
  amount: number,
  date: string,
  note?: string
): Promise<DepositReceiptData> {
  const student = await db.students.get(studentId);
  if (!student) {
    throw new Error('Élève introuvable.');
  }

  if (amount <= 0) {
    throw new Error('Le montant du dépôt doit être supérieur à 0 FCFA.');
  }

  const previousBalance = student.balance;
  const newBalance = previousBalance + amount;
  const now = new Date().toISOString();

  // Reference: DEP-YYYYMMDD-XXXX
  const refDate = date.replace(/-/g, '');
  const refRandom = Math.floor(1000 + Math.random() * 9000);
  const reference = `DEP-${refDate}-${refRandom}`;

  const depositId = `dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const newDeposit: Deposit = {
    id: depositId,
    school_id: student.school_id,
    student_id: studentId,
    amount: amount,
    date: date,
    note: note || 'Recharge de solde cantine',
    reference: reference,
    created_at: now,
    updated_at: now
  };

  // 1. Save deposit
  await db.deposits.add(newDeposit);

  // 2. Update student balance
  await db.students.update(studentId, {
    balance: newBalance,
    updated_at: now
  });

  // 3. Queue for sync
  await addToSyncQueue('deposits', 'create', depositId, newDeposit);
  await addToSyncQueue('students', 'update', studentId, { balance: newBalance });

  const settings = await db.settings.toCollection().first();

  return {
    deposit: newDeposit,
    student: { ...student, balance: newBalance },
    previousBalance,
    newBalance,
    schoolName: settings?.school_name || 'École Cantine'
  };
}

export async function getDeposits(limit = 100): Promise<(Deposit & { student?: Student })[]> {
  const deposits = await db.deposits.reverse().sortBy('date');
  const students = await db.students.toArray();
  const studentMap = new Map(students.map(s => [s.id, s]));

  return deposits.slice(0, limit).map(d => ({
    ...d,
    student: studentMap.get(d.student_id)
  }));
}
