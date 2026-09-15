import React, { useState, useEffect } from 'react';
import { db } from '../../db';
import type { Student, ClassRoom, Settings } from '../../types';
import { formatDateLong, getTodayDateString } from '../../utils/dates';
import { Button } from '../ui/Button';
import { Printer, ArrowLeft } from 'lucide-react';

interface PrintableAttendanceSheetProps {
  classId: string;
  date: string;
  onBack: () => void;
}

export const PrintableAttendanceSheet: React.FC<PrintableAttendanceSheetProps> = ({
  classId,
  date,
  onBack
}) => {
  const [classroom, setClassroom] = useState<ClassRoom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    db.classes.get(classId).then((c) => setClassroom(c || null));
    db.settings.toCollection().first().then((s) => setSettings(s || null));
    db.students
      .where('class_id')
      .equals(classId)
      .toArray()
      .then((allStds) => {
        const stds = allStds.filter(s => s.active !== false);
        stds.sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name));
        setStudents(stds);
      });
  }, [classId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Screen action header */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Retour
        </Button>
        <Button variant="primary" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
          Imprimer la feuille A4
        </Button>
      </div>

      {/* A4 Document Content */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 print:border-none print:p-0 text-slate-900">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">
                {settings?.school_name || 'École Primaire'}
              </h2>
              <p className="text-xs text-slate-600">Service de Restauration Scolaire & Cantine</p>
              <p className="text-xs text-slate-500">{settings?.phone}</p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold text-slate-800">FEUILLE DE POINTAGE</h3>
              <p className="text-xs font-semibold uppercase text-emerald-800">
                Classe : {classroom?.name} ({classroom?.level})
              </p>
              <p className="text-xs text-slate-600">Date : {formatDateLong(date)}</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-slate-700">
              <th className="p-2 border border-slate-300 w-8 text-center">N°</th>
              <th className="p-2 border border-slate-300">Nom & Prénom(s)</th>
              <th className="p-2 border border-slate-300 text-center w-24">Repas Pris</th>
              <th className="p-2 border border-slate-300 text-center w-28">Paiement</th>
              <th className="p-2 border border-slate-300 text-center w-36">Signature / Émargement</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => (
              <tr key={s.id} className="border-b border-slate-200">
                <td className="p-2 border border-slate-300 text-center font-bold text-slate-500">
                  {idx + 1}
                </td>
                <td className="p-2 border border-slate-300 font-semibold text-slate-900">
                  {s.last_name} {s.first_name}
                </td>
                <td className="p-2 border border-slate-300 text-center">
                  <div className="w-4 h-4 border border-slate-400 rounded mx-auto"></div>
                </td>
                <td className="p-2 border border-slate-300 text-center text-[10px] text-slate-500">
                  [ ] Solde &nbsp; [ ] Cash &nbsp; [ ] Crédit
                </td>
                <td className="p-2 border border-slate-300">
                  <div className="h-6"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Signatures at bottom */}
        <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-300 text-center text-xs">
          <div>
            <p className="font-bold">L'Enseignant(e) / Titulaire de classe</p>
            <div className="h-16"></div>
          </div>
          <div>
            <p className="font-bold">Le Responsable de Cantine</p>
            <div className="h-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
