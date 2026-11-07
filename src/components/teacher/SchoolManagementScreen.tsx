import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { UserRole, SchoolMember } from '../../types';
import {
  Copy,
  Check,
  RefreshCw,
  Edit2,
  CheckCircle2,
  Search,
  UserCheck,
  GraduationCap,
  Users,
  Settings,
  Shield,
  Trash2,
  UserPlus,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
  ShieldCheck,
  Download
} from 'lucide-react';

export const SchoolManagementScreen: React.FC = () => {
  const {
    schoolInfo,
    updateSchoolSettings,
    regenerateSchoolCodes,
    schoolMembers,
    updateSchoolMemberRole,
    deleteSchoolMember,
    addSchoolMember,
    batches,
    feeRecords,
    attendanceRecords
  } = useTuition();

  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'SETTINGS' | 'CODES' | 'EXPORTS'>('MEMBERS');
  const [copiedStudent, setCopiedStudent] = useState(false);
  const [copiedTeacher, setCopiedTeacher] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [searchMember, setSearchMember] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Settings form state
  const [nameInput, setNameInput] = useState(schoolInfo.name || 'Apex Academy of Excellence');
  const [emailInput, setEmailInput] = useState(schoolInfo.email || 'admin@apexacademy.edu');
  const [phoneInput, setPhoneInput] = useState(schoolInfo.phone || '+91 98765 00000');
  const [addressInput, setAddressInput] = useState(schoolInfo.address || '42 Academic Boulevard, Chennai');
  const [academicYearInput, setAcademicYearInput] = useState(schoolInfo.academicYear || '2026–2027');
  const [upiVpaInput, setUpiVpaInput] = useState(schoolInfo.upiVpa || 'apex@upi');
  const [upiPayeeNameInput, setUpiPayeeNameInput] = useState(schoolInfo.upiPayeeName || 'Apex Academy of Excellence');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Member editing modal
  const [editingMember, setEditingMember] = useState<SchoolMember | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('STUDENT');
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('STUDENT');
  const [newMemberIsAdmin, setNewMemberIsAdmin] = useState(false);

  const handleCopyCode = (code: string | undefined, type: 'student' | 'teacher') => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    if (type === 'student') {
      setCopiedStudent(true);
      setTimeout(() => setCopiedStudent(false), 2500);
    } else {
      setCopiedTeacher(true);
      setTimeout(() => setCopiedTeacher(false), 2500);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateSchoolSettings({
        name: nameInput.trim(),
        email: emailInput.trim(),
        phone: phoneInput.trim(),
        address: addressInput.trim(),
        academicYear: academicYearInput.trim(),
        upiVpa: upiVpaInput.trim(),
        upiPayeeName: upiPayeeNameInput.trim()
      });
      setActionNotice('Institute settings updated and saved to Firestore!');
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const downloadBlob = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportStudentsCSV = () => {
    const headers = ['ID', 'Full Name', 'Email', 'Role', 'Joined At'];
    const rows = schoolMembers
      .filter((m) => m.role === 'STUDENT')
      .map((m) => [m.id, `"${m.fullName.replace(/"/g, '""')}"`, m.email, m.role, m.joinedAt]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadBlob(csvContent, 'students_roster_export.csv');
    setActionNotice('Downloaded students_roster_export.csv');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const exportAttendanceCSV = () => {
    const headers = ['Record ID', 'Student ID', 'Student Name', 'Batch ID', 'Date', 'Status'];
    const rows = attendanceRecords.map((a) => [
      a.id,
      a.studentId,
      `"${(a.studentName || '').replace(/"/g, '""')}"`,
      a.batchId,
      a.date,
      a.status
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadBlob(csvContent, 'attendance_ledger_export.csv');
    setActionNotice('Downloaded attendance_ledger_export.csv');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const exportFeeLedgerCSV = () => {
    const headers = ['Invoice ID', 'Student ID', 'Student Name', 'Amount Due', 'Amount Paid', 'Status', 'Payment Method', 'UTR Number'];
    const rows = feeRecords.map((f) => [
      f.invoiceId,
      f.studentId,
      `"${(f.studentName || '').replace(/"/g, '""')}"`,
      f.amountDue,
      f.amountPaid || 0,
      f.status,
      f.paymentMethod || 'UPI',
      f.manualPaymentUtr || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadBlob(csvContent, 'fee_ledger_export.csv');
    setActionNotice('Downloaded fee_ledger_export.csv');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleRegenerate = (which: 'student' | 'teacher' | 'both') => {
    if (
      window.confirm(
        `Rotate the ${which === 'both' ? 'student and teacher codes' : `${which} code`}? Existing codes will immediately be revoked.`
      )
    ) {
      regenerateSchoolCodes(which);
      setActionNotice(`Rotated ${which} enrollment join code successfully.`);
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleOpenEditMember = (member: SchoolMember) => {
    setEditingMember(member);
    setEditRole(member.role);
    setEditIsAdmin(!!member.isSchoolAdmin);
  };

  const handleSaveMemberRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    await updateSchoolMemberRole(editingMember.id, editRole, editIsAdmin);
    setActionNotice(`Updated role for ${editingMember.fullName} to ${editRole}${editIsAdmin ? ' (Admin)' : ''}.`);
    setEditingMember(null);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDeleteMember = async (member: SchoolMember) => {
    if (window.confirm(`Are you sure you want to remove ${member.fullName} (${member.email}) from this school?`)) {
      await deleteSchoolMember(member.id);
      setActionNotice(`Removed ${member.fullName} from school roster.`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    await addSchoolMember({
      fullName: newMemberName.trim(),
      email: newMemberEmail.trim().toLowerCase(),
      role: newMemberRole,
      isSchoolAdmin: newMemberIsAdmin
    });

    setActionNotice(`Enrolled new member: ${newMemberName} (${newMemberRole}).`);
    setNewMemberName('');
    setNewMemberEmail('');
    setShowAddMember(false);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const filteredMembers = schoolMembers.filter((m) => {
    if (selectedRoleFilter !== 'ALL') {
      if (selectedRoleFilter === 'ADMIN') {
        if (!m.isSchoolAdmin && m.role !== 'ADMIN') return false;
      } else if (m.role !== selectedRoleFilter) {
        return false;
      }
    }
    if (
      searchMember &&
      !m.fullName.toLowerCase().includes(searchMember.toLowerCase()) &&
      !m.email.toLowerCase().includes(searchMember.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const teacherCount = schoolMembers.filter((m) => m.role === 'TEACHER').length;
  const studentCount = schoolMembers.filter((m) => m.role === 'STUDENT').length;
  const parentCount = schoolMembers.filter((m) => m.role === 'PARENT').length;
  const adminCount = schoolMembers.filter((m) => m.isSchoolAdmin || m.role === 'ADMIN').length;
  const totalCollectedFees = feeRecords.reduce((acc, f) => acc + (f.amountPaid || 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Header Banner */}
      <div className="bg-[#00695C] rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-teal-200 font-semibold block">
                Institute Administration & Governance
              </span>
              <span className="text-[10px] bg-teal-800/80 px-2 py-0.5 rounded border border-teal-600 text-teal-200 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-teal-300" />
                <span>Admin Console</span>
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{schoolInfo.name}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-teal-100 font-medium">
              <span>{schoolMembers.length} Total Members</span>
              <span aria-hidden="true">·</span>
              <span>{batches.length} Active Batches</span>
              <span aria-hidden="true">·</span>
              <span>Academic Session: {schoolInfo.academicYear || '2026–2027'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-teal-900 font-bold text-xs rounded-xl shadow-xs hover:bg-teal-50 active:scale-[0.98] transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-teal-700" />
              <span>Enroll Member</span>
            </button>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* KPI Overview Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center space-y-1">
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{studentCount}</span>
          <span className="text-xs text-slate-500 font-medium block">Students</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center space-y-1">
          <span className="text-2xl font-bold text-teal-800 font-mono tabular-nums">{teacherCount}</span>
          <span className="text-xs text-slate-500 font-medium block">Faculty</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center space-y-1">
          <span className="text-2xl font-bold text-indigo-700 font-mono tabular-nums">{parentCount}</span>
          <span className="text-xs text-slate-500 font-medium block">Parents</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center space-y-1">
          <span className="text-2xl font-bold text-purple-700 font-mono tabular-nums">{adminCount}</span>
          <span className="text-xs text-slate-500 font-medium block">Admins</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center space-y-1 col-span-2 sm:col-span-1">
          <span className="text-xl font-bold text-emerald-700 font-mono tabular-nums">
            ₹{totalCollectedFees.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500 font-medium block">Fees Collected</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl border border-slate-300 w-fit text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('MEMBERS')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'MEMBERS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Members Directory ({schoolMembers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'SETTINGS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>School Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CODES')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'CODES' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Enrollment Join Codes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EXPORTS')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'EXPORTS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Data Backups & CSV</span>
        </button>
      </div>

      {/* ================= TAB 1: MEMBERS DIRECTORY ================= */}
      {activeTab === 'MEMBERS' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Institutional Members & Roles</h3>
              <p className="text-xs text-slate-500">
                Manage roles, grant admin privileges, or remove users from the school organization
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search Member */}
              <div className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  className="bg-transparent focus:outline-hidden text-xs w-36 sm:w-48"
                />
              </div>

              {/* Role Filters */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                {['ALL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRoleFilter(r)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      selectedRoleFilter === r
                        ? 'bg-white text-slate-900 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r === 'ALL' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Member Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3 text-center">Assigned Role</th>
                  <th className="py-2.5 px-3 text-center">Admin Rights</th>
                  <th className="py-2.5 px-3 text-center">Joined</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {member.fullName.charAt(0)}
                      </div>
                      <div>
                        <span>{member.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{member.email}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          member.role === 'TEACHER'
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : member.role === 'STUDENT'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : member.role === 'PARENT'
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {member.isSchoolAdmin ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Shield className="w-3 h-3 text-emerald-600" />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500 text-[11px]">
                      {member.joinedAt}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditMember(member)}
                          className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          title="Change Role & Permissions"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(member)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Member from Institute"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: SCHOOL SETTINGS ================= */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Institutional Profile & Configuration</h3>
            <p className="text-xs text-slate-500">
              Configure center name, academic session, contact phone/email and official campus address
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-teal-700" />
                <span>Institute / School Name</span>
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
                className="w-full text-sm font-semibold border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Official Admin Email</span>
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Support Helpline / Phone</span>
                </label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Current Academic Session</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2026–2027"
                  value={academicYearInput}
                  onChange={(e) => setAcademicYearInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>Campus Physical Address</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 42 Academic Boulevard"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:ring-2 focus:ring-teal-600 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-teal-700" />
                  <span>UPI VPA / Payment Handle</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. apex@upi"
                  value={upiVpaInput}
                  onChange={(e) => setUpiVpaInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>UPI Payee Display Name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Academy of Excellence"
                  value={upiPayeeNameInput}
                  onChange={(e) => setUpiPayeeNameInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-5 py-2.5 bg-[#00695C] hover:bg-[#005a4e] text-white font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingSettings ? 'Saving Settings...' : 'Save School Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= TAB 3: JOIN CODES ================= */}
      {activeTab === 'CODES' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">School Enrollment Join Codes</h3>
            <p className="text-xs text-slate-500">
              Share these codes to allow incoming teachers, parents, and students to join this specific school.
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
      )}

      {/* ================= TAB 4: DATA BACKUPS & EXPORTS ================= */}
      {activeTab === 'EXPORTS' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Zero-Cost Data Export & Ledger Backups</h3>
            <p className="text-xs text-slate-500">
              Generate and download offline CSV records directly in your browser with zero external dependencies or API fees.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Student Roster CSV</h4>
                <p className="text-[11px] text-slate-500">Export student names, emails, roles, and join dates.</p>
              </div>
              <button
                type="button"
                onClick={exportStudentsCSV}
                className="w-full py-2.5 px-3 bg-[#00695C] hover:bg-[#005a4e] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Students CSV</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Attendance Ledger CSV</h4>
                <p className="text-[11px] text-slate-500">Export attendance status records across all batches.</p>
              </div>
              <button
                type="button"
                onClick={exportAttendanceCSV}
                className="w-full py-2.5 px-3 bg-[#00695C] hover:bg-[#005a4e] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Attendance CSV</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Fee Ledger CSV</h4>
                <p className="text-[11px] text-slate-500">Export fee invoices, UPI UTR numbers, and payment status.</p>
              </div>
              <button
                type="button"
                onClick={exportFeeLedgerCSV}
                className="w-full py-2.5 px-3 bg-[#00695C] hover:bg-[#005a4e] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Fee Ledger CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-700 block">Edit Member Access</span>
                <h3 className="text-lg font-bold text-slate-900">{editingMember.fullName}</h3>
                <p className="text-xs text-slate-500 font-mono">{editingMember.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMemberRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher / Faculty</option>
                  <option value="PARENT">Parent / Guardian</option>
                  <option value="ADMIN">School Administrator</option>
                </select>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="editAdminCheck"
                  checked={editIsAdmin}
                  onChange={(e) => setEditIsAdmin(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <label htmlFor="editAdminCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Grant School Administrator Privileges
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-700 block">Enrollment Roster</span>
                <h3 className="text-lg font-bold text-slate-900">Enroll New Institute Member</h3>
                <p className="text-xs text-slate-500">Register a new student, teacher, or administrator</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Chandra"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@apex.edu"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Role</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher / Faculty</option>
                  <option value="PARENT">Parent / Guardian</option>
                  <option value="ADMIN">School Administrator</option>
                </select>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="newAdminCheck"
                  checked={newMemberIsAdmin}
                  onChange={(e) => setNewMemberIsAdmin(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <label htmlFor="newAdminCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Grant School Administrator Privileges
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Enroll Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
