import React, { useState, useEffect } from 'react';
import { db } from '../db';
import type { Student, ClassRoom } from '../types';
import { getStudentById, getStudentTransactions, StudentTransaction, deleteOrDeactivateStudent } from '../services/studentService';
import { formatFCFA, formatSignedFCFA } from '../utils/currency';
import { formatDateShort } from '../utils/dates';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  ArrowLeft, 
  Wallet, 
  Phone, 
  User, 
  GraduationCap, 
  PlusCircle, 
  Edit, 
  Trash2, 
  History,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { StudentFormModal } from '../components/students/StudentFormModal';

interface StudentDetailPageProps {
  studentId: string;
  onBack: () => void;
  onOpenDepositForStudent: (studentId: string) => void;
}

export const StudentDetailPage: React.FC<StudentDetailPageProps> = ({
  studentId,
  onBack,
  onOpenDepositForStudent
}) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [classroom, setClassroom] = useState<ClassRoom | null>(null);
  const [transactions, setTransactions] = useState<StudentTransaction[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadStudentData = async () => {
    const s = await getStudentById(studentId);
    if (s) {
      setStudent(s);
      const cls = await db.classes.get(s.class_id);
      if (cls) setClassroom(cls);

      const history = await getStudentTransactions(s.id);
      setTransactions(history);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const handleDeleteOrDeactivate = async () => {
    if (!student) return;

    if (confirm(`Voulez-vous vraiment supprimer ou désactiver l'élève ${student.first_name} ${student.last_name} ?`)) {
      const res = await deleteOrDeactivateStudent(student.id);
      setNotification({ type: 'success', text: res.message });
      await loadStudentData();
      setTimeout(() => {
        if (!res.deactivated) {
          onBack();
        }
      }, 2000);
    }
  };

  if (!student) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Chargement des informations de l'élève...</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la liste
        </Button>
      </div>
    );
  }

  const isPositive = student.balance >= 0;

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Top back & actions bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Retour aux élèves
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => setIsEditModalOpen(true)}
          >
            Modifier
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:bg-rose-50"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={handleDeleteOrDeactivate}
          >
            {student.active ? 'Désactiver' : 'Supprimer'}
          </Button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-sm border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Profile & Big Balance Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <Card className="p-6 lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900">
                  {student.last_name} {student.first_name}
                </h2>
                <Badge variant={student.active ? 'success' : 'neutral'}>
                  {student.active ? 'Actif' : 'Désactivé'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                Classe : <strong>{classroom?.name || 'Inconnue'}</strong> ({classroom?.level})
              </p>
            </div>

            <Button
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 font-bold"
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={() => onOpenDepositForStudent(student.id)}
            >
              Nouveau Dépôt Parent
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                Parent / Tuteur
              </span>
              <p className="font-bold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                {student.parent_name || 'Non renseigné'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                Téléphone de contact
              </span>
              <p className="font-bold text-slate-800 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                {student.parent_phone ? (
                  <a href={`tel:${student.parent_phone}`} className="text-emerald-700 hover:underline">
                    {student.parent_phone}
                  </a>
                ) : (
                  'Non renseigné'
                )}
              </p>
            </div>
          </div>
        </Card>

        {/* Big Balance Box */}
        <Card className={`p-6 flex flex-col justify-between border-2 ${
          isPositive ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                Situation Comptable
              </span>
              <Badge variant={isPositive ? 'success' : 'danger'}>
                {isPositive ? 'Crédit Prépayé' : 'Dette en Cours'}
              </Badge>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              {isPositive ? 'Solde disponible pour les repas :' : 'Montant total dû à la cantine :'}
            </p>

            <h3 className={`text-3xl sm:text-4xl font-black mt-2 tracking-tight ${
              isPositive ? 'text-emerald-700' : 'text-rose-600'
            }`}>
              {formatFCFA(Math.abs(student.balance))}
            </h3>

            {isPositive ? (
              <p className="text-xs text-emerald-800 font-medium mt-2">
                Équivalent à environ <strong>{Math.floor(student.balance / 400)} repas</strong> d'avance.
              </p>
            ) : (
              <p className="text-xs text-rose-700 font-medium mt-2">
                Dette équivalente à <strong>{Math.ceil(Math.abs(student.balance) / 400)} repas</strong> non réglés.
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 bg-white"
            onClick={() => onOpenDepositForStudent(student.id)}
          >
            Créditer le compte
          </Button>
        </Card>
      </div>

      {/* Complete Transaction History */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-base">Historique des Opérations & Repas</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {transactions.length} opération(s) enregistrée(s)
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Aucun repas ou dépôt enregistré pour cet élève.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Opération</th>
                  <th className="py-3 px-4">Mode / Réf</th>
                  <th className="py-3 px-4 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isDeposit = tx.type === 'deposit';
                  const isMealCancelled = tx.status === 'cancelled';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                        {formatDateShort(tx.date)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {tx.label}
                        {tx.note && <p className="text-[11px] text-slate-400 font-normal">{tx.note}</p>}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {isDeposit ? (
                          <Badge variant="info">{tx.reference || 'Recharge'}</Badge>
                        ) : (
                          <Badge variant={tx.paymentMethod === 'prepaid' ? 'success' : tx.paymentMethod === 'credit' ? 'danger' : 'neutral'}>
                            {tx.paymentMethod === 'prepaid' ? 'Solde' : tx.paymentMethod === 'credit' ? 'Crédit' : 'Espèces'}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                        <span className={isDeposit ? 'text-emerald-700' : isMealCancelled ? 'text-slate-400 line-through' : 'text-slate-900'}>
                          {formatSignedFCFA(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Student Modal */}
      <StudentFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        studentToEdit={student}
        onSaved={loadStudentData}
      />
    </div>
  );
};
