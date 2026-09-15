import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import type { ClassRoom } from '../types';
import { 
  exportStudentsCsv, 
  exportMealsCsv, 
  exportDepositsCsv, 
  exportUnpaidCsv, 
  exportFinancialReportCsv,
  exportJsonBackup,
  importJsonBackup
} from '../services/exportService';
import { getActiveClasses } from '../services/classService';
import { getTodayDateString } from '../utils/dates';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PrintableAttendanceSheet } from '../components/print/PrintableAttendanceSheet';
import { 
  Printer, 
  Download, 
  FileSpreadsheet, 
  Database, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  FileText,
  Users,
  UtensilsCrossed,
  Wallet
} from 'lucide-react';

export const PrintExportPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedClassForSheet, setSelectedClassForSheet] = useState<string>('');
  const [showSheetPreview, setShowSheetPreview] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getActiveClasses().then((cls) => {
      setClasses(cls);
      if (cls.length > 0) setSelectedClassForSheet(cls[0].id);
    });
  }, []);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Attention : Cette opération va écraser les données locales existantes par celles du fichier de sauvegarde. Voulez-vous continuer ?")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await importJsonBackup(content);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    };
    reader.readAsText(file);
  };

  if (showSheetPreview && selectedClassForSheet) {
    return (
      <PrintableAttendanceSheet
        classId={selectedClassForSheet}
        date={getTodayDateString()}
        onBack={() => setShowSheetPreview(false)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Printer className="w-6 h-6 text-emerald-600" />
          Impression, Exports & Sauvegardes
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Génération de documents imprimables A4, exports Microsoft Excel et sauvegarde complète des données
        </p>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-sm flex items-center gap-2 border ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid: 3 Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1: Printable Documents */}
        <Card className="p-6 space-y-4 border-slate-200">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Documents Imprimables</h3>
              <p className="text-xs text-slate-400">Formats A4 prêts pour l'impression</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Attendance Sheet */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Feuille de pointage de classe</span>
              <p className="text-[11px] text-slate-500">Format papier avec signatures et cases à cocher</p>
              
              <div className="flex items-center gap-2 pt-1">
                <select
                  value={selectedClassForSheet}
                  onChange={(e) => setSelectedClassForSheet(e.target.value)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setShowSheetPreview(true)}
                  className="shrink-0"
                >
                  Générer A4
                </Button>
              </div>
            </div>

            {/* Financial Report Print */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Rapport financier imprimable</span>
                <p className="text-[11px] text-slate-500">Synthèse budgétaire pour la direction</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
              >
                Imprimer
              </Button>
            </div>
          </div>
        </Card>

        {/* Section 2: Excel CSV Exports */}
        <Card className="p-6 space-y-4 border-slate-200 lg:col-span-2">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Exports Microsoft Excel (CSV)</h3>
              <p className="text-xs text-slate-400">Encodage UTF-8 BOM avec séparateur point-virgule compatible Excel</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => exportStudentsCsv()}
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-left transition-all flex items-start justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">Fichier des Élèves</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Liste complète, classes, parents et soldes</p>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
            </button>

            <button
              onClick={() => exportMealsCsv()}
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-left transition-all flex items-start justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">Historique des Repas</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Tous les repas pointés et modes de paiement</p>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
            </button>

            <button
              onClick={() => exportDepositsCsv()}
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-left transition-all flex items-start justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">Dépôts des Parents</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Toutes les recharges avec références de reçus</p>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
            </button>

            <button
              onClick={() => exportUnpaidCsv()}
              className="p-4 rounded-xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/30 text-left transition-all flex items-start justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-slate-800">Liste des Impayés</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Dettes à recouvrer avec contacts des parents</p>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-rose-600 shrink-0" />
            </button>
          </div>
        </Card>
      </div>

      {/* Section 3: Backup & Restore */}
      <Card className="p-6 border-slate-200">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-4">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Sauvegarde Locale & Restauration (Offline-First)</h3>
            <p className="text-xs text-slate-400">Exportez une archive complète pour sécuriser vos données sur clé USB ou disque externe</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase">Exporter une sauvegarde complète</h4>
              <p className="text-xs text-slate-500 mt-1">
                Génère un fichier JSON chiffré contenant tous les paramètres, classes, élèves, repas et dépôts.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4 font-bold"
              icon={<Download className="w-4 h-4" />}
              onClick={() => exportJsonBackup()}
            >
              Télécharger le fichier .JSON
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase">Restaurer des données</h4>
              <p className="text-xs text-amber-800 mt-1">
                Restaure votre base de données locale à partir d'un fichier de sauvegarde préalable.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-4 font-bold bg-white text-amber-900 border-amber-300 hover:bg-amber-100"
              icon={<Upload className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Sélectionner le fichier à restaurer
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
