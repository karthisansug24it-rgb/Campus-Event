import React from 'react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon,
  title = 'No items found',
  description = 'There are no records matching your criteria.',
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) => {
  return (
    <div className={`text-center py-16 sm:py-20 px-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-bold font-display text-slate-800 mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAction}
          icon={actionIcon}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
