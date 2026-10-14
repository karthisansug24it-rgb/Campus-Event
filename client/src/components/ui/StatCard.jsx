import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'blue',
  className = '',
}) => {
  const colorStyles = {
    blue: {
      bg: 'bg-white',
      border: 'border-slate-200 hover:border-blue-300',
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/80',
      valueColor: 'text-slate-900',
      accentColor: 'text-blue-700',
    },
    midnight: {
      bg: 'bg-slate-950 text-white',
      border: 'border-slate-800 hover:border-blue-500/40',
      iconBg: 'bg-blue-600/20 text-blue-300 border border-blue-500/30',
      valueColor: 'text-white',
      accentColor: 'text-blue-300',
    },
    emerald: {
      bg: 'bg-white',
      border: 'border-slate-200 hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/80',
      valueColor: 'text-slate-900',
      accentColor: 'text-emerald-700',
    },
    amber: {
      bg: 'bg-white',
      border: 'border-slate-200 hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/80',
      valueColor: 'text-slate-900',
      accentColor: 'text-amber-700',
    },
  };

  const scheme = colorStyles[colorScheme] || colorStyles.blue;

  return (
    <div
      className={`relative p-5 sm:p-6 rounded-3xl border shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 overflow-hidden group ${scheme.bg} ${scheme.border} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${scheme.valueColor}`}>
              {value}
            </h3>
            {trend && (
              <span className="text-[11px] font-mono font-bold text-emerald-600">
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs font-mono text-slate-500 pt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300 shadow-xs ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Subtle bottom accent line on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </div>
  );
};
