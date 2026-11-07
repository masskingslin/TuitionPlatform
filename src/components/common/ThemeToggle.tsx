import React from 'react';
import { useTuition } from '../../context/TuitionContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTuition();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-teal-500 ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 shadow-xs'
          : 'bg-white/20 hover:bg-white/30 text-white border border-white/20 shadow-xs'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-300 shrink-0" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-100 shrink-0" />
      )}
      {showLabel && (
        <span className="whitespace-nowrap">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};
