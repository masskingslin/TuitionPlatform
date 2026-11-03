import React, { useState } from 'react';
import { TeacherNavScreen } from '../../types';
import { TeacherBatchesScreen } from './TeacherBatchesScreen';
import { TeacherAttendanceScreen } from './TeacherAttendanceScreen';
import { TeacherAssignmentsScreen } from './TeacherAssignmentsScreen';
import { TeacherFeeTrackerScreen } from './TeacherFeeTrackerScreen';
import { TeacherDoubtsScreen } from './TeacherDoubtsScreen';
import { TeacherAnalyticsScreen } from './TeacherAnalyticsScreen';
import { SchoolManagementScreen } from './SchoolManagementScreen';
import { SharedResourcesScreen } from '../resources/SharedResourcesScreen';
import { DynamicScheduleCalendar } from '../calendar/DynamicScheduleCalendar';
import { ProfileModal } from '../common/ProfileModal';
import {
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
  TrendingUp
} from 'lucide-react';
import { useTuition } from '../../context/TuitionContext';

export const TeacherAppRoot: React.FC = () => {
  const [selectedScreen, setSelectedScreen] = useState<TeacherNavScreen>('BATCHES');
  const [showProfile, setShowProfile] = useState(false);
  const { setRole, currentTeacher, doubts, schoolInfo } = useTuition();

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
      case 'ANALYTICS':
        return 'Executive Analytics';
      case 'SCHOOL':
        return 'School Admin & Codes';
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
    { key: 'ANALYTICS' as TeacherNavScreen, label: 'Analytics', icon: TrendingUp },
    { key: 'SCHOOL' as TeacherNavScreen, label: 'School', icon: Building2 },
    { key: 'RESOURCES' as TeacherNavScreen, label: 'Materials', icon: FolderOpen },
    { key: 'DOUBTS' as TeacherNavScreen, label: `Doubts${pendingDoubtsCount > 0 ? ` (${pendingDoubtsCount})` : ''}`, icon: HelpCircle },
    { key: 'FEE_TRACKER' as TeacherNavScreen, label: 'Fees', icon: Receipt }
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col">
      {/* TopAppBar with Android Material3 Color: #00695C */}
      <header className="bg-[#00695C] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">{getScreenTitle()}</h1>
            <span className="text-xs bg-white/20 text-white font-medium px-2 py-0.5 rounded-full hidden sm:inline-block">
              {schoolInfo.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfile(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs text-teal-100 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-white/20 transition-all mr-1 font-medium cursor-pointer"
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold rounded-lg border border-white/20 transition-colors cursor-pointer"
              title="Switch to Student App"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Student View</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {selectedScreen === 'BATCHES' && <TeacherBatchesScreen onNavigate={setSelectedScreen} />}
        {selectedScreen === 'CALENDAR' && <DynamicScheduleCalendar isTeacher={true} />}
        {selectedScreen === 'ATTENDANCE' && <TeacherAttendanceScreen />}
        {selectedScreen === 'HOMEWORK' && <TeacherAssignmentsScreen />}
        {selectedScreen === 'ANALYTICS' && <TeacherAnalyticsScreen />}
        {selectedScreen === 'SCHOOL' && <SchoolManagementScreen />}
        {selectedScreen === 'RESOURCES' && <SharedResourcesScreen isTeacher={true} />}
        {selectedScreen === 'DOUBTS' && <TeacherDoubtsScreen />}
        {selectedScreen === 'FEE_TRACKER' && <TeacherFeeTrackerScreen />}
      </main>

      {/* Faculty Profile Modal */}
      {showProfile && (
        <ProfileModal
          type="TEACHER"
          profile={currentTeacher}
          onClose={() => setShowProfile(false)}
        />
      )}

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
