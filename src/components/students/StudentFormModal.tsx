import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { db } from '../../db';
import type { Student, ClassRoom } from '../../types';
import { createStudent, updateStudent } from '../../services/studentService';
import { getActiveClasses } from '../../services/classService';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
  preselectedClassId?: string | null;
  onSaved: () => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  studentToEdit,
  preselectedClassId,
  onSaved
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [classId, setClassId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    getActiveClasses().then((clsList) => {
      setClasses(clsList);
      if (studentToEdit) {
        setClassId(studentToEdit.class_id);
      } else if (preselectedClassId) {
        setClassId(preselectedClassId);
      } else if (clsList.length > 0 && !classId) {
        setClassId(clsList[0].id);
      }
    });

    if (studentToEdit) {
      setFirstName(studentToEdit.first_name);
      setLastName(studentToEdit.last_name);
      setClassId(studentToEdit.class_id);
      setParentName(studentToEdit.parent_name || '');
      setParentPhone(studentToEdit.parent_phone || '');
    } else {
      setFirstName('');
      setLastName('');
      setParentName('');
      setParentPhone('');
      if (preselectedClassId) {
        setClassId(preselectedClassId);
      }
      setError('');
    }
  }, [studentToEdit, isOpen, preselectedClassId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Le nom et le prénom sont obligatoires.');
      return;
    }
    if (!classId) {
      setError('Veuillez sélectionner une classe.');
      return;
    }

    setLoading(true);
    try {
      if (studentToEdit) {
        await updateStudent(studentToEdit.id, {
          first_name: firstName.trim(),
          last_name: lastName.trim().toUpperCase(),
          class_id: classId,
          parent_name: parentName.trim(),
          parent_phone: parentPhone.trim()
        });
      } else {
        const settings = await db.settings.toCollection().first();
        await createStudent({
          school_id: settings?.school_id || 'school-default-01',
          first_name: firstName.trim(),
          last_name: lastName.trim().toUpperCase(),
          class_id: classId,
          parent_name: parentName.trim(),
          parent_phone: parentPhone.trim(),
          balance: 0,
          active: true
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'enregistrement de l\'élève.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={studentToEdit ? "Modifier la fiche élève" : "Inscrire un nouvel élève"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-medium rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nom de famille *"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="ex: MENSAH"
            required
          />
          <Input
            label="Prénom(s) *"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="ex: Koffi"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Classe *
          </label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            required
          >
            {classes.length === 0 ? (
              <option value="">Chargement des classes...</option>
            ) : (
              classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.level})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Contact Parent ou Tuteur
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nom du parent"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="ex: Kokou Mensah"
            />
            <Input
              label="Téléphone"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              placeholder="ex: +228 90 12 34 56"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Enregistrement...' : studentToEdit ? 'Enregistrer modifications' : 'Inscrire l\'élève'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
