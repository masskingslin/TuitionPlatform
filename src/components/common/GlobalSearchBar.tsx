import React, { useState, useRef, useEffect } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { Search, User, BookOpen, FileText, X, ChevronRight } from 'lucide-react';

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
  placeholder?: string;
  className?: string;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  onSelectResult,
  placeholder = 'Search students, batches, assignments...',
  className = ''
}) => {
  const { batches, assignments, attendanceRecords, feeRecords, linkedChildren } = useTuition();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Cmd/Ctrl + K or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Ensure default fallback students exist if search term matches
  if (!studentMap.has('s1')) {
    studentMap.set('s1', { id: 's1', fullName: 'Aravind Kumar', subtitle: 'Grade 10 · State Board' });
  }
  if (!studentMap.has('s2')) {
    studentMap.set('s2', { id: 's2', fullName: 'Sneha Sharma', subtitle: 'Grade 10 · CBSE Science' });
  }

  const allStudents = Array.from(studentMap.values());

  // Search Results computation
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

  const totalResults =
    matchingStudents.length + matchingBatches.length + matchingAssignments.length;

  const handleSelect = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');
    if (onSelectResult) {
      onSelectResult(item.category, item.rawItem);
    }
  };

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
          className="w-full bg-white/15 hover:bg-white/20 focus:bg-white focus:text-slate-900 text-white placeholder-white/70 text-xs font-medium pl-9 pr-16 py-2 rounded-xl border border-white/20 focus:border-transparent focus:outline-hidden focus:ring-2 focus:ring-teal-400 transition-all shadow-inner"
        />

        {query ? (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 p-1 text-white/70 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white/20 text-white/90 rounded border border-white/30 pointer-events-none">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Results Dropdown Menu */}
      {isOpen && trimmedQuery.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Search Results ({totalResults})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Press Esc to close</span>
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
                    {matchingStudents.map((item) => (
                      <button
                        key={`std-${item.id}`}
                        onClick={() => handleSelect(item)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-teal-700" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block group-hover:text-teal-800 transition-colors">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {item.subtitle}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Batches Category */}
                {matchingBatches.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      <span>Coaching Batches ({matchingBatches.length})</span>
                    </div>
                    {matchingBatches.map((item) => (
                      <button
                        key={`btc-${item.id}`}
                        onClick={() => handleSelect(item)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-indigo-700" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-800 transition-colors">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {item.subtitle}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Assignments Category */}
                {matchingAssignments.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span>Assignments & Tasks ({matchingAssignments.length})</span>
                    </div>
                    {matchingAssignments.map((item) => (
                      <button
                        key={`asg-${item.id}`}
                        onClick={() => handleSelect(item)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-blue-700" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-800 transition-colors">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {item.subtitle}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                      </button>
                    ))}
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
