import React from 'react';

export const FilterChips = ({
  options = [],
  selected,
  onChange,
  className = '',
  size = 'sm',
}) => {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none ${className}`}>
      {options.map((opt) => {
        const value = typeof opt === 'object' ? opt.value : opt;
        const label = typeof opt === 'object' ? opt.label : opt;
        const count = typeof opt === 'object' ? opt.count : undefined;
        const isSelected = selected === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`whitespace-nowrap rounded-xl font-mono text-xs font-bold transition-all duration-150 flex items-center gap-1.5 select-none ${
              size === 'sm' ? 'px-3 py-1.5' : 'px-3.5 py-2'
            } ${
              isSelected
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 border border-blue-600 scale-[1.02]'
                : 'bg-white hover:bg-blue-50/60 text-slate-600 hover:text-blue-700 border border-slate-200/90 shadow-xs'
            }`}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
