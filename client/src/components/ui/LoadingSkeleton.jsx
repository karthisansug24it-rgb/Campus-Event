import React from 'react';

export const EventCardSkeleton = () => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 space-y-4 shadow-sm animate-pulse">
      {/* Poster skeleton */}
      <div className="aspect-[16/10] bg-slate-100 rounded-2xl w-full" />
      <div className="space-y-2.5 px-1">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-100 rounded-lg w-20" />
          <div className="h-3 bg-slate-100 rounded-lg w-16" />
        </div>
        <div className="h-5 bg-slate-200 rounded-md w-4/5" />
        <div className="h-3 bg-slate-100 rounded-md w-full" />
        <div className="h-3 bg-slate-100 rounded-md w-2/3" />
      </div>
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between px-1">
        <div className="h-3 bg-slate-100 rounded w-24" />
        <div className="h-3 bg-slate-100 rounded w-16" />
      </div>
    </div>
  );
};

export const TableRowSkeleton = ({ columns = 5 }) => {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div className="h-4 bg-slate-100 rounded-md w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
};

export const LoadingSkeleton = ({ count = 6, type = 'card' }) => {
  if (type === 'row') {
    return (
      <tbody className="divide-y divide-slate-100">
        {Array.from({ length: count }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </tbody>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
};
