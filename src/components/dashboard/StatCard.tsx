import React from 'react';
import { Card } from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'emerald',
  onClick
}) => {
  const variantStyles = {
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-100 text-emerald-600'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
      iconBg: 'bg-amber-100 text-amber-600'
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-100',
      iconBg: 'bg-rose-100 text-rose-600'
    },
    sky: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-100',
      iconBg: 'bg-sky-100 text-sky-600'
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-100',
      iconBg: 'bg-indigo-100 text-indigo-600'
    }
  };

  const style = variantStyles[variant];

  return (
    <Card
      onClick={onClick}
      className={`p-5 relative overflow-hidden transition-all duration-200 border ${style.border} ${
        onClick ? 'hover:-translate-y-0.5 cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
          <h4 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h4>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};
