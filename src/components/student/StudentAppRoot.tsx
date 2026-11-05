import React, { useState, Suspense, lazy } from 'react';
import { StudentNavScreen } from '../../types';
import { NotificationCenterModal } from '../notifications/NotificationCenterModal';
import { ProfileModal } from '../common/ProfileModal';
import { GlobalSearchBar, SearchCategory } from '../common/GlobalSearchBar';
import {
  Loader2,
  LayoutDashboard,
  CheckSquare,
  FileText,
  CreditCard,
  Award,
  ArrowRightLeft,
  User,
  BookOpen,
  Bell,
  Calendar,
  LogOut
} from 'lucide-react';
import { useTuition } from '../../context/TuitionContext';

const StudentDashboardScreen = lazy(() =>
  import('./StudentDashboardScreen').then((m) => ({ default: m.StudentDashboardScreen }))
);
const StudentAttendanceScreen = lazy(() =>
  import('./StudentAttendanceScreen').then((m) => ({ default: m.StudentAttendanceScreen }))
);
const StudentAssignmentsScreen = lazy(() =>
  import('./StudentAssignmentsScreen').then((m) => ({ default: m.StudentAssignmentsScreen }))
);
const StudentFeeScreen = lazy(() =>
  import('./StudentFeeScreen').then((m) => ({ default: m.StudentFeeScreen }))
);
const StudentTestsScreen = lazy(() =>
  import('./StudentTestsScreen').then((m) => ({ default: m.StudentTestsScreen }))
);
const SharedResourcesScreen = lazy(() =>
  import('../resources/SharedResourcesScreen').then((m) => ({ default: m.SharedResourcesScreen }))
);
const DynamicScheduleCalendar = lazy(() =>
  import('../calendar/DynamicScheduleCalendar').then((m) => ({ default: m.DynamicScheduleCalendar }))
);

const ComponentLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-16 text-slate-500">
    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
    <span className="text-xs font-medium">Loading View...</span>
  </div>
);

