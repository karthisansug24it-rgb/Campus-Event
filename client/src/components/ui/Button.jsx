import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 border border-blue-600 hover:border-blue-700 hover:shadow-lg hover:shadow-blue-600/30',
    secondary: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 shadow-xs hover:border-blue-300',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-xs hover:text-slate-900',
    ghost: 'bg-transparent hover:bg-blue-50/70 text-slate-600 hover:text-blue-700',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 border border-rose-500',
    subtle: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60',
  };

  const sizes = {
    xs: 'px-2.5 py-1.5 text-[11px] rounded-lg gap-1.5 font-mono',
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-2 font-sans',
    md: 'px-4 py-2.5 text-xs sm:text-sm rounded-xl gap-2 font-sans',
    lg: 'px-5 py-3 text-sm sm:text-base rounded-2xl gap-2.5 font-sans',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
};

export const IconButton = ({
  icon: Icon,
  variant = 'outline',
  size = 'md',
  label,
  className = '',
  disabled = false,
  loading = false,
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl transition-all duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 active:scale-95';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20',
    secondary: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200',
    outline: 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800',
    danger: 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200',
  };

  const sizes = {
    xs: 'w-7 h-7 p-1',
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5',
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`${baseStyles} ${variants[variant] || variants.outline} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        Icon && <Icon className="w-4 h-4" />
      )}
    </button>
  );
};
