import React from 'react';

export const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  count,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 ${className}`}>
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-600">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-slate-900 tracking-tight">
            {title}
          </h2>
          {count !== undefined && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100/80 text-blue-800 border border-blue-200">
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 font-sans">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
