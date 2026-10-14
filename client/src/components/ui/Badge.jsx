import React from 'react';

export const Badge = ({
  children,
  variant = 'blue',
  size = 'sm',
  dot = false,
  className = '',
  ...props
}) => {
  const base = 'inline-flex items-center font-mono font-bold tracking-wide rounded-full border transition-colors select-none';

  const variants = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
    solidBlue: 'bg-blue-600 text-white border-blue-600 shadow-xs',
    midnight: 'bg-slate-900 text-blue-200 border-slate-800 shadow-xs',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    glass: 'bg-white/90 text-slate-800 border-slate-200/80 backdrop-blur-md shadow-xs',
  };

  const dotColors = {
    blue: 'bg-blue-600',
    solidBlue: 'bg-white',
    midnight: 'bg-blue-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    neutral: 'bg-slate-400',
    glass: 'bg-blue-600',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-1 text-[11px] gap-1.5',
    md: 'px-3 py-1.5 text-xs gap-1.5',
  };

  return (
    <span
      className={`${base} ${variants[variant] || variants.blue} ${sizes[size] || sizes.sm} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || 'bg-blue-600'} animate-pulse`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
