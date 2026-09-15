import React from 'react';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Users, 
  Wallet, 
  BarChart3, 
  Settings as SettingsIcon 
} from 'lucide-react';
import type { NavItem } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

interface MobileNavProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab }) => {
  const { canViewReports, canManageSettings } = useAuth();

  const items = [
    { id: 'dashboard' as NavItem, label: 'Accueil', icon: LayoutDashboard },
    { id: 'pointage' as NavItem, label: 'Pointage', icon: UtensilsCrossed, primary: true },
    { id: 'students' as NavItem, label: 'Élèves', icon: Users },
    { id: 'deposits' as NavItem, label: 'Dépôts', icon: Wallet },
    ...(canViewReports ? [{ id: 'reports' as NavItem, label: 'Rapports', icon: BarChart3 }] : []),
    ...(canManageSettings ? [{ id: 'settings' as NavItem, label: 'Paramètres', icon: SettingsIcon }] : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        
        if (item.primary) {
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className="flex flex-col items-center justify-center -mt-5"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                isActive ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-emerald-500 text-white'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-emerald-700' : 'text-slate-600'}`}>
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors ${
              isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