export const StudentAppRoot: React.FC = () => {
  const [selectedScreen, setSelectedScreen] = useState<StudentNavScreen>('DASHBOARD');
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const {
    setRole,
    currentStudent,
    unreadNotificationsCount,
    latestNotificationToast,
    dismissToast,
    markNotificationAsRead,
    logout
  } = useTuition();

  const getScreenTitle = () => {
    switch (selectedScreen) {
      case 'DASHBOARD':
        return 'Dashboard';
      case 'CALENDAR':
        return 'Dynamic Schedule & Timetable';
      case 'ATTENDANCE':
        return 'Attendance';
      case 'ASSIGNMENTS':
        return 'Assignments';
      case 'RESOURCES':
        return 'Study Materials & Links';
      case 'FEES':
        return 'Fees';
      case 'TESTS':
        return 'Test Series';
    }
  };

  const navItems = [
    { key: 'DASHBOARD' as StudentNavScreen, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'CALENDAR' as StudentNavScreen, label: 'Schedule', icon: Calendar },
    { key: 'ASSIGNMENTS' as StudentNavScreen, label: 'Homework', icon: FileText },
    { key: 'RESOURCES' as StudentNavScreen, label: 'Materials', icon: BookOpen },
    { key: 'ATTENDANCE' as StudentNavScreen, label: 'Attendance', icon: CheckSquare },
    { key: 'TESTS' as StudentNavScreen, label: 'Tests', icon: Award },
    { key: 'FEES' as StudentNavScreen, label: 'Fees', icon: CreditCard }
  ];

  const handleSearchSelect = (category: SearchCategory) => {
    if (category === 'STUDENT') setSelectedScreen('ATTENDANCE');
    else if (category === 'BATCH') setSelectedScreen('RESOURCES');
    else if (category === 'ASSIGNMENT') setSelectedScreen('ASSIGNMENTS');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* TopAppBar with Android Material3 Color: #1E88E5 */}
      <header className="bg-[#1E88E5] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">{getScreenTitle()}</h1>
            <span className="text-xs bg-white/20 text-white font-medium px-2 py-0.5 rounded-full hidden md:inline-block">
              Student App
            </span>
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-xs sm:max-w-sm mx-1 sm:mx-2">
            <GlobalSearchBar onSelectResult={handleSearchSelect} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Notification Bell with Unread Badge */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title={`Notifications (${unreadNotificationsCount} unread)`}
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-2xs font-mono">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowProfile(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs text-blue-100 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-white/20 transition-all mr-1 font-medium cursor-pointer"
              title="View Digital Student ID Card"
            >
              <User className="w-3.5 h-3.5" />
              <span>{currentStudent.name}</span>
            </button>

            {/* Switch to Parent Portal */}
            <button
              onClick={() => setRole('PARENT')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold rounded-lg border border-white/20 transition-colors cursor-pointer"
              title="Switch to Parent Portal"
            >
              <span>Parent Portal</span>
            </button>

            {/* Role switch button to switch to Teacher Console */}
            <button
              onClick={() => setRole('TEACHER')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold rounded-lg border border-white/20 transition-colors cursor-pointer"
              title="Switch to Teacher Console"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Teacher Mode</span>
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

      {/* Floating In-App Toast Notification Banner */}
      {latestNotificationToast && (
        <div className="fixed top-20 right-4 sm:right-6 max-w-sm w-full z-50 bg-white rounded-2xl shadow-xl border border-blue-300 p-4 animate-in slide-in-from-top-3 duration-200 space-y-2">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700 shrink-0 mt-0.5 border border-blue-100">
                <Bell className="w-4 h-4" />
              </span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 uppercase tracking-wide">
                    {latestNotificationToast.type === 'HOMEWORK_POSTED' ? 'New Assignment' : 'Shared Resource'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Just now</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {latestNotificationToast.title}
                </h4>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  {latestNotificationToast.message}
                </p>
              </div>
            </div>
            <button
              onClick={dismissToast}
              className="text-slate-400 hover:text-slate-700 text-sm p-1 leading-none cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <span className="text-[11px] text-slate-400">By {latestNotificationToast.authorName}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={dismissToast}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-700 text-xs font-medium cursor-pointer"
              >
                Dismiss
              </button>
              {latestNotificationToast.actionScreen && (
                <button
                  onClick={() => {
                    markNotificationAsRead(latestNotificationToast.id);
                    setSelectedScreen(latestNotificationToast.actionScreen!);
                    dismissToast();
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Open</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area Lazy Loaded */}
      <main className="flex-1">
        <Suspense fallback={<ComponentLoader />}>
          {selectedScreen === 'DASHBOARD' && <StudentDashboardScreen onNavigate={setSelectedScreen} />}
          {selectedScreen === 'CALENDAR' && <DynamicScheduleCalendar isTeacher={false} />}
          {selectedScreen === 'ATTENDANCE' && <StudentAttendanceScreen />}
          {selectedScreen === 'ASSIGNMENTS' && <StudentAssignmentsScreen />}
          {selectedScreen === 'RESOURCES' && <SharedResourcesScreen isTeacher={false} />}
          {selectedScreen === 'TESTS' && <StudentTestsScreen />}
          {selectedScreen === 'FEES' && <StudentFeeScreen />}
        </Suspense>
      </main>

      {/* Student Notification Center Modal */}
      <NotificationCenterModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNavigate={setSelectedScreen}
      />

      {/* Digital Student ID Card Modal */}
      {showProfile && (
        <ProfileModal
          type="STUDENT"
          profile={currentStudent}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Bottom NavigationBar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 shadow-lg">
        <div className="max-w-xl mx-auto grid grid-cols-7 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedScreen === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setSelectedScreen(item.key)}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 transition-colors cursor-pointer ${
                  isSelected ? 'text-[#1E88E5]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div
                  className={`p-1 rounded-full transition-transform ${
                    isSelected ? 'bg-blue-50 scale-105' : ''
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
