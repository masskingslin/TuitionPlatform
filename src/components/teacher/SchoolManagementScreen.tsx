import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import {
  Copy,
  Check,
  RefreshCw,
  Edit2,
  CheckCircle2,
  Search,
  UserCheck,
  GraduationCap
} from 'lucide-react';

export const SchoolManagementScreen: React.FC = () => {
  const { schoolInfo, updateSchoolName, regenerateSchoolCodes, schoolMembers } = useTuition();
  const [copiedStudent, setCopiedStudent] = useState(false);
  const [copiedTeacher, setCopiedTeacher] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [schoolNameInput, setSchoolNameInput] = useState(schoolInfo.name);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [searchMember, setSearchMember] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleCopyCode = (code: string, type: 'student' | 'teacher') => {
    navigator.clipboard?.writeText(code);
    if (type === 'student') {
      setCopiedStudent(true);
      setTimeout(() => setCopiedStudent(false), 2500);
    } else {
      setCopiedTeacher(true);
      setTimeout(() => setCopiedTeacher(false), 2500);
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolNameInput.trim()) return;
    updateSchoolName(schoolNameInput.trim());
    setIsEditingName(false);
    setActionNotice('School name successfully updated!');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleRegenerate = (which: 'student' | 'teacher' | 'both') => {
    if (window.confirm(`Generate a new ${which === 'both' ? 'set of codes' : `${which} code`}? The old code will stop working immediately.`)) {
      regenerateSchoolCodes(which);
      setActionNotice(`Rotated ${which} join code successfully.`);
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const filteredMembers = schoolMembers.filter((m) => {
    if (selectedRoleFilter !== 'ALL' && m.role !== selectedRoleFilter) return false;
    if (searchMember && !m.fullName.toLowerCase().includes(searchMember.toLowerCase()) && !m.email.toLowerCase().includes(searchMember.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Header Banner */}
      <div className="bg-[#00695C] rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-teal-200 font-semibold block">
              Multi-School Architecture & Administration
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{schoolInfo.name}</h2>
              <button
                type="button"
                onClick={() => {
                  setSchoolNameInput(schoolInfo.name);
                  setIsEditingName(true);
                }}
                className="p-1 hover:bg-white/10 rounded-lg text-teal-200 hover:text-white transition-colors cursor-pointer"
                title="Rename School"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-teal-100 font-medium">
              <span>{schoolInfo.teacherCount} Teachers</span>
              <span aria-hidden="true">·</span>
              <span>{schoolInfo.studentCount} Students</span>
              <span aria-hidden="true">·</span>
              <span>{schoolInfo.parentCount} Parents</span>
              <span aria-hidden="true">·</span>
              <span className="bg-teal-800/80 px-2 py-0.2 rounded border border-teal-600 text-teal-200 font-bold">
                Admin Console
              </span>
            </div>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Rename School Modal */}
      {isEditingName && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Rename Coaching Center / School</h3>
            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Name</label>
                <input
                  type="text"
                  value={schoolNameInput}
                  onChange={(e) => setSchoolNameInput(e.target.value)}
                  required
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Codes Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">School Enrollment Join Codes</h3>
          <p className="text-xs text-slate-500">
            Share these join codes to register new members into this school server. Codes can be rotated at any time if leaked.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Student & Parent Code */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Student & Parent Join Code</span>
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                Students & Parents
              </span>
            </div>

            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
              <span className="font-mono text-xl font-bold tracking-wider text-slate-900">
                {schoolInfo.studentCode}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(schoolInfo.studentCode, 'student')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedStudent ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedStudent ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleRegenerate('student')}
              className="text-xs font-semibold text-teal-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Rotate Student & Parent Code</span>
            </button>
          </div>

          {/* Teacher Code */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-teal-700" />
                <span>Teacher Join Code</span>
              </span>
              <span className="text-[10px] bg-teal-100 text-teal-900 font-bold px-2 py-0.5 rounded">
                Faculty Only
              </span>
            </div>

            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
              <span className="font-mono text-xl font-bold tracking-wider text-slate-900">
                {schoolInfo.teacherCode}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(schoolInfo.teacherCode, 'teacher')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedTeacher ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedTeacher ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleRegenerate('teacher')}
              className="text-xs font-semibold text-teal-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Rotate Teacher Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* Members Directory */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Enrolled Members Directory</h3>
            <p className="text-xs text-slate-500">All registered teachers, students, and parents belonging to this school</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search member..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="bg-transparent focus:outline-hidden text-xs w-28 sm:w-36"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              {['ALL', 'TEACHER', 'STUDENT', 'PARENT'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRoleFilter(role)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    selectedRoleFilter === role
                      ? 'bg-white text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {role === 'ALL' ? 'All' : role.charAt(0) + role.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full">
            <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 text-left">Member Name</th>
                <th className="py-2.5 px-3 text-left">Email Address</th>
                <th className="py-2.5 px-3 text-center">Assigned Role</th>
                <th className="py-2.5 px-3 text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>{member.fullName}</span>
                    {member.isSchoolAdmin && (
                      <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded border border-teal-200">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{member.email}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        member.role === 'TEACHER'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : member.role === 'STUDENT'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{member.joinedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
