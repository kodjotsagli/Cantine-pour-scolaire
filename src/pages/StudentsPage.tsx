import React, { useState, useEffect } from 'react';
import { db } from '../db';
import type { Student, ClassRoom } from '../types';
import { formatFCFA } from '../utils/currency';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  Users, 
  Search, 
  Filter, 
  PlusCircle, 
  ChevronRight, 
  ArrowUpDown, 
  Phone,
  Wallet,
  GraduationCap
} from 'lucide-react';
import { StudentFormModal } from '../components/students/StudentFormModal';

interface StudentsPageProps {
  onSelectStudent: (studentId: string) => void;
  onOpenDepositForStudent: (studentId: string) => void;
}

export const StudentsPage: React.FC<StudentsPageProps> = ({
  onSelectStudent,
  onOpenDepositForStudent
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [sortBy, setSortBy] = useState<'name' | 'balance_asc' | 'balance_desc'>('name');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const loadData = async () => {
    const [allStudents, allClasses] = await Promise.all([
      db.students.toArray(),
      db.classes.toArray()
    ]);
    setStudents(allStudents);
    setClasses(allClasses);
  };

  useEffect(() => {
    loadData();
  }, []);

  const classMap = new Map(classes.map(c => [c.id, c.name]));

  // Filtering & sorting
  const filtered = students.filter(s => {
    if (statusFilter === 'active' && !s.active) return false;
    if (statusFilter === 'inactive' && s.active) return false;
    if (selectedClassFilter !== 'all' && s.class_id !== selectedClassFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = `${s.first_name} ${s.last_name}`.toLowerCase().includes(q);
      const matchParent = (s.parent_name || '').toLowerCase().includes(q);
      const matchPhone = (s.parent_phone || '').toLowerCase().includes(q);
      return matchName || matchParent || matchPhone;
    }

    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'name') {
      return a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name);
    } else if (sortBy === 'balance_asc') {
      return a.balance - b.balance; // lowest first (debt first)
    } else {
      return b.balance - a.balance; // highest first
    }
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Gestion des Élèves
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Total : <strong>{students.length}</strong> élève(s) inscrit(s) dans l'école
          </p>
        </div>

        <Button
          variant="primary"
          icon={<PlusCircle className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
          className="font-bold shadow-md shadow-emerald-700/20"
        >
          Inscrire un Élève
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Recherche par nom, prénom, parent, téléphone..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClassFilter}
              onChange={(e) => { setSelectedClassFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 font-medium text-slate-700"
            >
              <option value="all">Toutes les classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
              ))}
            </select>
          </div>

          {/* Sort & Status */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
              className="w-1/2 px-2.5 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 text-slate-700 font-medium"
            >
              <option value="active">Actifs</option>
              <option value="inactive">Désactivés</option>
              <option value="all">Tous</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-1/2 px-2.5 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 text-slate-700 font-medium"
            >
              <option value="name">Tri: Nom A-Z</option>
              <option value="balance_asc">Tri: Dettes (Impayés)</option>
              <option value="balance_desc">Tri: Solde élevé</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Students Table */}
      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Élève</th>
                <th className="py-3.5 px-4">Classe</th>
                <th className="py-3.5 px-4">Parent / Contact</th>
                <th className="py-3.5 px-4 text-right">Solde Actuel</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Aucun élève ne correspond aux critères sélectionnés.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((student) => {
                  const isPositive = student.balance >= 0;
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-emerald-50/30 transition-colors cursor-pointer group"
                      onClick={() => onSelectStudent(student.id)}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <span className="text-slate-800 group-hover:text-emerald-700 transition-colors">
                          {student.last_name} {student.first_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                          {classMap.get(student.class_id) || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <p className="font-semibold text-slate-800">{student.parent_name || 'Non renseigné'}</p>
                        {student.parent_phone && (
                          <p className="text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" /> {student.parent_phone}
                          </p>
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenDepositForStudent(student.id)}
                            title="Recharger le solde"
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-semibold flex items-center gap-1"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">+ Dépôt</span>
                          </button>
                          <button
                            onClick={() => onSelectStudent(student.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Voir fiche complète"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
            <span className="text-slate-500">
              Page {page} sur {totalPages} ({filtered.length} élèves)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add Student Modal */}
      <StudentFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={loadData}
      />
    </div>
  );
};
