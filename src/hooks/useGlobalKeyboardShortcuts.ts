import { useEffect } from 'react';

/**
 * Checks if the user is currently typing inside a form input, textarea, select, or contentEditable element.
 */
export function isEditingText(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  );
}

export interface GlobalShortcutsOptions {
  onOpenSearch?: () => void;
  onOpenHelp?: () => void;
  onSelectTab?: (index: number) => void;
  maxTabs?: number;
}

/**
 * Hook to provide global keyboard shortcuts for power users.
 * Supports:
 * - Ctrl+K / Cmd+K: Focus Global Search
 * - '/' (when not typing): Focus Global Search
 * - Alt + [1-9]: Instant tab / screen switching
 * - '?' or 'Shift + /' (when not typing): Toggle Keyboard Shortcuts Help
 */
export function useGlobalKeyboardShortcuts({
  onOpenSearch,
  onOpenHelp,
  onSelectTab,
  maxTabs = 9
}: GlobalShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl+K or Cmd+K: Always open and focus global search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch?.();
        return;
      }

      // 2. Alt + [1-9] screen switching (works anywhere)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= maxTabs) {
          e.preventDefault();
          onSelectTab?.(num - 1);
          return;
        }
      }

      // If user is editing text in an input or textarea, skip single-key triggers
      if (isEditingText(e.target)) {
        return;
      }

      // 3. Forward slash '/' to focus search
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onOpenSearch?.();
        return;
      }

      // 4. '?' or 'Shift + /' to toggle shortcuts help modal
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        onOpenHelp?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch, onOpenHelp, onSelectTab, maxTabs]);
}

export default useGlobalKeyboardShortcuts;
