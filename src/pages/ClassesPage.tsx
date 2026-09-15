import React, { useState, useEffect } from 'react';
import { db } from '../db';
import type { ClassRoom, Student } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { 
  GraduationCap, 
  PlusCircle, 
  Users, 
  Edit2, 
  ArrowLeft, 
  Search, 
  Phone, 
  Wallet, 
  ChevronRight, 
  UserPlus,
  UtensilsCrossed
} from 'lucide-react';
import { addToSyncQueue } from '../services/syncService';
import { getAllClasses } from '../services/classService';
import { formatFCFA } from '../utils/currency';
import { StudentFormModal } from '../components/students/StudentFormModal';

interface ClassesPageProps {
  onSelectStudent?: (studentId: string) => void;
  onOpenDepositForStudent?: (studentId: string) => void;
  onNavigateToPointage?: (classId: string) => void;
}

export const ClassesPage: React.FC<ClassesPageProps> = ({
  onSelectStudent,
  onOpenDepositForStudent,
  onNavigateToPointage
}) => {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [studentCounts, setStudentCounts] = useState<Map<string, number>>(new Map());
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  // Selected class for student list view
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [level, setLevel] = useState('Primaire');

  const loadClasses = async () => {
    const [clsList, allStudents] = await Promise.all([
      getAllClasses(),
      db.students.toArray()
    ]);
    const students = allStudents.filter(s => s.active !== false);

    const countMap = new Map<string, number>();
    for (const s of students) {
      countMap.set(s.class_id, (countMap.get(s.class_id) || 0) + 1);
    }

    setClasses(clsList);
    setStudentCounts(countMap);

    // If currently viewing a class, refresh its students
    if (selectedClass) {
      const currentClassStudents = allStudents
        .filter(s => s.class_id === selectedClass.id && s.active !== false)
        .sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name));
      setClassStudents(currentClassStudents);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [selectedClass]);

  const handleOpenClassStudents = async (cls: ClassRoom) => {
    setSelectedClass(cls);
    setSearchQuery('');
    const allStudents = await db.students.toArray();
    const currentClassStudents = allStudents
      .filter(s => s.class_id === cls.id && s.active !== false)
      .sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name));
    setClassStudents(currentClassStudents);
  };

  const handleOpenAddClass = () => {
    setEditingClass(null);
    setName('');
    setLevel('Primaire');
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassRoom) => {
    setEditingClass(cls);
    setName(cls.name);
    setLevel(cls.level);
    setIsClassModalOpen(true);
  };

  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const now = new Date().toISOString();
    const settings = await db.settings.toCollection().first();
    const schoolId = settings?.school_id || 'school-default-01';

    if (editingClass) {
      await db.classes.update(editingClass.id, {
        name: name.trim(),
        level: level,
        updated_at: now
      });
      await addToSyncQueue('classes', 'update', editingClass.id, {
        ...editingClass,
        name: name.trim(),
        level: level
      });
    } else {
      const newClass: ClassRoom = {
        id: `cls-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        school_id: schoolId,
        name: name.trim(),
        level: level,
        active: true,
        created_at: now,
        updated_at: now
      };
      await db.classes.add(newClass);
      await addToSyncQueue('classes', 'create', newClass.id, newClass);
    }

    setIsClassModalOpen(false);
    loadClasses();
  };

  // Filter students in current class
  const filteredStudents = classStudents.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = `${s.first_name} ${s.last_name}`.toLowerCase().includes(q);
    const matchParent = (s.parent_name || '').toLowerCase().includes(q);
    return matchName || matchParent;
  });

  // Calculate stats for selected class
  const totalBalance = classStudents.reduce((acc, s) => acc + (s.balance > 0 ? s.balance : 0), 0);
  const totalDebt = classStudents.reduce((acc, s) => acc + (s.balance < 0 ? Math.abs(s.balance) : 0), 0);

  // -------------------------------------------------------------
  // VIEW 2: STUDENTS IN SELECTED CLASS
  // -------------------------------------------------------------
  if (selectedClass) {
    return (
      <div className="space-y-6 pb-20 animate-fadeIn">
        {/* Navigation back and header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedClass(null)}
              className="bg-white"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Retour aux classes
            </Button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-emerald-600" />
                Classe : {selectedClass.name}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Niveau : <strong>{selectedClass.level}</strong> &bull; {classStudents.length} élève(s) inscrit(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={() => setIsAddStudentModalOpen(true)}
              className="font-bold shadow-md shadow-emerald-700/20"
            >
              + Ajouter un élève
            </Button>
          </div>
        </div>

        {/* Mini KPI banner for this class */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-white border-slate-200">
            <span className="text-xs uppercase font-bold text-slate-400 block">Effectif Actif</span>
            <p className="text-2xl font-black text-slate-800 mt-1">{classStudents.length} élèves</p>
          </Card>
          <Card className="p-4 bg-emerald-50/50 border-emerald-200">
            <span className="text-xs uppercase font-bold text-emerald-800 block">Soldes Prépayés Cumulés</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">{formatFCFA(totalBalance)}</p>
          </Card>
          <Card className="p-4 bg-rose-50/50 border-rose-200">
            <span className="text-xs uppercase font-bold text-rose-800 block">Dettes / Impayés de la classe</span>
            <p className="text-2xl font-black text-rose-600 mt-1">{formatFCFA(totalDebt)}</p>
          </Card>
        </div>

        {/* Search input in this class */}
        <Card className="p-3.5 bg-white border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={`Rechercher un élève en ${selectedClass.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </Card>

        {/* Students Table */}
        <Card className="overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Élève</th>
                  <th className="py-3.5 px-4">Parent / Tuteur</th>
                  <th className="py-3.5 px-4">Téléphone</th>
                  <th className="py-3.5 px-4 text-right">Solde Cantine</th>
                  <th className="py-3.5 px-4 text-center">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
                      <p className="text-sm font-semibold text-slate-700">
                        {searchQuery ? "Aucun élève ne correspond à votre recherche." : `Aucun élève inscrit en ${selectedClass.name}.`}
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<UserPlus className="w-4 h-4" />}
                        className="mt-4 font-bold"
                        onClick={() => setIsAddStudentModalOpen(true)}
                      >
                        Inscrire le premier élève en {selectedClass.name}
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-emerald-50/30 transition-colors cursor-pointer group"
                      onClick={() => onSelectStudent && onSelectStudent(student.id)}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <span className="group-hover:text-emerald-700 transition-colors">
                          {student.last_name} {student.first_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        {student.parent_name || 'Non renseigné'}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {student.parent_phone ? (
                          <a
                            href={`tel:${student.parent_phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-medium"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            {student.parent_phone}
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold whitespace-nowrap">
                        <span
                          className={`text-sm ${
                            student.balance > 0
                              ? 'text-emerald-700'
                              : student.balance < 0
                              ? 'text-rose-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {formatFCFA(student.balance)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={student.active ? 'success' : 'neutral'}>
                          {student.active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {onOpenDepositForStudent && (
                            <button
                              onClick={() => onOpenDepositForStudent(student.id)}
                              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-semibold flex items-center gap-1"
                              title="Créditer le compte"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">+ Dépôt</span>
                            </button>
                          )}
                          {onSelectStudent && (
                            <button
                              onClick={() => onSelectStudent(student.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              title="Voir fiche complète"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal to add student into this specific class */}
        <StudentFormModal
          isOpen={isAddStudentModalOpen}
          onClose={() => setIsAddStudentModalOpen(false)}
          preselectedClassId={selectedClass.id}
          onSaved={loadClasses}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 1: ALL CLASSES GRID
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-600" />
            Gestion des Classes
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cliquez sur une classe pour consulter ses élèves ou en inscrire de nouveaux
          </p>
        </div>

        <Button
          variant="primary"
          icon={<PlusCircle className="w-4 h-4" />}
          onClick={handleOpenAddClass}
          className="font-bold shadow-md shadow-emerald-700/20"
        >
          Ajouter une classe
        </Button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {classes.map((cls) => {
          const count = studentCounts.get(cls.id) || 0;
          return (
            <Card
              key={cls.id}
              onClick={() => handleOpenClassStudents(cls)}
              className="p-5 border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden"
            >
              {/* Top Row with icon and edit */}
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditClass(cls);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Modifier le nom de la classe"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Class Name & Level */}
              <h4 className="text-xl font-black text-slate-900 mt-3 group-hover:text-emerald-700 transition-colors">
                {cls.name}
              </h4>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">{cls.level}</p>

              {/* Enrollment & Action hint */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Effectif actif :
                </span>
                <span className="font-extrabold text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded-lg group-hover:bg-emerald-100 group-hover:text-emerald-800 transition-colors">
                  {count} élève(s)
                </span>
              </div>

              {/* Bottom hover affordance banner */}
              <div className="mt-3 text-[11px] font-bold text-emerald-600 flex items-center justify-between opacity-80 group-hover:opacity-100">
                <span>Voir les élèves &bull; Inscrire</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Class Modal */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title={editingClass ? "Modifier la classe" : "Ajouter une classe"}
      >
        <form onSubmit={handleSubmitClass} className="space-y-4">
          <Input
            label="Nom de la classe *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: CP1 ou Section 1"
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Niveau d'enseignement *
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="Maternelle">Maternelle</option>
              <option value="Primaire">Primaire</option>
              <option value="Collège">Collège</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsClassModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary">
              {editingClass ? "Enregistrer" : "Créer la classe"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
