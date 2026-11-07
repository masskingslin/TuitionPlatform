import React from 'react';

interface ListSkeletonProps {
  count?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-3 w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col gap-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4" />
        </div>
      ))}
    </div>
  );
};
