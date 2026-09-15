import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  UtensilsCrossed, 
  Wallet, 
  BarChart3, 
  Printer, 
  Settings as SettingsIcon,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  UserCheck,
  Cloud,
  LogOut,
  LogIn
} from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useAuth } from '../../hooks/useAuth';

export type NavItem = 
  | 'dashboard' 
  | 'students' 
  | 'classes' 
  | 'pointage' 
  | 'deposits' 
  | 'reports' 
  | 'print-export' 
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { isOnline, pendingCount, isSyncing, triggerSync } = useNetworkStatus();
  const { 
    role, 
    userName, 
    userEmail,
    schoolName,
    isCloudConnected,
    setIsLoginModalOpen,
    signOutUser,
    setRole, 
    canViewReports, 
    canManageSettings, 
    canManageClasses 
  } = useAuth();

  const menuItems = [
    { id: 'dashboard' as NavItem, label: 'Tableau de bord', icon: LayoutDashboard, visible: true },
    { id: 'pointage' as NavItem, label: 'Pointage du jour', icon: UtensilsCrossed, visible: true, highlight: true },
    { id: 'students' as NavItem, label: 'Élèves', icon: Users, visible: true },
    { id: 'classes' as NavItem, label: 'Classes', icon: GraduationCap, visible: canManageClasses },
    { id: 'deposits' as NavItem, label: 'Dépôts & Soldes', icon: Wallet, visible: true },
    { id: 'reports' as NavItem, label: 'Rapports & Stats', icon: BarChart3, visible: canViewReports },
    { id: 'print-export' as NavItem, label: 'Impression & Export', icon: Printer, visible: true },
    { id: 'settings' as NavItem, label: 'Paramètres', icon: SettingsIcon, visible: canManageSettings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/40">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <UtensilsCrossed className="w-5 h-5" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-sm text-white truncate tracking-tight" title={schoolName || 'Cantine Scolaire'}>
            {schoolName || 'Cantine Scolaire'}
          </h1>
          <p className="text-[11px] text-emerald-400 font-medium truncate">Offline-First PWA</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.filter(item => item.visible).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              } ${item.highlight && !isActive ? 'border border-emerald-500/20 bg-emerald-950/20 text-emerald-300' : ''}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
              {item.highlight && !isActive && (
                <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Role Switcher */}
      <div className="px-4 py-3 border-t border-slate-800/80 bg-slate-950/30">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            Rôle Actif
          </span>
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="w-full bg-slate-800 text-xs text-white border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
        >
          <option value="admin">Administrateur / Directeur</option>
          <option value="manager">Responsable Cantine</option>
          <option value="agent">Agent de Pointage</option>
        </select>
        <p className="text-[10px] text-slate-400 mt-1 truncate">{userName}</p>

        {/* Cloud Account Status / Login */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
          {userEmail ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {userName ? userName[0].toUpperCase() : 'U'}
                </div>
                <p className="text-[11px] text-slate-300 truncate max-w-[120px]" title={userEmail}>
                  {userEmail}
                </p>
              </div>
              <button
                onClick={() => signOutUser()}
                title="Se déconnecter du Cloud"
                className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-colors border border-slate-700"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Connexion Cloud</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync & Connectivity Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            {!isOnline ? (
              <>
                <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-semibold text-rose-300 truncate">Hors ligne</p>
                  <p className="text-[10px] text-slate-400">Stockage local actif</p>
                </div>
              </>
            ) : pendingCount > 0 ? (
              <>
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-semibold text-amber-300 truncate">{pendingCount} en attente</p>
                  <p className="text-[10px] text-slate-400">Prêt à synchroniser</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-semibold text-emerald-300 truncate">Synchronisé</p>
                  <p className="text-[10px] text-slate-400">Toutes données à jour</p>
                </div>
              </>
            )}
          </div>

          <button
            onClick={triggerSync}
            disabled={isSyncing || !isOnline}
            title={!isOnline ? "Connexion requise pour synchroniser" : "Lancer la synchronisation"}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-30"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>
    </aside>
  );
};
