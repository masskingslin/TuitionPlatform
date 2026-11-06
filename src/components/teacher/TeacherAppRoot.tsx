import React, { useState, Suspense, lazy } from 'react';
import { TeacherNavScreen } from '../../types';
import { ProfileModal } from '../common/ProfileModal';
import { GlobalSearchBar, SearchCategory } from '../common/GlobalSearchBar';
import { KeyboardShortcutsModal } from '../common/KeyboardShortcutsModal';
import { useGlobalKeyboardShortcuts } from '../../hooks/useGlobalKeyboardShortcuts';
import {
  Loader2,
  BookOpen,
  CheckCircle,
  PlusSquare,
  Receipt,
  HelpCircle,
  ArrowRightLeft,
  UserCheck,
  FolderOpen,
  Calendar,
  Building2,
  TrendingUp,
  GraduationCap,
  LogOut,
  Keyboard
} from 'lucide-react';
import { useTuition } from '../../context/TuitionContext';

const TeacherBatchesScreen = lazy(() =>
  import('./TeacherBatchesScreen').then((m) => ({ default: m.TeacherBatchesScreen }))
);
const TeacherAttendanceScreen = lazy(() =>
  import('./TeacherAttendanceScreen').then((m) => ({ default: m.TeacherAttendanceScreen }))
);
const TeacherAssignmentsScreen = lazy(() =>
  import('./TeacherAssignmentsScreen').then((m) => ({ default: m.TeacherAssignmentsScreen }))
);
const TeacherFeeTrackerScreen = lazy(() =>
  import('./TeacherFeeTrackerScreen').then((m) => ({ default: m.TeacherFeeTrackerScreen }))
);
const TeacherDoubtsScreen = lazy(() =>
  import('./TeacherDoubtsScreen').then((m) => ({ default: m.TeacherDoubtsScreen }))
);
const TeacherAnalyticsScreen = lazy(() =>
  import('./TeacherAnalyticsScreen').then((m) => ({ default: m.TeacherAnalyticsScreen }))
);
const SchoolManagementScreen = lazy(() =>
  import('./SchoolManagementScreen').then((m) => ({ default: m.SchoolManagementScreen }))
);
const TeacherTestsScreen = lazy(() =>
  import('./TeacherTestsScreen').then((m) => ({ default: m.TeacherTestsScreen }))
);
const SharedResourcesScreen = lazy(() =>
  import('../resources/SharedResourcesScreen').then((m) => ({ default: m.SharedResourcesScreen }))
);
const DynamicScheduleCalendar = lazy(() =>
  import('../calendar/DynamicScheduleCalendar').then((m) => ({ default: m.DynamicScheduleCalendar }))
);

const ComponentLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-16 text-slate-500">
    <Loader2 className="w-6 h-6 animate-spin text-teal-700 mb-2" />
    <span className="text-xs font-medium">Loading View...</span>
  </div>
);

