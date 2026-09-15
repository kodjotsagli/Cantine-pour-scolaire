import { db } from './index';
import type { ClassRoom, Student, Settings, Meal, Deposit } from '../types';
import { getTodayDateString, getYesterdayString } from '../utils/dates';

export const DEFAULT_SETTINGS: Settings = {
  school_id: 'school-default-01',
  school_name: 'École Primaire La Référence',
  address: 'Boulevard du 13 Janvier, Lomé, Togo',
  phone: '+228 90 12 34 56',
  meal_price: 400,
  currency: 'FCFA',
  opening_days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
  timezone: 'Africa/Lome'
};

export const DEFAULT_CLASSES: ClassRoom[] = [
  { id: 'cls-sec-1', school_id: 'school-default-01', name: 'Section 1', level: 'Maternelle', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cls-sec-2', school_id: 'school-default-01', name: 'Section 2', level: 'Maternelle', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cls-cp1', school_id: 'school-default-01', name: 'CP1', level: 'Primaire', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cls-cp2', school_id: 'school-default-01', name: 'CP2', level: 'Primaire', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cls-ce1', school_id: 'school-default-01', name: 'CE1', level: 'Primaire', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cls-ce2', school_id: 'school-default-01', name: 'CE2', level: 'Primaire', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cls-cm1', school_id: 'school-default-01', name: 'CM1', level: 'Primaire', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cls-cm2', school_id: 'school-default-01', name: 'CM2', level: 'Primaire', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export async function initializeDatabaseIfEmpty() {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await seedDemoData(true);
  }
}

