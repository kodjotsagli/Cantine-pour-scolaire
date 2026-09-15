import React, { useEffect, useState } from 'react';
import { db } from '../../db';
import type { Settings } from '../../types';
import { formatDateLong, getTodayDateString } from '../../utils/dates';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { RefreshCw, Download, Sparkles, Cloud, User } from 'lucide-react';
import { seedDemoData } from '../../db/initialData';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onNavigateToPointage?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const { isOnline, pendingCount, isSyncing, triggerSync } = useNetworkStatus();
  const { userEmail, setIsLoginModalOpen, isCloudConnected, schoolName } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    db.settings.toCollection().first().then((s) => {
      if (s) setSettings(s);
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleReloadDemo = async () => {
    if (confirm('Voulez-vous charger/réinitialiser les données de démonstration complètes (classes, élèves, repas, dépôts) ?')) {
      await seedDemoData(true);
      window.location.reload();
    }
  };

  const todayStr = getTodayDateString();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-3 overflow-hidden">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">
            {schoolName || settings?.school_name || 'Cantine Scolaire'}
          </h2>
          <p className="text-xs text-slate-500 capitalize hidden sm:block">
            {formatDateLong(todayStr)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Demo Recharger */}
        <button
          onClick={handleReloadDemo}
          title="Charger les données de démonstration (Togo)"
          className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Données Démo</span>
        </button>

        {/* PWA Install Button if available */}
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Installer l'application</span>
          </button>
        )}

        {/* Cloud Multi-Device Account Button */}
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
            userEmail 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              : isCloudConnected
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
          title={userEmail ? `Connecté en tant que : ${userEmail}` : isCloudConnected ? "Se connecter pour synchroniser vos appareils" : "Configurer la synchronisation Cloud"}
        >
          {userEmail ? (
            <>
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline font-semibold max-w-[120px] truncate">{userEmail.split('@')[0]}</span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Sync Cloud</span>
            </>
          )}
        </button>

        {/* Compact Network / Sync Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              !isOnline ? 'bg-rose-500' : pendingCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <span className="font-medium text-slate-700 text-[11px] sm:text-xs">
            {!isOnline ? 'Hors ligne' : pendingCount > 0 ? `${pendingCount} en attente` : 'En ligne'}
          </span>
          {isOnline && (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="text-slate-400 hover:text-slate-700 disabled:opacity-40"
              title="Synchroniser"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
