import React, { useState, useEffect } from 'react';
import { db } from '../db';
import type { Settings } from '../types';
import { seedDemoData } from '../db/initialData';
import { formatFCFA } from '../utils/currency';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useAuth } from '../hooks/useAuth';
import { 
  getSupabaseConfig, 
  setSupabaseConfig, 
  testSupabaseConnection, 
  isSupabaseConfigured 
} from '../db/supabaseClient';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { downloadFile } from '../services/exportService';
import { 
  Settings as SettingsIcon, 
  School, 
  UtensilsCrossed, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Coins, 
  Wifi, 
  WifiOff, 
  Save,
  Cloud,
  Key,
  Globe,
  Database,
  Download,
  LogIn,
  LogOut,
  UserCheck
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [mealPrice, setMealPrice] = useState<number>(400);
  const [currency, setCurrency] = useState('FCFA');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Supabase Cloud Config State
  const [supabaseUrl, setSupabaseUrlState] = useState('');
  const [supabaseKey, setSupabaseKeyState] = useState('');
  const [testingCloud, setTestingCloud] = useState(false);
  const [cloudStatusMsg, setCloudStatusMsg] = useState<{ success: boolean; text: string } | null>(null);

  const { isOnline, pendingCount, isSyncing, triggerSync, lastSyncResult } = useNetworkStatus();
  const { userEmail, userName, signOutUser, setIsLoginModalOpen } = useAuth();

  useEffect(() => {
    const reloadSettings = () => {
      db.settings.toCollection().first().then((s) => {
        if (s) {
          setSettings(s);
          setSchoolName(s.school_name);
          setAddress(s.address);
          setPhone(s.phone);
          setMealPrice(s.meal_price);
          setCurrency(s.currency);
        }
      });
    };

    reloadSettings();
    window.addEventListener('school-changed', reloadSettings);

    const conf = getSupabaseConfig();
    setSupabaseUrlState(conf.url);
    setSupabaseKeyState(conf.key);

    return () => {
      window.removeEventListener('school-changed', reloadSettings);
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    await db.settings.update(settings.id!, {
      school_name: schoolName,
      address,
      phone,
      meal_price: Number(mealPrice),
      currency
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveCloudConfig = () => {
    setSupabaseConfig(supabaseUrl, supabaseKey);
    setCloudStatusMsg({ success: true, text: 'Paramètres Cloud enregistrés avec succès.' });
    setTimeout(() => setCloudStatusMsg(null), 3000);
  };

  const handleTestCloudConnection = async () => {
    // Save first then test
    setSupabaseConfig(supabaseUrl, supabaseKey);
    setTestingCloud(true);
    setCloudStatusMsg(null);
    try {
      const res = await testSupabaseConnection();
      setCloudStatusMsg({ success: res.success, text: res.message });
    } finally {
      setTestingCloud(false);
    }
  };

  const handleDownloadSchemaSql = async () => {
    try {
      const response = await fetch('/supabase_schema.sql');
      const text = await response.text();
      downloadFile(text, 'supabase_schema_cantine.sql', 'text/plain;charset=utf-8');
    } catch {
      alert("Le fichier supabase_schema.sql est disponible à la racine du projet.");
    }
  };

  const handleResetDemo = async () => {
    if (confirm("Voulez-vous charger l'ensemble des données de démonstration officielles (classes CP1 à CM2, élèves, repas, paiements, dépôts et impayés) ?")) {
      await seedDemoData(true);
      window.location.reload();
    }
  };

  const isCloudActive = isSupabaseConfigured();

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-emerald-600" />
          Paramètres Généraux & Cloud
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configuration de l'établissement, tarification cantine et synchronisation multi-appareils
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Paramètres de l'école mis à jour avec succès !</span>
        </div>
      )}

      {/* 1. School Information Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6 border-slate-200 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Identité de l'École</h3>
              <p className="text-xs text-slate-400">Ces informations figurent sur les reçus et feuilles imprimables</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Nom officiel de l'école"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="ex: École Primaire Publique La Référence"
                required
              />
            </div>

            <Input
              label="Adresse / Localisation"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ex: Lomé, Togo"
            />

            <Input
              label="Numéro de Téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="ex: +228 90 12 34 56"
            />
          </div>
        </Card>

        {/* 2. Canteen Pricing */}
        <Card className="p-6 border-slate-200 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Tarification de la Cantine</h3>
              <p className="text-xs text-slate-400">Prix unitaire du repas débité lors du pointage</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Prix par repas (FCFA) *"
              type="number"
              min="50"
              step="50"
              value={mealPrice}
              onChange={(e) => setMealPrice(Number(e.target.value))}
              icon={<Coins className="w-4 h-4" />}
              required
            />

            <Input
              label="Devise monétaire"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled
            />
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Valeur actuelle configurée : <strong>{formatFCFA(mealPrice)} / repas / élève</strong>.
          </p>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />} className="font-bold shadow-md">
              Enregistrer les informations de l'école
            </Button>
          </div>
        </Card>
      </form>

      {/* 3. CLOUD BACKEND & MULTI-DEVICE SECTION (SUPABASE) */}
      <Card className="p-6 border-slate-200 space-y-5 bg-gradient-to-b from-white to-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                Synchronisation Cloud & Multi-Appareils
                <Badge variant={isCloudActive ? 'success' : 'warning'}>
                  {isCloudActive ? 'Prêt pour le Cloud' : 'Mode Local Uniquement'}
                </Badge>
              </h3>
              <p className="text-xs text-slate-500">
                Reliez plusieurs téléphones, tablettes et ordinateurs à la même base de données en ligne
              </p>
            </div>
          </div>

          {/* User Account / Login pill */}
          <div className="flex items-center gap-2">
            {userEmail ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-900">{userEmail}</span>
                <button
                  onClick={signOutUser}
                  title="Se déconnecter"
                  className="text-slate-400 hover:text-rose-600 ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                icon={<LogIn className="w-4 h-4" />}
                onClick={() => setIsLoginModalOpen(true)}
              >
                Connexion Compte
              </Button>
            )}
          </div>
        </div>

        {cloudStatusMsg && (
          <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
            cloudStatusMsg.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {cloudStatusMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <WifiOff className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{cloudStatusMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <Input
            label="URL de votre projet Supabase"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrlState(e.target.value)}
            placeholder="ex: https://abcdefghijklm.supabase.co"
            icon={<Globe className="w-4 h-4" />}
          />

          <Input
            label="Clé API Publique (Anon Key)"
            type="password"
            value={supabaseKey}
            onChange={(e) => setSupabaseKeyState(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            icon={<Key className="w-4 h-4" />}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              icon={<Save className="w-4 h-4" />}
              onClick={handleSaveCloudConfig}
              className="font-bold"
            >
              Enregistrer les clés
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={testingCloud || !supabaseUrl}
              icon={<Wifi className={`w-4 h-4 ${testingCloud ? 'animate-pulse' : ''}`} />}
              onClick={handleTestCloudConnection}
            >
              {testingCloud ? 'Test en cours...' : 'Tester la connexion Cloud'}
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownloadSchemaSql}
            title="Télécharger le script SQL pour configurer Supabase"
          >
            Script SQL Supabase (.sql)
          </Button>
        </div>

        {/* 3 Steps Setup Tutorial */}
        <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200 text-xs text-slate-700 space-y-1.5">
          <p className="font-bold text-slate-900 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-sky-600" />
            Comment connecter votre base de données en 3 étapes simples :
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-600">
            <li>Créez un compte gratuit sur <strong>supabase.com</strong> et créez un projet (ex: <em>Cantine École</em>).</li>
            <li>Dans l'onglet <strong>SQL Editor</strong> de Supabase, collez et exécutez le script SQL fourni (bouton ci-dessus).</li>
            <li>Allez dans <strong>Project Settings &gt; API</strong>, copiez l'<strong>URL</strong> et la <strong>clé anon</strong>, puis collez-les dans les champs ci-dessus !</li>
          </ol>
        </div>
      </Card>

      {/* 4. Local Sync Queue & Connectivity */}
      <Card className="p-6 border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">État de la Synchronisation & File d'attente</h3>
              <p className="text-xs text-slate-400">Suivi des opérations effectuées hors ligne prêtes à être envoyées</p>
            </div>
          </div>

          <Badge variant={isOnline ? 'success' : 'danger'}>
            {isOnline ? 'Connecté à Internet' : 'Hors connexion'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold uppercase">Statut Réseau</span>
            <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-rose-600" />}
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold uppercase">Modifications locales en attente</span>
            <p className="text-sm font-bold text-slate-800 mt-1">
              {pendingCount} opération(s)
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Synchronisation</span>
              <p className="text-xs font-semibold text-slate-700 mt-1">
                {isSyncing ? 'En cours...' : 'Prête'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isSyncing || !isOnline}
              onClick={triggerSync}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
            >
              Synchroniser
            </Button>
          </div>
        </div>

        {lastSyncResult && (
          <p className="text-xs text-slate-500 italic">
            Dernier résultat : {lastSyncResult.message}
          </p>
        )}
      </Card>

      {/* 5. Demo Data Reset Card */}
      <Card className="p-6 border-slate-200 bg-emerald-50/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Jeu de Données de Démonstration (Togo)
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              Réinitialise la base avec 8 classes (Section 1 à CM2), ~15 élèves réalistes, historique de repas, paiements et quelques dettes pour tester immédiatement.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold"
            onClick={handleResetDemo}
          >
            Charger les données démo
          </Button>
        </div>
      </Card>
    </div>
  );
};