export const TeacherAppRoot: React.FC = () => {
  const [selectedScreen, setSelectedScreen] = useState<TeacherNavScreen>('BATCHES');
  const [showProfile, setShowProfile] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { setRole, currentTeacher, doubts, schoolInfo, logout, userProfile } = useTuition();

  const isAdmin = userProfile?.role === 'ADMIN';

  const getScreenTitle = () => {
    switch (selectedScreen) {
      case 'BATCHES':
        return 'Batches';
      case 'CALENDAR':
        return 'Dynamic Schedule & Room Allocation';
      case 'ATTENDANCE':
        return 'Mark Attendance';
      case 'HOMEWORK':
        return 'Assignments';
      case 'TESTS':
        return 'Assessments & Test Marks';
      case 'ANALYTICS':
        return 'Executive Analytics';
      case 'SCHOOL':
        return isAdmin ? 'Admin Dashboard & School Settings' : 'School Admin & Codes';
      case 'RESOURCES':
        return 'Shared Resources Desk';
      case 'DOUBTS':
        return 'Student Doubts';
      case 'FEE_TRACKER':
        return 'Fee Tracker';
    }
  };

  const pendingDoubtsCount = doubts.filter((d) => !d.isResolved).length;

  const navItems = [
    { key: 'BATCHES' as TeacherNavScreen, label: 'Batches', icon: BookOpen },
    { key: 'CALENDAR' as TeacherNavScreen, label: 'Schedule', icon: Calendar },
    { key: 'ATTENDANCE' as TeacherNavScreen, label: 'Attendance', icon: CheckCircle },
    { key: 'HOMEWORK' as TeacherNavScreen, label: 'Homework', icon: PlusSquare },
    { key: 'TESTS' as TeacherNavScreen, label: 'Tests', icon: GraduationCap },
    { key: 'ANALYTICS' as TeacherNavScreen, label: 'Analytics', icon: TrendingUp },
    { key: 'SCHOOL' as TeacherNavScreen, label: isAdmin ? 'Admin' : 'School', icon: Building2 },
    { key: 'RESOURCES' as TeacherNavScreen, label: 'Materials', icon: FolderOpen },
    { key: 'DOUBTS' as TeacherNavScreen, label: `Doubts${pendingDoubtsCount > 0 ? ` (${pendingDoubtsCount})` : ''}`, icon: HelpCircle },
    { key: 'FEE_TRACKER' as TeacherNavScreen, label: 'Fees', icon: Receipt }
  ];

  // Enable global keyboard shortcuts for power users (Ctrl+K, Alt+1..9, ?)
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
    if (category === 'STUDENT') setSelectedScreen('ATTENDANCE');
    else if (category === 'BATCH') setSelectedScreen('BATCHES');
    else if (category === 'ASSIGNMENT') setSelectedScreen('HOMEWORK');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col">
      {/* TopAppBar with Android Material3 Color: #00695C */}
      <header className="bg-[#00695C] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">{getScreenTitle()}</h1>
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

          <div className="flex items-center gap-1.5 shrink-0">
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

            <button
              onClick={() => setShowProfile(true)}
              className="hidden lg:flex items-center gap-1.5 text-xs text-teal-100 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-white/20 transition-all font-medium cursor-pointer"
              title="View Faculty Identity Card"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{currentTeacher.name}</span>
            </button>

            {/* Quick Switch to Parent or Student */}
            <button
              onClick={() => setRole('PARENT')}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-lg border border-white/20 transition-colors cursor-pointer"
              title="Switch to Parent Portal"
            >
              <span>Parent Portal</span>
            </button>

            {/* Role switch button to switch to Student View */}
            <button
              onClick={() => setRole('STUDENT')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold rounded-lg border border-white/20 transition-colors cursor-pointer"
              title="Switch to Student App"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Student View</span>
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

      {/* Main Content Area Lazy Loaded */}
      <main className="flex-1">
        <Suspense fallback={<ComponentLoader />}>
          {selectedScreen === 'BATCHES' && <TeacherBatchesScreen onNavigate={setSelectedScreen} />}
          {selectedScreen === 'CALENDAR' && <DynamicScheduleCalendar isTeacher={true} />}
          {selectedScreen === 'ATTENDANCE' && <TeacherAttendanceScreen />}
          {selectedScreen === 'HOMEWORK' && <TeacherAssignmentsScreen />}
          {selectedScreen === 'TESTS' && <TeacherTestsScreen />}
          {selectedScreen === 'ANALYTICS' && <TeacherAnalyticsScreen />}
          {selectedScreen === 'SCHOOL' && <SchoolManagementScreen />}
          {selectedScreen === 'RESOURCES' && <SharedResourcesScreen isTeacher={true} />}
          {selectedScreen === 'DOUBTS' && <TeacherDoubtsScreen />}
          {selectedScreen === 'FEE_TRACKER' && <TeacherFeeTrackerScreen />}
        </Suspense>
      </main>

      {/* Faculty Profile Modal */}
      {showProfile && (
        <ProfileModal
          type="TEACHER"
          profile={currentTeacher}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Bottom NavigationBar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-around h-16 px-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedScreen === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setSelectedScreen(item.key)}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 transition-colors cursor-pointer shrink-0 ${
                  isSelected ? 'text-[#00695C]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div
                  className={`p-1 rounded-full transition-transform ${
                    isSelected ? 'bg-teal-50 scale-105' : ''
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className={`text-[10px] ${isSelected ? 'font-bold' : 'font-medium'} truncate`}>
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
