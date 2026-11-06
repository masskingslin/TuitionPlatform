import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useBackendHealth } from '../../hooks/useBackendHealth';

export const BackendHealthBanner: React.FC = () => {
  const { isReachable, isChecking, refetch } = useBackendHealth();

  if (isReachable) return null;

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs font-medium text-amber-900 dark:text-amber-200 flex items-center justify-between transition-all">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          Backend server unreachable — Join codes &amp; parent linking temporarily unavailable. Cached Firestore data active.
        </span>
      </div>
      <button
        onClick={refetch}
        disabled={isChecking}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-50 shrink-0 text-xs font-semibold"
      >
        <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
        <span>{isChecking ? 'Retrying...' : 'Retry'}</span>
      </button>
    </div>
  );
};
