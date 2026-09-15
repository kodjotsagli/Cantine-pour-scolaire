import Dexie, { type Table } from 'dexie';
import type { Student, ClassRoom, Meal, Deposit, Settings, SyncQueueItem } from '../types';

export class CantineDatabase extends Dexie {
  students!: Table<Student, string>;
  classes!: Table<ClassRoom, string>;
  meals!: Table<Meal, string>;
  deposits!: Table<Deposit, string>;
  settings!: Table<Settings, number>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super('CantineScolaireDB');
    this.version(1).stores({
      students: 'id, school_id, class_id, active, sync_status, [active+class_id]',
      classes: 'id, school_id, active',
      meals: 'id, school_id, student_id, date, status, payment_method, [student_id+date], [date+status]',
      deposits: 'id, school_id, student_id, date',
      settings: '++id, school_id',
      syncQueue: 'id, table_name, status, created_at'
    });
  }
}

export const db = new CantineDatabase();
