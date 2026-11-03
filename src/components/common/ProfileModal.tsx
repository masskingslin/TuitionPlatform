import React from 'react';
import { StudentProfile, TeacherProfile } from '../../types';
import { User, Phone, CheckCircle2, QrCode, X } from 'lucide-react';

interface StudentProfileModalProps {
  type: 'STUDENT';
  profile: StudentProfile;
  onClose: () => void;
}

interface TeacherProfileModalProps {
  type: 'TEACHER';
  profile: TeacherProfile;
  onClose: () => void;
}

export type ProfileModalProps = StudentProfileModalProps | TeacherProfileModalProps;

export const ProfileModal: React.FC<ProfileModalProps> = (props) => {
  const { type, profile, onClose } = props;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Card Header with Role Colors */}
        <div
          className={`p-6 text-white relative ${
            type === 'STUDENT'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-700'
              : 'bg-gradient-to-r from-teal-700 to-emerald-800'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-2xl font-bold text-white shadow-inner">
              {profile.name.charAt(0)}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white/90">
                {type === 'STUDENT' ? 'Student Identity Card' : 'Faculty Faculty ID'}
              </span>
              <h3 className="text-xl font-bold tracking-tight mt-1">{profile.name}</h3>
              <p className="text-xs text-white/80">
                {type === 'STUDENT'
                  ? `${(profile as StudentProfile).grade} · ${(profile as StudentProfile).section}`
                  : (profile as TeacherProfile).email}
              </p>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-4 text-xs">
          {type === 'STUDENT' ? (
            <>
              {/* Enrollment & Center Identifiers */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Admission No</span>
                  <span className="font-mono font-bold text-slate-800">TP-2026-8891</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Academic Year</span>
                  <span className="font-semibold text-slate-800">2026–2027</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Attendance Standing</span>
                  <span className="font-mono font-bold text-[#2E7D32]">
                    {(profile as StudentProfile).overallAttendancePercent}% (Good)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Exam Hall Roll</span>
                  <span className="font-mono font-bold text-slate-800">#10A-01</span>
                </div>
              </div>

              {/* Guardian Contact */}
              <div className="space-y-1.5 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
                  Parent / Guardian Information
                </span>
                <div className="flex items-center justify-between text-slate-800">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">{(profile as StudentProfile).guardianName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-slate-600">
                    <Phone className="w-3 h-3 text-blue-600" />
                    <span>{(profile as StudentProfile).guardianPhone}</span>
                  </div>
                </div>
              </div>

              {/* Enrolled Subjects */}
              <div className="space-y-1.5">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
                  Enrolled Coaching Subjects
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(profile as StudentProfile).enrolledCourses.map((c, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-md font-semibold text-[11px]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* QR Gate Pass Simulation */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block text-xs">Institute Gate Pass QR</span>
                  <span className="text-[11px] text-slate-400">Scan at center biometric entry</span>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-slate-300">
                  <QrCode className="w-8 h-8 text-slate-800" />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Faculty Information */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Faculty ID</span>
                  <span className="font-mono font-bold text-slate-800">FAC-T01-MATH</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Department</span>
                  <span className="font-semibold text-slate-800">Pure Mathematics</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Direct Phone</span>
                  <span className="font-mono font-semibold text-slate-800">{(profile as TeacherProfile).phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Official Email</span>
                  <span className="font-mono text-[10px] text-slate-800 truncate block">
                    {(profile as TeacherProfile).email}
                  </span>
                </div>
              </div>

              {/* Assigned Batches */}
              <div className="space-y-1.5">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
                  Active Coaching Batches
                </span>
                <div className="space-y-1">
                  {(profile as TeacherProfile).assignedBatches.map((b, i) => (
                    <div
                      key={i}
                      className="p-2 bg-teal-50/60 border border-teal-200 rounded-lg text-teal-950 font-medium flex items-center justify-between"
                    >
                      <span>{b}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            Close Identity Card
          </button>
        </div>
      </div>
    </div>
  );
};
