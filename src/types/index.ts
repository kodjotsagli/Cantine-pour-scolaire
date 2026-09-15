export type PaymentMethod = 'prepaid' | 'cash' | 'credit';

export type SyncStatus = 'synced' | 'pending' | 'error';

export type UserRole = 'admin' | 'manager' | 'agent';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  school_id?: string;
}

export interface School {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  meal_price?: number;
  currency?: string;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  class_id: string;
  parent_name: string;
  parent_phone: string;
  balance: number; // in FCFA. Negative = debt
  active: boolean;
  created_at: string;
  updated_at: string;
  sync_status?: SyncStatus;
}

export interface ClassRoom {
  id: string;
  school_id: string;
  name: string;
  level: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  school_id: string;
  student_id: string;
  date: string; // YYYY-MM-DD
  amount: number; // 400 FCFA
  payment_method: PaymentMethod;
  status: 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
}

export interface Deposit {
  id: string;
  school_id: string;
  student_id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  reference: string;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id?: number;
  school_id: string;
  school_name: string;
  address: string;
  phone: string;
  meal_price: number; // default 400
  currency: string; // 'FCFA'
  opening_days: string[]; // e.g. ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
  timezone: string;
}

export interface SyncQueueItem {
  id: string;
  table_name: 'students' | 'classes' | 'meals' | 'deposits' | 'settings';
  action: 'create' | 'update' | 'delete';
  record_id: string;
  payload: any;
  created_at: string;
  status: 'pending' | 'processing' | 'failed';
  error_message?: string;
}

export interface ClassSummary {
  totalStudents: number;
  mealsServed: number;
  paidCash: number;
  paidPrepaid: number;
  paidCredit: number;
  totalCollectedCash: number;
  totalUnpaidCredit: number;
}