export async function seedDemoData(clearExisting = false) {
  if (clearExisting) {
    await db.meals.clear();
    await db.deposits.clear();
    await db.students.clear();
    await db.classes.clear();
    await db.settings.clear();
    await db.syncQueue.clear();
  }

  // 1. Settings
  await db.settings.add(DEFAULT_SETTINGS);

  // 2. Classes
  await db.classes.bulkAdd(DEFAULT_CLASSES);

  // 3. Students
  const today = getTodayDateString();
  const yesterday = getYesterdayString();

  const demoStudents: Student[] = [
    // CP1
    {
      id: 'std-cp1-01',
      school_id: 'school-default-01',
      first_name: 'Koffi',
      last_name: 'MENSAH',
      class_id: 'cls-cp1',
      parent_name: 'Kokou Mensah',
      parent_phone: '+228 90 23 45 67',
      balance: 4800, // Prepaid surplus
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'std-cp1-02',
      school_id: 'school-default-01',
      first_name: 'Afi',
      last_name: 'LAWSON',
      class_id: 'cls-cp1',
      parent_name: 'Paul Lawson',
      parent_phone: '+228 91 34 56 78',
      balance: 0,
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'std-cp1-03',
      school_id: 'school-default-01',
      first_name: 'Kodjo',
      last_name: 'AMEGAN',
      class_id: 'cls-cp1',
      parent_name: 'Ephrem Amegan',
      parent_phone: '+228 92 45 67 89',
      balance: -800, // In debt (2 meals)
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'std-cp1-04',
      school_id: 'school-default-01',
      first_name: 'Akouvi',
      last_name: 'DOSSOU',
      class_id: 'cls-cp1',
      parent_name: 'Hélène Dossou',
      parent_phone: '+228 93 56 78 90',
      balance: 10000, // Large advance
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'std-cp1-05',
      school_id: 'school-default-01',
      first_name: 'Komla',
      last_name: 'AGBEKO',
      class_id: 'cls-cp1',
      parent_name: 'Norbert Agbeko',
      parent_phone: '+228 90 67 89 01',
      balance: -400, // 1 meal credit
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },

    // CP2
    {
      id: 'std-cp2-01',
      school_id: 'school-default-01',
      first_name: 'Abra',
      last_name: 'AYITÉ',
      class_id: 'cls-cp2',
      parent_name: 'Sylvain Ayité',
      parent_phone: '+228 91 78 90 12',
      balance: 3200,
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'std-cp2-02',
      school_id: 'school-default-01',
      first_name: 'Yaovi',
      last_name: 'TOSSOU',
      class_id: 'cls-cp2',
      parent_name: 'Victor Tossou',
      parent_phone: '+228 92 89 01 23',
      balance: 800,
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'std-cp2-03',
      school_id: 'school-default-01',
      first_name: 'Dzifa',
      last_name: 'KPOGO',
      class_id: 'cls-cp2',
      parent_name: 'Béatrice Kpogo',
      parent_phone: '+228 93 90 12 34',
      balance: -1200, // 3 unpaid meals
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },

    // CE1
    {
      id: 'std-ce1-01',
      school_id: 'school-default-01',
      first_name: 'Mawuli',
      last_name: 'ADANLETE',
      class_id: 'cls-ce1',
      parent_name: 'Jean Adanlete',
      parent_phone: '+228 90 01 23 45',
      balance: 7600,
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'std-ce1-02',
      school_id: 'school-default-01',
      first_name: 'Essi',
      last_name: 'SEDDOH',
      class_id: 'cls-ce1',
      parent_name: 'Martine Seddoh',
      parent_phone: '+228 91 12 34 56',
      balance: 1600,
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },

    // CM2
    {
      id: 'std-cm2-01',
      school_id: 'school-default-01',
      first_name: 'Fofo',
      last_name: 'KOUDOSSOU',
      class_id: 'cls-cm2',
      parent_name: 'Albert Koudossou',
      parent_phone: '+228 92 23 45 67',
      balance: 5200,
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'std-cm2-02',
      school_id: 'school-default-01',
      first_name: 'Abla',
      last_name: 'DEGBE',
      class_id: 'cls-cm2',
      parent_name: 'Rosaline Degbe',
      parent_phone: '+228 93 34 56 78',
      balance: 0,
      active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  await db.students.bulkAdd(demoStudents);

  // 4. Demo Deposits
  const demoDeposits: Deposit[] = [
    {
      id: 'dep-001',
      school_id: 'school-default-01',
      student_id: 'std-cp1-01',
      amount: 6000,
      date: yesterday,
      reference: 'DEP-2026-0901',
      note: 'Dépôt pour le mois de septembre',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'dep-002',
      school_id: 'school-default-01',
      student_id: 'std-cp1-04',
      amount: 10000,
      date: today,
      reference: 'DEP-2026-0902',
      note: 'Avance cantine rentrée',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dep-003',
      school_id: 'school-default-01',
      student_id: 'std-ce1-01',
      amount: 8000,
      date: today,
      reference: 'DEP-2026-0903',
      note: 'Paiement en espèces par la maman',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  await db.deposits.bulkAdd(demoDeposits);

  // 5. Demo Meals for Yesterday and Today
  const demoMeals: Meal[] = [
    // Yesterday meals
    {
      id: 'meal-yest-01',
      school_id: 'school-default-01',
      student_id: 'std-cp1-01',
      date: yesterday,
      amount: 400,
      payment_method: 'prepaid',
      status: 'confirmed',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'meal-yest-02',
      school_id: 'school-default-01',
      student_id: 'std-cp1-02',
      date: yesterday,
      amount: 400,
      payment_method: 'cash',
      status: 'confirmed',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'meal-yest-03',
      school_id: 'school-default-01',
      student_id: 'std-cp1-03',
      date: yesterday,
      amount: 400,
      payment_method: 'credit',
      status: 'confirmed',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },

    // Today meals
    {
      id: 'meal-tod-01',
      school_id: 'school-default-01',
      student_id: 'std-cp1-01',
      date: today,
      amount: 400,
      payment_method: 'prepaid',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'meal-tod-02',
      school_id: 'school-default-01',
      student_id: 'std-cp1-02',
      date: today,
      amount: 400,
      payment_method: 'cash',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'meal-tod-03',
      school_id: 'school-default-01',
      student_id: 'std-cp1-03',
      date: today,
      amount: 400,
      payment_method: 'credit',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'meal-tod-04',
      school_id: 'school-default-01',
      student_id: 'std-cp2-01',
      date: today,
      amount: 400,
      payment_method: 'prepaid',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'meal-tod-05',
      school_id: 'school-default-01',
      student_id: 'std-cp2-02',
      date: today,
      amount: 400,
      payment_method: 'cash',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  await db.meals.bulkAdd(demoMeals);
}
