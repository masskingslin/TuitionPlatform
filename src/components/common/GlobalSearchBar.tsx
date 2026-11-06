import React, { useState, useRef, useEffect } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { isEditingText } from '../../hooks/useGlobalKeyboardShortcuts';
import { Search, User, BookOpen, FileText, X, ChevronRight, CornerDownLeft, Keyboard } from 'lucide-react';

export type SearchCategory = 'STUDENT' | 'BATCH' | 'ASSIGNMENT';

export interface SearchResultItem {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle: string;
  badge: string;
  rawItem: any;
}

interface GlobalSearchBarProps {
  onSelectResult?: (category: SearchCategory, item: any) => void;
  onOpenShortcuts?: () => void;
  placeholder?: string;
  className?: string;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  onSelectResult,
  onOpenShortcuts,
  placeholder = 'Search students, batches, assignments...',
  className = ''
}) => {
  const { batches, assignments, attendanceRecords, feeRecords, linkedChildren } = useTuition();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKeyLabel = isMac ? '⌘K' : 'Ctrl+K';

  // Derive unique students list from all collections
  const studentMap = new Map<string, { id: string; fullName: string; subtitle: string }>();

  linkedChildren.forEach((child) => {
    studentMap.set(child.id, {
      id: child.id,
      fullName: child.fullName,
      subtitle: `${child.grade} · ${child.section || child.schoolName}`
    });
  });

  attendanceRecords.forEach((rec) => {
    if (rec.studentId && !studentMap.has(rec.studentId)) {
      studentMap.set(rec.studentId, {
        id: rec.studentId,
        fullName: rec.studentName,
        subtitle: `Logged in attendance sessions`
      });
    }
  });

  feeRecords.forEach((fee) => {
    if (fee.studentId && !studentMap.has(fee.studentId)) {
      studentMap.set(fee.studentId, {
        id: fee.studentId,
        fullName: fee.studentName,
        subtitle: `Fee Invoice: ${fee.monthYear}`
      });
    }
  });

  if (!studentMap.has('s1')) {
    studentMap.set('s1', { id: 's1', fullName: 'Aravind Kumar', subtitle: 'Grade 10 · State Board' });
  }
  if (!studentMap.has('s2')) {
    studentMap.set('s2', { id: 's2', fullName: 'Sneha Sharma', subtitle: 'Grade 10 · CBSE Science' });
  }

  const allStudents = Array.from(studentMap.values());
  const trimmedQuery = query.trim().toLowerCase();

  const matchingStudents: SearchResultItem[] = trimmedQuery
    ? allStudents
        .filter(
          (s) =>
            s.fullName.toLowerCase().includes(trimmedQuery) ||
            s.subtitle.toLowerCase().includes(trimmedQuery)
        )
        .map((s) => ({
          id: s.id,
          category: 'STUDENT',
          title: s.fullName,
          subtitle: s.subtitle,
          badge: 'Student',
          rawItem: s
        }))
    : [];

  const matchingBatches: SearchResultItem[] = trimmedQuery
    ? batches
        .filter(
          (b) =>
            b.title.toLowerCase().includes(trimmedQuery) ||
            b.subject.toLowerCase().includes(trimmedQuery) ||
            b.teacherName.toLowerCase().includes(trimmedQuery)
        )
        .map((b) => ({
          id: b.id,
          category: 'BATCH',
          title: b.title,
          subtitle: `${b.subject} · Teacher: ${b.teacherName} · ${b.activeStudentCount} Students`,
          badge: 'Batch',
          rawItem: b
        }))
    : [];

  const matchingAssignments: SearchResultItem[] = trimmedQuery
    ? assignments
        .filter(
          (a) =>
            a.title.toLowerCase().includes(trimmedQuery) ||
            (a.subject || '').toLowerCase().includes(trimmedQuery) ||
            a.description.toLowerCase().includes(trimmedQuery)
        )
        .map((a) => ({
          id: a.id,
          category: 'ASSIGNMENT',
          title: a.title,
          subtitle: `${a.subject || 'Homework'} · Due: ${a.dueDate} · MaxScore: ${a.maxScore}`,
          badge: 'Assignment',
          rawItem: a
        }))
    : [];

  const allResults: SearchResultItem[] = [
    ...matchingStudents,
    ...matchingBatches,
    ...matchingAssignments
  ];
  const totalResults = allResults.length;

  // Reset selected index when query or results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
    inputRef.current?.blur();
    if (onSelectResult) {
      onSelectResult(item.category, item.rawItem);
    }
  };

  // Keyboard shortcut listener (Ctrl+K, '/', Esc, ArrowUp, ArrowDown, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl+K or Cmd+K: Focus search input from anywhere
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
        return;
      }

      // 2. '/' shortcut when not editing text
      if (e.key === '/' && !isEditingText(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
        return;
      }

      // 3. Shortcuts active while search input is focused or search results dropdown is open
      const isSearchFocused = document.activeElement === inputRef.current;
      if (isOpen && (isSearchFocused || searchContainerRef.current?.contains(document.activeElement))) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          return;
        }

        if (allResults.length > 0) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % allResults.length);
            return;
          }

          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
            return;
          }

          if (e.key === 'Enter') {
            e.preventDefault();
            if (allResults[selectedIndex]) {
              handleSelect(allResults[selectedIndex]);
            }
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allResults, selectedIndex]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchContainerRef} className={`relative w-full max-w-md ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-white/70 absolute left-3 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          aria-label="Global search input"
          className="w-full bg-white/15 hover:bg-white/20 focus:bg-white focus:text-slate-900 text-white placeholder-white/70 text-xs font-medium pl-9 pr-20 py-2 rounded-xl border border-white/20 focus:border-transparent focus:outline-hidden focus:ring-2 focus:ring-teal-400 transition-all shadow-inner"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 text-white/70 hover:text-white rounded-full transition-colors cursor-pointer"
              title="Clear search"
              aria-label="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd
              onClick={() => {
                inputRef.current?.focus();
                setIsOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white/20 hover:bg-white/30 text-white rounded border border-white/30 cursor-pointer transition-colors shadow-2xs"
              title={`Press ${modKeyLabel} or / to search`}
            >
              {modKeyLabel}
            </kbd>
          )}

          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="hidden sm:inline-flex p-1 text-white/70 hover:text-white hover:bg-white/15 rounded-md transition-colors cursor-pointer"
              title="View Keyboard Shortcuts (?)"
              aria-label="Open keyboard shortcuts"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Results Dropdown Menu */}
      {isOpen && trimmedQuery.length > 0 && (
        <div
          ref={resultsContainerRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Bar with Shortcut Hints */}
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Search Results ({totalResults})
            </span>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span className="hidden sm:inline-flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-slate-200 text-slate-700 rounded font-bold">↑</kbd>
                <kbd className="px-1 py-0.5 bg-slate-200 text-slate-700 rounded font-bold">↓</kbd> navigate
              </span>
              <span className="hidden sm:inline-flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-slate-200 text-slate-700 rounded font-bold">↵</kbd> select
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-slate-200 text-slate-700 rounded font-bold">Esc</kbd> close
              </span>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {totalResults === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-1">
                <Search className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No matching records found</p>
                <p className="text-[11px] text-slate-400">
                  Try searching for student names, subject titles, or homework keywords.
                </p>
              </div>
            ) : (
              <>
                {/* Students Category */}
                {matchingStudents.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>Students ({matchingStudents.length})</span>
                    </div>
                    {matchingStudents.map((item) => {
                      const itemIndex = allResults.findIndex((r) => r.id === item.id && r.category === item.category);
                      const isHighlighted = itemIndex === selectedIndex;
                      return (
                        <button
                          key={`std-${item.id}`}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl transition-all text-left group cursor-pointer ${
                            isHighlighted
                              ? 'bg-teal-50/80 border border-teal-300 ring-1 ring-teal-400 shadow-2xs'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                                isHighlighted
                                  ? 'bg-teal-600 text-white border-teal-600'
                                  : 'bg-teal-50 border-teal-200 text-teal-700'
                              }`}
                            >
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <span
                                className={`text-xs font-bold block transition-colors ${
                                  isHighlighted ? 'text-teal-950 font-extrabold' : 'text-slate-900 group-hover:text-teal-800'
                                }`}
                              >
                                {item.title}
                              </span>
                              <span className="text-[11px] text-slate-500 block truncate">
                                {item.subtitle}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isHighlighted && (
                              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono font-bold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                                <CornerDownLeft className="w-2.5 h-2.5" />
                                <span>Select</span>
                              </span>
                            )}
                            <ChevronRight
                              className={`w-4 h-4 transition-colors ${
                                isHighlighted ? 'text-teal-700' : 'text-slate-300 group-hover:text-teal-600'
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Batches Category */}
                {matchingBatches.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      <span>Coaching Batches ({matchingBatches.length})</span>
                    </div>
                    {matchingBatches.map((item) => {
                      const itemIndex = allResults.findIndex((r) => r.id === item.id && r.category === item.category);
                      const isHighlighted = itemIndex === selectedIndex;
                      return (
                        <button
                          key={`btc-${item.id}`}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl transition-all text-left group cursor-pointer ${
                            isHighlighted
                              ? 'bg-indigo-50/80 border border-indigo-300 ring-1 ring-indigo-400 shadow-2xs'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                                isHighlighted
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              }`}
                            >
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <span
                                className={`text-xs font-bold block transition-colors ${
                                  isHighlighted ? 'text-indigo-950 font-extrabold' : 'text-slate-900 group-hover:text-indigo-800'
                                }`}
                              >
                                {item.title}
                              </span>
                              <span className="text-[11px] text-slate-500 block truncate">
                                {item.subtitle}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isHighlighted && (
                              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                                <CornerDownLeft className="w-2.5 h-2.5" />
                                <span>Select</span>
                              </span>
                            )}
                            <ChevronRight
                              className={`w-4 h-4 transition-colors ${
                                isHighlighted ? 'text-indigo-700' : 'text-slate-300 group-hover:text-indigo-600'
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Assignments Category */}
                {matchingAssignments.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span>Assignments & Tasks ({matchingAssignments.length})</span>
                    </div>
                    {matchingAssignments.map((item) => {
                      const itemIndex = allResults.findIndex((r) => r.id === item.id && r.category === item.category);
                      const isHighlighted = itemIndex === selectedIndex;
                      return (
                        <button
                          key={`asg-${item.id}`}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl transition-all text-left group cursor-pointer ${
                            isHighlighted
                              ? 'bg-blue-50/80 border border-blue-300 ring-1 ring-blue-400 shadow-2xs'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                                isHighlighted
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-blue-50 border-blue-200 text-blue-700'
                              }`}
                            >
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <span
                                className={`text-xs font-bold block transition-colors ${
                                  isHighlighted ? 'text-blue-950 font-extrabold' : 'text-slate-900 group-hover:text-blue-800'
                                }`}
                              >
                                {item.title}
                              </span>
                              <span className="text-[11px] text-slate-500 block truncate">
                                {item.subtitle}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isHighlighted && (
                              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                <CornerDownLeft className="w-2.5 h-2.5" />
                                <span>Select</span>
                              </span>
                            )}
                            <ChevronRight
                              className={`w-4 h-4 transition-colors ${
                                isHighlighted ? 'text-blue-700' : 'text-slate-300 group-hover:text-blue-600'
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;
