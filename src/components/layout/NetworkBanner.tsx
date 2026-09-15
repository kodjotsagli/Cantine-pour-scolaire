import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const NetworkBanner: React.FC = () => {
  const { isOnline, pendingCount, isSyncing, lastSyncResult, triggerSync } = useNetworkStatus();

  if (isOnline && pendingCount === 0 && !isSyncing && !lastSyncResult) {
    return null;
  }

  return (
    <div className="w-full transition-all">
      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
            <span>
              <strong>Mode hors ligne actif :</strong> Vous êtes déconnecté d'Internet. Toutes vos opérations sont enregistrées en sécurité sur cet appareil et seront synchronisées automatiquement au retour du réseau.
            </span>
          </div>
          {pendingCount > 0 && (
            <span className="shrink-0 ml-2 px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full font-bold text-xs">
              {pendingCount} en attente
            </span>
          )}
        </div>
      )}

      {isOnline && pendingCount > 0 && (
        <div className="bg-sky-50 border-b border-sky-200 text-sky-900 px-4 py-2 text-xs sm:text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              Connexion rétablie — <strong>{pendingCount} modification(s)</strong> prêtes à être envoyées vers le serveur.
            </span>
          </div>
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
          </button>
        </div>
      )}

      {lastSyncResult && isOnline && pendingCount === 0 && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 px-4 py-1.5 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{lastSyncResult.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
