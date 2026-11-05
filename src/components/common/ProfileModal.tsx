import React, { useState } from 'react';
import { StudentProfile, TeacherProfile } from '../../types';
import { useTuition } from '../../context/TuitionContext';
import {
  User,
  Phone,
  CheckCircle2,
  QrCode,
  X,
  Lock,
  Edit3,
  CreditCard,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

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
  const { updateUserProfileData, updateUserPassword, userProfile, currentUser } = useTuition();

  const [activeTab, setActiveTab] = useState<'CARD' | 'EDIT' | 'PASSWORD'>('CARD');

  // Edit Profile form state
  const isStudent = type === 'STUDENT';
  const studentProf = isStudent ? (profile as StudentProfile) : null;
  const teacherProf = !isStudent ? (profile as TeacherProfile) : null;

  const [fullName, setFullName] = useState(userProfile?.fullName || profile.name);
  const [phoneNumber, setPhoneNumber] = useState(
    userProfile?.phone || (isStudent ? '' : teacherProf?.phone || '')
  );
  const [guardianName, setGuardianName] = useState(
    userProfile?.guardianName || (studentProf ? studentProf.guardianName : '')
  );
  const [guardianPhone, setGuardianPhone] = useState(
    userProfile?.guardianPhone || (studentProf ? studentProf.guardianPhone : '')
  );
  const [profileNotice, setProfileNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSavingProfile(true);
    setProfileNotice(null);
    try {
      const res = await updateUserProfileData({
        fullName: fullName.trim(),
        phone: phoneNumber.trim(),
        guardianName: isStudent ? guardianName.trim() : undefined,
        guardianPhone: isStudent ? guardianPhone.trim() : undefined
      });

      if (res.success) {
        setProfileNotice({ type: 'success', msg: 'Profile information updated successfully!' });
      } else {
        setProfileNotice({ type: 'error', msg: res.error || 'Failed to update profile.' });
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (newPassword.length < 6) {
      setPasswordNotice({ type: 'error', msg: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: 'error', msg: 'New password and confirm password do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await updateUserPassword(newPassword);
      if (res.success) {
        setPasswordNotice({ type: 'success', msg: 'Password successfully updated!' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordNotice({
          type: 'error',
          msg: res.error || 'Could not update password. Please log out and sign in again.'
        });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Card Header with Role Colors */}
        <div
          className={`p-5 text-white relative shrink-0 ${
            type === 'STUDENT'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-700'
              : 'bg-gradient-to-r from-teal-700 to-emerald-800'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-xl font-bold text-white shadow-inner">
              {(fullName || profile.name).charAt(0)}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white/90">
                {type === 'STUDENT' ? 'Student Identity & Profile' : 'Faculty Faculty ID'}
              </span>
              <h3 className="text-lg font-bold tracking-tight mt-0.5">{fullName || profile.name}</h3>
              <p className="text-xs text-white/80 font-mono">
                {currentUser?.email || (type === 'STUDENT' ? 'State Board Batch A' : 'teacher@apex.edu')}
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 mt-4 p-0.5 bg-black/20 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('CARD')}
              className={`flex-1 py-1.5 rounded-md transition-colors text-center cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'CARD' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-white/80 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Identity Card</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('EDIT')}
              className={`flex-1 py-1.5 rounded-md transition-colors text-center cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'EDIT' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-white/80 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PASSWORD')}
              className={`flex-1 py-1.5 rounded-md transition-colors text-center cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'PASSWORD' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-white/80 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Security</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* ================= TAB 1: IDENTITY CARD ================= */}
          {activeTab === 'CARD' && (
            <>
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
                        <span className="font-semibold">
                          {userProfile?.guardianName || (profile as StudentProfile).guardianName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-slate-600">
                        <Phone className="w-3 h-3 text-blue-600" />
                        <span>{userProfile?.guardianPhone || (profile as StudentProfile).guardianPhone}</span>
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

                  {/* QR Gate Pass */}
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
                      <span className="font-mono font-semibold text-slate-800">
                        {userProfile?.phone || (profile as TeacherProfile).phone}
                      </span>
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
            </>
          )}

          {/* ================= TAB 2: EDIT PROFILE ================= */}
          {activeTab === 'EDIT' && (
            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              {profileNotice && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    profileNotice.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  {profileNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{profileNotice.msg}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Direct Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 12345"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {isStudent && (
                <>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Guardian Details
                    </span>

                    <div className="space-y-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Parent / Guardian Name</label>
                        <input
                          type="text"
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Guardian Mobile (for SMS/WhatsApp Alerts)</label>
                        <input
                          type="text"
                          placeholder="+91 98765 43210"
                          value={guardianPhone}
                          onChange={(e) => setGuardianPhone(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2.5 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}

          {/* ================= TAB 3: CHANGE PASSWORD ================= */}
          {activeTab === 'PASSWORD' && (
            <form onSubmit={handleUpdatePassword} className="space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Update Account Credentials</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Change your password in Firebase Authentication. Make sure it is at least 6 characters.
                </p>
              </div>

              {passwordNotice && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    passwordNotice.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  {passwordNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{passwordNotice.msg}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border border-slate-300 rounded-lg p-2.5 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border border-slate-300 rounded-lg p-2.5 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
