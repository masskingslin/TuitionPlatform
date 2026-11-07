import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { ParentNavScreen, ChildProfile, FeeRecord } from '../../types';
import { UpiQrPaymentModal } from '../payment/UpiQrPaymentModal';
import { ChildProgressReportModal } from './ChildProgressReportModal';
import { GlobalSearchBar, SearchCategory } from '../common/GlobalSearchBar';
import { KeyboardShortcutsModal } from '../common/KeyboardShortcutsModal';
import { useGlobalKeyboardShortcuts } from '../../hooks/useGlobalKeyboardShortcuts';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  CreditCard,
  User,
  ArrowRightLeft,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  MessageSquareQuote,
  Building2,
  Award,
  Calendar,
  GraduationCap,
  LogOut,
  Keyboard
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

export const ParentAppRoot: React.FC = () => {
  const {
    setRole,
    currentParent,
    linkedChildren,
    activeChildId,
    setActiveChildId,
    linkChildWithCode,
    unlinkChild,
    schoolInfo,
    attendanceRecords,
    assignments,
    submissions,
    testResults,
    feeRecords,
    batches,
    payFee,
    logout
  } = useTuition();

  const [selectedScreen, setSelectedScreen] = useState<ParentNavScreen>('OVERVIEW');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCodeInput, setLinkCodeInput] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);
  const [payingFee, setPayingFee] = useState<FeeRecord | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState<ChildProfile | null>(null);
  const [showProgressReport, setShowProgressReport] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Active child profile
  const activeChild = linkedChildren.find((c) => c.id === activeChildId) || linkedChildren[0] || {
    id: 's1',
    fullName: 'Aravind Kumar',
    grade: 'Grade 10',
    section: 'State Board Batch A',
    schoolName: schoolInfo.name
  };

  // Strictly filter data for the active child
  const childAttendance = attendanceRecords.filter((r) => r.studentId === activeChild.id);
  const presentCount = childAttendance.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const attendanceRate = childAttendance.length > 0
    ? Math.round((presentCount / childAttendance.length) * 100)
    : 92;

  const childFees = feeRecords.filter((f) => f.studentId === activeChild.id);
  const totalFeeDue = childFees.reduce((acc, curr) => acc + curr.amountDue, 0);
  const totalFeePaid = childFees.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalFeePending = totalFeeDue - totalFeePaid;
  const overdueCount = childFees.filter((f) => f.status === 'OVERDUE').length;

  // Strictly scope assignments to the active child's own submissions
  const childSubmissions = submissions.filter((s) => s.studentId === activeChild.id);
  const childAssignments = assignments.map((a) => {
    const sub = childSubmissions.find((s) => s.assignmentId === a.id);
    if (sub) {
      return {
        ...a,
        isSubmitted: true,
        scoreEarned: sub.scoreEarned,
        teacherFeedback: sub.teacherFeedback,
        submissionDate: sub.submittedAt,
        answerSheetFile: sub.answerSheetFile,
        answerSheetSize: sub.answerSheetSize,
        answerSheetUrl: sub.answerSheetUrl
      };
    }
    return {
      ...a,
      isSubmitted: false,
      scoreEarned: null,
      teacherFeedback: undefined,
      submissionDate: undefined
    };
  });
  const submittedCount = childAssignments.filter((a) => a.isSubmitted).length;

  // Strictly filter test results for this child
  const childTests = testResults.filter((t) => t.studentId === activeChild.id);
  const averageTestScore = childTests.length > 0
    ? Math.round(
        (childTests.reduce((acc, t) => acc + (t.marksScored / t.maxMarks), 0) / childTests.length) * 100
      )
    : 92;

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);
    const res = await linkChildWithCode(linkCodeInput);
    if (res.success) {
      setLinkSuccess(res.message);
      setLinkCodeInput('');
      setTimeout(() => {
        setLinkSuccess(null);
        setShowLinkModal(false);
      }, 1500);
    } else {
      setLinkError(res.message);
    }
  };

  const navItems = [
    { key: 'OVERVIEW' as ParentNavScreen, label: 'Overview', icon: LayoutDashboard },
    { key: 'ATTENDANCE' as ParentNavScreen, label: 'Attendance', icon: CheckSquare },
    { key: 'HOMEWORK' as ParentNavScreen, label: 'Homework', icon: FileText },
    { key: 'TESTS' as ParentNavScreen, label: 'Tests', icon: GraduationCap },
    { key: 'FEES' as ParentNavScreen, label: 'Fees', icon: CreditCard },
    { key: 'ACCOUNT' as ParentNavScreen, label: 'Account', icon: User }
  ];

  // Enable global keyboard shortcuts for power users (Ctrl+K, Alt+1..6, ?)
  useGlobalKeyboardShortcuts({
    onOpenHelp: () => setShowShortcuts((prev) => !prev),
    onSelectTab: (index) => {
      if (index >= 0 && index < navItems.length) {
        setSelectedScreen(navItems[index].key);
      }
    },
    maxTabs: navItems.length
  });

  const handleSearchSelect = (category: SearchCategory) => {
    if (category === 'STUDENT') setSelectedScreen('OVERVIEW');
    else if (category === 'BATCH') setSelectedScreen('OVERVIEW');
    else if (category === 'ASSIGNMENT') setSelectedScreen('HOMEWORK');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* TopAppBar with Parent Theme Color: Indigo/Slate #3949AB */}
      <header className="bg-[#3949AB] dark:bg-slate-900 text-white shadow-md sticky top-0 z-40 border-b border-transparent dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">Parent Portal</h1>
            <span className="text-xs bg-white/20 text-white font-medium px-2 py-0.5 rounded-full hidden md:inline-block">
              {schoolInfo.name}
            </span>
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-xs sm:max-w-sm mx-1 sm:mx-2">
            <GlobalSearchBar
              onSelectResult={handleSearchSelect}
              onOpenShortcuts={() => setShowShortcuts(true)}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Keyboard Shortcuts Cheat Sheet Button */}
            <button
              onClick={() => setShowShortcuts(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold rounded-lg border border-white/20 transition-colors cursor-pointer"
              title="Keyboard Shortcuts (?)"
              aria-label="View keyboard shortcuts"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Shortcuts</span>
            </button>
            {/* Child Selector Dropdown */}
            {linkedChildren.length > 0 && (
              <div className="relative">
                <select
                  value={activeChild.id}
                  onChange={(e) => setActiveChildId(e.target.value)}
                  className="bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/20 focus:outline-hidden appearance-none pr-7 cursor-pointer"
                >
                  {linkedChildren.map((child) => (
                    <option key={child.id} value={child.id} className="text-slate-900 font-medium">
                      Student: {child.fullName} ({child.grade})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-white/80 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            )}

            {/* Role switch button to switch to Student or Teacher */}
            <button
              onClick={() => setRole('STUDENT')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold rounded-lg border border-white/20 transition-colors cursor-pointer"
              title="Switch to Student App"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Student View</span>
            </button>

            {/* Sign Out Button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 hover:text-white text-xs font-semibold rounded-lg border border-rose-400/30 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-28">
        {/* Child Header Profile Banner */}
        <div className="bg-gradient-to-r from-[#3949AB] via-[#283593] to-slate-800 text-white rounded-2xl p-6 shadow-md border border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-indigo-200 font-semibold">
                  Linked Student Progress
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.2 rounded font-medium">
                  Verified Parent Access
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{activeChild.fullName}</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-100">
                <span>{activeChild.grade} · {activeChild.section}</span>
                <span aria-hidden="true">·</span>
                <span>{schoolInfo.name}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">Guardian: {currentParent.fullName}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setShowProgressReport(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white text-slate-900 font-bold text-xs rounded-xl shadow-xs hover:bg-indigo-50 active:scale-[0.98] transition-all cursor-pointer border border-white/40 shrink-0"
                title="Generate verified academic progress report"
              >
                <Award className="w-4 h-4 text-indigo-700" />
                <span>View Progress Report</span>
              </button>

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20">
                <div>
                  <span className="text-[11px] text-indigo-200 block font-medium">30d Attendance</span>
                  <span className="text-lg font-bold font-mono tabular-nums">{attendanceRate}%</span>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div>
                  <span className="text-[11px] text-indigo-200 block font-medium">Pending Fees</span>
                  <span className="text-lg font-bold font-mono tabular-nums">
                    ₹{totalFeePending.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TAB 1: OVERVIEW ================= */}
        {selectedScreen === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* Headline Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Attendance Record</span>
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 font-mono">{attendanceRate}%</span>
                  <span className="text-xs text-slate-500 font-medium">({presentCount} classes)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedScreen('ATTENDANCE')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                >
                  <span>Attendance Log</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Homework Tasks</span>
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 font-mono">{submittedCount}/{childAssignments.length}</span>
                  <span className="text-xs text-slate-500 font-medium">Submitted</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedScreen('HOMEWORK')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                >
                  <span>Homework & Tasks</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Unit Tests & Marks</span>
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 font-mono">{averageTestScore}%</span>
                  <span className="text-xs text-slate-500 font-medium">({childTests.length} tests taken)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedScreen('TESTS')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                >
                  <span>View Test Scores</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Tuition Fees</span>
                  <CreditCard className="w-4 h-4 text-teal-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 font-mono">₹{totalFeePaid.toLocaleString()}</span>
                  <span className="text-xs text-slate-500 font-medium">of ₹{totalFeeDue.toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedScreen('FEES')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                >
                  <span>Invoices & Pay</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>

            {/* Overdue Fee Warning Card if any */}
            {overdueCount > 0 && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-rose-900 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Notice:</strong> {overdueCount} invoice is marked overdue for payment.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedScreen('FEES')}
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 cursor-pointer shrink-0"
                >
                  Pay Overdue Fee
                </button>
              </div>
            )}

            {/* Progress Report Feature Card */}
            <div className="p-5 bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Award className="w-5 h-5 text-indigo-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">Academic Progress Report Dossier</h4>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 px-1.5 py-0.2 rounded">
                      Comprehensive
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    View verified subject-wise syllabus coverage, cumulative test averages, assignment ledger, and official instructor remarks for {activeChild.fullName}.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowProgressReport(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Generate & Inspect Report</span>
              </button>
            </div>

            {/* Enrolled Batches Overview */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Enrolled Coaching Batches</h3>
                  <p className="text-xs text-slate-500">Academic classes and subject teachers attended by {activeChild.fullName}</p>
                </div>
                <span className="text-xs text-slate-500 font-mono font-medium">{batches.length} Classes</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {batches.map((batch) => (
                  <div key={batch.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          {batch.subject}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{batch.title}</h4>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{batch.roomOrMeetingLink}</span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Teacher: {batch.teacherName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{batch.scheduleTime} ({batch.days.join(', ')})</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex justify-between text-[11px] text-slate-500">
                      <span>Curriculum: {batch.nextTopic}</span>
                      <span className="font-mono font-bold text-slate-700">{batch.syllabusProgress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: ATTENDANCE ================= */}
        {selectedScreen === 'ATTENDANCE' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Class Attendance Log</h3>
                <p className="text-xs text-slate-500">Complete attendance record for {activeChild.fullName}</p>
              </div>
              <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 self-start sm:self-center">
                Overall Rate: {attendanceRate}% Present
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Date</th>
                    <th className="py-2.5 px-3 text-left">Class / Subject</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-left">Faculty Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {childAttendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-800">{rec.date}</td>
                      <td className="py-2.5 px-3 text-slate-700">Grade 10 Mathematics</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : rec.status === 'ABSENT'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : rec.status === 'LATE'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 italic">{rec.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: HOMEWORK & GRADES ================= */}
        {selectedScreen === 'HOMEWORK' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Homework Tasks & Faculty Evaluations</h3>
                <p className="text-xs text-slate-500">Track assignment submissions, awarded marks, and teacher remarks</p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setShowProgressReport(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Report Dossier</span>
                </button>
                <span className="text-xs font-mono text-slate-500 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  {submittedCount} / {childAssignments.length} Submitted
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {childAssignments.map((task) => (
                <div key={task.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {task.subject || 'Homework'}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>Due: {task.dueDate}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">Max Marks: {task.maxScore}</span>
                      </div>
                    </div>

                    <div className="self-start sm:self-center">
                      {task.isSubmitted ? (
                        task.scoreEarned != null ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Graded: {task.scoreEarned} / {task.maxScore}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Submitted — Waiting for Grade</span>
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Not Submitted Yet</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {task.description}
                  </p>

                  {task.teacherFeedback && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-950 flex items-start gap-2">
                      <MessageSquareQuote className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-emerald-900 mb-0.5">Teacher Remark:</span>
                        <p>{task.teacherFeedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: TESTS & ASSESSMENTS ================= */}
        {selectedScreen === 'TESTS' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Unit Tests & Assessment Ledger</h3>
                <p className="text-xs text-slate-500">Official scored assessments and percentile rankings for {activeChild.fullName}</p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setShowProgressReport(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Full Progress Dossier</span>
                </button>
                <span className="text-xs font-mono text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold">
                  Average: {averageTestScore}%
                </span>
              </div>
            </div>

            {childTests.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
                <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No unit test marks logged yet for this child.</p>
                <p className="text-[11px] text-slate-400">Tests entered by teachers in Firestore will appear here automatically.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {childTests.map((test) => {
                  const pct = Math.round((test.marksScored / test.maxMarks) * 100);
                  return (
                    <div
                      key={test.id}
                      className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {test.subject}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base">{test.testTitle}</h4>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{test.date}</span>
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>Highest in Batch: <strong className="font-mono text-slate-800">{test.highestBatchMarks}/{test.maxMarks}</strong></span>
                            <span aria-hidden="true">·</span>
                            <span>Percentile: <strong className="font-mono text-indigo-700">{test.percentile}%ile</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900 font-mono">
                              {test.marksScored} / {test.maxMarks}
                            </div>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                pct >= 85
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : pct >= 70
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {pct}% Scored
                            </span>
                          </div>
                        </div>
                      </div>

                      {test.remarks && (
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 flex items-start gap-2">
                          <MessageSquareQuote className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block text-slate-900 mb-0.5">Faculty Evaluation Note:</span>
                            <p>{test.remarks}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: FEES & PAYMENTS ================= */}
        {selectedScreen === 'FEES' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Tuition Fees & Online Invoices</h3>
                <p className="text-xs text-slate-500">Pay coaching fees online via UPI, QR code, or Cards</p>
              </div>

              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium self-start sm:self-center">
                <span>Total Due: <strong className="text-slate-900 font-mono">₹{totalFeeDue.toLocaleString()}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Paid: <strong className="text-emerald-700 font-mono">₹{totalFeePaid.toLocaleString()}</strong></span>
              </div>
            </div>

            <div className="space-y-3">
              {childFees.map((fee) => (
                <div
                  key={fee.invoiceId}
                  className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{fee.monthYear}</h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          fee.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : fee.status === 'OVERDUE'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {fee.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Due Date: {fee.dueDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>Paid: <strong className="font-mono text-slate-700">₹{fee.amountPaid}</strong> of <strong className="font-mono text-slate-700">₹{fee.amountDue}</strong></span>
                      {fee.paymentMethod && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-indigo-700 font-medium">Via {fee.paymentMethod}</span>
                        </>
                      )}
                      {(fee.utrNumber || fee.manualPaymentUtr) && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-700 font-medium font-mono">UTR: {fee.utrNumber || fee.manualPaymentUtr}</span>
                        </>
                      )}
                    </div>

                    {fee.manualPaymentClaimed && fee.status !== 'PAID' && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center gap-2 mt-2">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          Manual UPI claim submitted (Ref/UTR: <strong className="font-mono">{fee.manualPaymentUtr || 'Pending'}</strong>). Awaiting teacher approval.
                        </span>
                      </div>
                    )}
                  </div>

                  {fee.status !== 'PAID' ? (
                    <button
                      type="button"
                      onClick={() => setPayingFee(fee)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-center shrink-0"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Fee (₹{fee.amountDue - fee.amountPaid})</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 self-start sm:self-center">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Settled</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: ACCOUNT & LINKED CHILDREN ================= */}
        {selectedScreen === 'ACCOUNT' && (
          <div className="space-y-5">
            {/* Parent Details Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-slate-900 text-base">Parent Account Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block mb-0.5">Parent Full Name</span>
                  <span className="font-bold text-slate-900 text-sm">{currentParent.fullName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block mb-0.5">Email Address</span>
                  <span className="font-bold text-slate-900 text-sm font-mono">{currentParent.email}</span>
                </div>
              </div>
            </div>

            {/* Linked Children Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Your Linked Children</h3>
                  <p className="text-xs text-slate-500">Students linked to your parent portal access</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLinkModal(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Link Another Child</span>
                </button>
              </div>

              <div className="space-y-3">
                {linkedChildren.map((child) => (
                  <div
                    key={child.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                      activeChild.id === child.id ? 'border-indigo-400 bg-indigo-50/40' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{child.fullName}</span>
                        {activeChild.id === child.id && (
                          <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded">
                            Active View
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {child.grade} · {child.section} · {child.schoolName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeChild.id !== child.id && (
                        <button
                          type="button"
                          onClick={() => setActiveChildId(child.id)}
                          className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                        >
                          Select
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setConfirmUnlink(child)}
                        className="text-xs font-semibold text-rose-600 hover:underline px-2 py-1 cursor-pointer"
                      >
                        Unlink
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* School & Server Info */}
            <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>Institute: <strong>{schoolInfo.name}</strong></span>
              </div>
              <span className="font-mono text-slate-400">Server: TuitionPlatform Cloud API</span>
            </div>
          </div>
        )}
      </main>

      {/* Link Child Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
                  Parent Access Link
                </span>
                <h3 className="text-lg font-bold text-slate-900">Link a Child's Account</h3>
                <p className="text-xs text-slate-500">
                  Enter the 6-character code created on your child's student app (valid 48 hours).
                </p>
              </div>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLinkChild} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Link Code</label>
                <input
                  type="text"
                  value={linkCodeInput}
                  onChange={(e) => setLinkCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g., P-94821"
                  required
                  className="w-full text-base font-mono font-bold tracking-widest uppercase border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 text-center text-slate-900 bg-slate-50"
                />
              </div>

              {linkError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                  {linkError}
                </div>
              )}

              {linkSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{linkSuccess}</span>
                </div>
              )}

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
                <span className="font-bold block">How to find this code:</span>
                <p>1. Open the Tuition app on your child's phone.</p>
                <p>2. In the Dashboard, look for "Parent Access & Link Code".</p>
                <p>3. Tap "Generate Code" and enter the 6-character code here.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
                >
                  Link Child
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unlink Child Confirmation Modal */}
      {confirmUnlink && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <h4 className="font-bold text-slate-900 text-base">Unlink {confirmUnlink.fullName}?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              You will stop seeing their attendance, homework and fees. Your child can generate a new code if you want to link again.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmUnlink(null)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  unlinkChild(confirmUnlink.id);
                  setConfirmUnlink(null);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
              >
                Confirm Unlink
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPI & QR Payment Modal for Fees */}
      {payingFee && (
        <UpiQrPaymentModal
          invoiceId={payingFee.invoiceId}
          studentName={activeChild.fullName}
          amount={payingFee.amountDue - payingFee.amountPaid}
          monthYear={payingFee.monthYear}
          onClose={() => setPayingFee(null)}
          onPaymentSuccess={(method, _utr, paymentId) => {
            if (paymentId) {
              payFee(payingFee.invoiceId, method, paymentId);
            }
            setPayingFee(null);
          }}
        />
      )}

      {/* Generated Student Academic Progress Report Modal */}
      {showProgressReport && (
        <ChildProgressReportModal
          child={activeChild}
          parentName={currentParent.fullName}
          parentEmail={currentParent.email}
          schoolName={schoolInfo.name}
          batches={batches}
          assignments={childAssignments}
          attendanceRecords={childAttendance}
          testResults={childTests}
          feeRecords={childFees}
          onClose={() => setShowProgressReport(false)}
        />
      )}

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Bottom NavigationBar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 shadow-lg">
        <div className="max-w-xl mx-auto grid grid-cols-6 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedScreen === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setSelectedScreen(item.key)}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 transition-colors cursor-pointer ${
                  isSelected ? 'text-[#3949AB]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div
                  className={`p-1 rounded-full transition-transform ${
                    isSelected ? 'bg-indigo-50 scale-105' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] ${isSelected ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
