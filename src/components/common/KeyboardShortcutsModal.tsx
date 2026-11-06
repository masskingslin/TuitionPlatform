import React, { useEffect } from 'react';
import { Keyboard, X, Command, CornerDownLeft } from 'lucide-react';

export interface ShortcutItem {
  keys: string[];
  description: string;
}

export interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups?: ShortcutGroup[];
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  groups
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const defaultGroups: ShortcutGroup[] = groups || [
    {
      title: 'Global Search & Navigation',
      shortcuts: [
        { keys: [modKey, 'K'], description: 'Open Global Search bar from anywhere' },
        { keys: ['/'], description: 'Focus search bar (when not typing)' },
        { keys: ['↓', '↑'], description: 'Navigate search results list' },
        { keys: ['Enter'], description: 'Select highlighted search result' },
        { keys: ['Esc'], description: 'Close search dropdown / dismiss modals' }
      ]
    },
    {
      title: 'Quick Screen Switching',
      shortcuts: [
        { keys: ['Alt', '1'], description: 'Go to 1st tab (e.g. Batches / Dashboard)' },
        { keys: ['Alt', '2'], description: 'Go to 2nd tab (e.g. Schedule)' },
        { keys: ['Alt', '3'], description: 'Go to 3rd tab (e.g. Attendance / Homework)' },
        { keys: ['Alt', '4'], description: 'Go to 4th tab (e.g. Homework / Materials)' },
        { keys: ['Alt', '5'], description: 'Go to 5th tab (e.g. Tests / Attendance)' },
        { keys: ['Alt', '6'], description: 'Go to 6th tab (e.g. Analytics / Fees)' }
      ]
    },
    {
      title: 'Help & Information',
      shortcuts: [
        { keys: ['?'], description: 'Open this keyboard shortcuts cheat-sheet' },
        { keys: ['Esc'], description: 'Close this dialog' }
      ]
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 id="shortcuts-dialog-title" className="text-base font-bold text-white">
                Keyboard Shortcuts
              </h3>
              <p className="text-xs text-slate-400">Power user navigation & fast-track hotkeys</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close shortcuts dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs divide-y divide-slate-100">
          {defaultGroups.map((group, groupIdx) => (
            <div key={group.title} className={groupIdx > 0 ? 'pt-5' : ''}>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5 text-teal-800">
                <span>{group.title}</span>
              </h4>
              <div className="space-y-2.5">
                {group.shortcuts.map((shortcut, idx) => (
                  <div
                    key={`${shortcut.description}-${idx}`}
                    className="flex items-center justify-between gap-4 py-1"
                  >
                    <span className="text-slate-600 font-medium">{shortcut.description}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {shortcut.keys.map((k, kIdx) => (
                        <React.Fragment key={`${k}-${kIdx}`}>
                          <kbd className="inline-flex items-center justify-center min-w-[24px] px-2 py-1 text-[11px] font-mono font-bold bg-slate-100 text-slate-800 rounded-md border border-slate-300 shadow-2xs">
                            {k === 'Enter' ? (
                              <span className="flex items-center gap-0.5">
                                <CornerDownLeft className="w-3 h-3" />
                                <span>Enter</span>
                              </span>
                            ) : k === 'Command' || k === '⌘' ? (
                              <span className="flex items-center gap-0.5">
                                <Command className="w-3 h-3" />
                              </span>
                            ) : (
                              k
                            )}
                          </kbd>
                          {kIdx < shortcut.keys.length - 1 && (
                            <span className="text-slate-400 font-bold text-[10px]">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>
            Press <kbd className="px-1.5 py-0.5 font-mono font-semibold bg-white border border-slate-200 rounded text-slate-700">Esc</kbd> to dismiss
          </span>
          <span className="text-slate-400">TuitionPlatform Power Shortcuts</span>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
