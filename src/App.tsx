import React from 'react';
import { TuitionProvider, useTuition } from './context/TuitionContext';
import { StudentAppRoot } from './components/student/StudentAppRoot';
import { TeacherAppRoot } from './components/teacher/TeacherAppRoot';
import { ParentAppRoot } from './components/parent/ParentAppRoot';
import { GraduationCap, Briefcase, Users } from 'lucide-react';

const TuitionAppContainer: React.FC = () => {
  const { role, setRole } = useTuition();

  return (
    <div className="relative min-h-screen">
      {/* Role Switcher Floating Pill for Desktop & Quick Toggling */}
      <div className="fixed top-20 right-4 z-50 hidden md:flex items-center gap-1 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md p-1 rounded-full text-xs font-semibold">
        <button
          onClick={() => setRole('STUDENT')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
            role === 'STUDENT'
              ? 'bg-[#1E88E5] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Student</span>
        </button>
        <button
          onClick={() => setRole('TEACHER')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
            role === 'TEACHER'
              ? 'bg-[#00695C] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Teacher</span>
        </button>
        <button
          onClick={() => setRole('PARENT')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
            role === 'PARENT'
              ? 'bg-[#3949AB] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Parent Portal</span>
        </button>
      </div>

      {/* Render Active App */}
      {role === 'STUDENT' && <StudentAppRoot />}
      {role === 'TEACHER' && <TeacherAppRoot />}
      {role === 'PARENT' && <ParentAppRoot />}
    </div>
  );
};

export function App() {
  return (
    <TuitionProvider>
      <TuitionAppContainer />
    </TuitionProvider>
  );
}

export default App;
