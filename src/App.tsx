import React, { Suspense, lazy } from 'react';
import { TuitionProvider, useTuition } from './context/TuitionContext';
import { School, Loader2, LogOut } from 'lucide-react';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import { BackendHealthBanner } from './components/common/BackendHealthBanner';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const StudentAppRoot = lazy(() =>
  import('./components/student/StudentAppRoot').then((m) => ({ default: m.StudentAppRoot }))
);
const TeacherAppRoot = lazy(() =>
  import('./components/teacher/TeacherAppRoot').then((m) => ({ default: m.TeacherAppRoot }))
);
const ParentAppRoot = lazy(() =>
  import('./components/parent/ParentAppRoot').then((m) => ({ default: m.ParentAppRoot }))
);
const AuthScreen = lazy(() =>
  import('./components/auth/AuthScreen').then((m) => ({ default: m.AuthScreen }))
);

const ScreenLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
    <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center mb-3">
      <School className="w-8 h-8 text-teal-400 animate-pulse" />
    </div>
    <div className="flex items-center gap-2 text-slate-300 text-xs font-medium">
      <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
      <span>Loading Module...</span>
    </div>
  </div>
);

const TuitionAppContainer: React.FC = () => {
  const { role, currentUser, userProfile, authLoading, logout } = useTuition();

  if (authLoading) {
    return <ScreenLoadingFallback />;
  }

  if (!currentUser) {
    return (
      <Suspense fallback={<ScreenLoadingFallback />}>
        <BackendHealthBanner />
        <AuthScreen />
        <OfflineIndicator />
      </Suspense>
    );
  }

  return (
    <div className="relative min-h-screen">
      <BackendHealthBanner />
      {/* Current Logged-in User Status & PWA Install floating bar */}
      <div className="fixed bottom-20 sm:bottom-4 right-4 z-50 flex items-center gap-2 bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-2 rounded-full shadow-xl border border-slate-700/80 text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-slate-200 truncate max-w-[120px] sm:max-w-[180px]">
          {userProfile?.fullName || currentUser.email}
        </span>
        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-700/80 text-teal-100">
          {role}
        </span>
        <PWAInstallButton />
        <button
          onClick={logout}
          className="ml-0.5 p-1 hover:bg-rose-500/20 hover:text-rose-300 rounded-full transition-colors text-slate-400 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>

      <OfflineIndicator />

      {/* Render Active App Root Lazy Loaded */}
      <Suspense fallback={<ScreenLoadingFallback />}>
        {role === 'STUDENT' && <StudentAppRoot />}
        {(role === 'TEACHER' || role === 'ADMIN') && <TeacherAppRoot />}
        {role === 'PARENT' && <ParentAppRoot />}
      </Suspense>
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <TuitionProvider>
        <TuitionAppContainer />
      </TuitionProvider>
    </ErrorBoundary>
  );
}

export default App;
