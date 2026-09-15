import { db } from '../db';
import { getTodayDateString } from '../utils/dates';
import { getFinancialSummary, getClassBreakdown, getUnpaidStudents } from './reportService';

/**
 * Downloads a string content as a file on client side
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Formats an array of rows to a CSV string with UTF-8 BOM and semicolon separator for Excel compatibility
 */
export function createExcelCsv(headers: string[], rows: (string | number)[][]): string {
  const bom = '\uFEFF';
  const csvLines = [
    headers.map(escapeCsvCell).join(';')
  ];

  for (const row of rows) {
    csvLines.push(row.map(escapeCsvCell).join(';'));
  }

  return bom + csvLines.join('\r\n');
}

function escapeCsvCell(cell: string | number | undefined | null): string {
  if (cell === undefined || cell === null) return '""';
  const val = String(cell).replace(/"/g, '""');
  return `"${val}"`;
}

// 1. Export Students CSV
export async function exportStudentsCsv(): Promise<void> {
  const [students, classes] = await Promise.all([
    db.students.toArray(),
    db.classes.toArray()
  ]);

  const classMap = new Map(classes.map(c => [c.id, c.name]));

  const headers = ['Nom', 'Prénom', 'Classe', 'Parent', 'Téléphone', 'Solde (FCFA)', 'Statut'];
  const rows = students.map(s => [
    s.last_name,
    s.first_name,
    classMap.get(s.class_id) || 'N/A',
    s.parent_name || '',
    s.parent_phone || '',
    s.balance,
    s.active ? 'Actif' : 'Inactif'
  ]);

  const csv = createExcelCsv(headers, rows);
  downloadFile(csv, `eleves-cantine-${getTodayDateString()}.csv`, 'text/csv;charset=utf-8;');
}

// 2. Export Meals CSV
export async function exportMealsCsv(startDate?: string, endDate?: string): Promise<void> {
  const [meals, students, classes] = await Promise.all([
    db.meals.toArray(),
    db.students.toArray(),
    db.classes.toArray()
  ]);

  const studentMap = new Map(students.map(s => [s.id, s]));
  const classMap = new Map(classes.map(c => [c.id, c.name]));

  let filtered = meals;
  if (startDate && endDate) {
    filtered = meals.filter(m => m.date >= startDate && m.date <= endDate);
  }

  const headers = ['Date', 'Nom Élève', 'Prénom Élève', 'Classe', 'Montant (FCFA)', 'Mode de Paiement', 'Statut'];
  const rows = filtered.map(m => {
    const student = studentMap.get(m.student_id);
    const className = student ? (classMap.get(student.class_id) || '') : '';
    
    let mode = 'Espèces';
    if (m.payment_method === 'prepaid') mode = 'Solde prépayé';
    if (m.payment_method === 'credit') mode = 'À crédit';

    return [
      m.date,
      student?.last_name || 'Inconnu',
      student?.first_name || '',
      className,
      m.amount,
      mode,
      m.status === 'confirmed' ? 'Confirmé' : 'Annulé'
    ];
  });

  const csv = createExcelCsv(headers, rows);
  downloadFile(csv, `repas-cantine-${getTodayDateString()}.csv`, 'text/csv;charset=utf-8;');
}

// 3. Export Deposits CSV
export async function exportDepositsCsv(): Promise<void> {
  const [deposits, students, classes] = await Promise.all([
    db.deposits.toArray(),
    db.students.toArray(),
    db.classes.toArray()
  ]);

  const studentMap = new Map(students.map(s => [s.id, s]));
  const classMap = new Map(classes.map(c => [c.id, c.name]));

  const headers = ['Référence', 'Date', 'Nom Élève', 'Prénom Élève', 'Classe', 'Montant (FCFA)', 'Parent', 'Note'];
  const rows = deposits.map(d => {
    const student = studentMap.get(d.student_id);
    const className = student ? (classMap.get(student.class_id) || '') : '';

    return [
      d.reference,
      d.date,
      student?.last_name || 'Inconnu',
      student?.first_name || '',
      className,
      d.amount,
      student?.parent_name || '',
      d.note || ''
    ];
  });

  const csv = createExcelCsv(headers, rows);
  downloadFile(csv, `depots-cantine-${getTodayDateString()}.csv`, 'text/csv;charset=utf-8;');
}

// 4. Export Unpaid Debts CSV
export async function exportUnpaidCsv(): Promise<void> {
  const unpaidList = await getUnpaidStudents();

  const headers = ['Nom', 'Prénom', 'Classe', 'Montant Dû (FCFA)', 'Repas Impayés Estimés', 'Nom du Parent', 'Téléphone Parent'];
  const rows = unpaidList.map(u => [
    u.lastName,
    u.firstName,
    u.className,
    u.debtAmount,
    u.unpaidMealsCount,
    u.parentName,
    u.parentPhone
  ]);

  const csv = createExcelCsv(headers, rows);
  downloadFile(csv, `impayes-cantine-${getTodayDateString()}.csv`, 'text/csv;charset=utf-8;');
}

// 5. Full Financial Report CSV
export async function exportFinancialReportCsv(startDate: string, endDate: string): Promise<void> {
  const summary = await getFinancialSummary(startDate, endDate);
  const classBreakdown = await getClassBreakdown(startDate, endDate);

  const lines: string[] = [
    '\uFEFFRAPPORT FINANCIER CANTINE SCOLAIRE',
    `Période;du ${startDate} au ${endDate}`,
    `Généré le;${new Date().toLocaleString('fr-FR')}`,
    '',
    'INDICATEUR;VALEUR (FCFA);DETAILS',
    `Repas servis au total;${summary.totalMeals};repas`,
    `Recette Espèces (repas du jour);${summary.totalCash} FCFA;Paiements cash comptant`,
    `Dépôts reçus (avances parents);${summary.totalDeposits} FCFA;Recharges de comptes`,
    `Total Espèces Encaissées;${summary.cashInHandToday} FCFA;Argent physique en caisse`,
    `Consommé sur solde prépayé;${summary.totalPrepaidConsumed} FCFA;Déduit des avances`,
    `Nouveaux crédits accordés;${summary.totalCreditGenerated} FCFA;Dettes de la période`,
    `Total impayés global actuel;${summary.totalCurrentUnpaid} FCFA;Solde débiteur des élèves`,
    '',
    'RÉPARTITION PAR CLASSE',
    'Classe;Repas Servis;Espèces (FCFA);Solde Prépayé (FCFA);À Crédit (FCFA);Total Élèves'
  ];

  for (const c of classBreakdown) {
    lines.push(`"${c.className}";${c.mealsCount};${c.cashAmount};${c.prepaidAmount};${c.creditAmount};${c.totalStudents}`);
  }

  downloadFile(lines.join('\r\n'), `rapport-cantine-${startDate}-${endDate}.csv`, 'text/csv;charset=utf-8;');
}

// 6. JSON Full Database Backup
export async function exportJsonBackup(): Promise<void> {
  const [students, classes, meals, deposits, settings] = await Promise.all([
    db.students.toArray(),
    db.classes.toArray(),
    db.meals.toArray(),
    db.deposits.toArray(),
    db.settings.toArray()
  ]);

  const backupData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    schoolName: settings[0]?.school_name || 'École Cantine',
    data: {
      settings,
      classes,
      students,
      meals,
      deposits
    }
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  downloadFile(jsonStr, `sauvegarde-cantine-${getTodayDateString()}.json`, 'application/json');
}

// 7. JSON Database Restore
export async function importJsonBackup(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed.data || !parsed.data.classes || !parsed.data.students) {
      return { success: false, message: 'Fichier de sauvegarde invalide ou incomplet.' };
    }

    // Replace existing database
    await db.transaction('rw', [db.settings, db.classes, db.students, db.meals, db.deposits, db.syncQueue], async () => {
      await db.meals.clear();
      await db.deposits.clear();
      await db.students.clear();
      await db.classes.clear();
      await db.settings.clear();
      await db.syncQueue.clear();

      if (parsed.data.settings?.length) await db.settings.bulkAdd(parsed.data.settings);
      if (parsed.data.classes?.length) await db.classes.bulkAdd(parsed.data.classes);
      if (parsed.data.students?.length) await db.students.bulkAdd(parsed.data.students);
      if (parsed.data.meals?.length) await db.meals.bulkAdd(parsed.data.meals);
      if (parsed.data.deposits?.length) await db.deposits.bulkAdd(parsed.data.deposits);
    });

    return { success: true, message: 'Sauvegarde restaurée avec succès.' };
  } catch (err: any) {
    return { success: false, message: `Erreur lors de la lecture du fichier : ${err?.message || 'Format JSON invalide'}` };
  }
}
