import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { AttendanceStatus } from '../../types';
import { CheckCircle2, Send, CheckCheck, Search } from 'lucide-react';

interface StudentAttendanceItem {
  id: string;
  name: string;
  rollNo: string;
  guardianName: string;
  status: AttendanceStatus;
}

export const TeacherAttendanceScreen: React.FC = () => {
  const { markAttendance, batches } = useTuition();
  const [selectedBatchId, setSelectedBatchId] = useState('b1');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const [students, setStudents] = useState<StudentAttendanceItem[]>([
    { id: 's1', name: 'Aravind Kumar', rollNo: '10A-01', guardianName: 'Kumar Raman', status: 'PRESENT' },
    { id: 's2', name: 'Divya Sharma', rollNo: '10A-02', guardianName: 'Ramesh Sharma', status: 'PRESENT' },
    { id: 's3', name: 'Ganesh Raman', rollNo: '10A-03', guardianName: 'S. Raman', status: 'ABSENT' },
    { id: 's4', name: 'Kavitha Selvam', rollNo: '10A-04', guardianName: 'Selvam Mani', status: 'PRESENT' },
    { id: 's5', name: 'Pradeep Raj', rollNo: '10A-05', guardianName: 'Rajendran P.', status: 'LATE' },
    { id: 's6', name: 'Rohit Verma', rollNo: '10A-06', guardianName: 'Anand Verma', status: 'PRESENT' },
    { id: 's7', name: 'Sneha Nair', rollNo: '10A-07', guardianName: 'Suresh Nair', status: 'PRESENT' }
  ]);

  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  const updateStatus = (index: number, newStatus: AttendanceStatus) => {
    setStudents((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: newStatus };
      return updated;
    });
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'PRESENT' })));
  };

  const handleSaveAndNotify = () => {
    const records = students.map((s) => ({
      id: `att-${Date.now()}-${s.id}`,
      batchId: selectedBatchId,
      studentId: s.id,
      studentName: s.name,
      date: sessionDate,
      status: s.status,
      notes: s.status === 'ABSENT' ? 'Marked absent by faculty' : s.status === 'LATE' ? 'Late arrival recorded' : ''
    }));

    markAttendance({
      batchId: selectedBatchId,
      date: sessionDate,
      records
    });

    const absentOrLate = students.filter((s) => s.status === 'ABSENT' || s.status === 'LATE');
    setNotificationStatus(
      `Attendance saved for ${sessionDate}! SMS alert dispatched to parents of ${absentOrLate.length} absent/late students.`
    );

    setTimeout(() => {
      setNotificationStatus(null);
    }, 5000);
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Session Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Mark Batch Attendance</h2>
            <p className="text-xs text-slate-500">Record session roll call and notify guardians in real time</p>
          </div>

          <button
            type="button"
            onClick={markAllPresent}
            className="self-start sm:self-center px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#00695C] border border-teal-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All Present</span>
          </button>
        </div>

        {/* Batch and Date Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-medium"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.scheduleTime})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Session Date</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-medium"
            />
          </div>
        </div>

        {/* Live Metrics Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              {students.filter((s) => s.status === 'PRESENT').length} Present
            </span>
            <span className="text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
              {students.filter((s) => s.status === 'ABSENT').length} Absent
            </span>
            <span className="text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              {students.filter((s) => s.status === 'LATE').length} Late
            </span>
            <span className="text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              {students.filter((s) => s.status === 'EXCUSED').length} Excused
            </span>
          </div>

          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>
      </div>

      {notificationStatus && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificationStatus}</span>
        </div>
      )}

      {/* Student Attendance List */}
      <div className="space-y-2.5">
        {filteredStudents.map((student) => {
          const actualIndex = students.findIndex((s) => s.id === student.id);
          return (
            <div
              key={student.id}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs border border-teal-200">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{student.name}</span>
                    <span className="text-[11px] font-mono text-slate-400 font-medium">({student.rollNo})</span>
                  </div>
                  <span className="text-xs text-slate-500">Guardian: {student.guardianName}</span>
                </div>
              </div>

              {/* Status Selector Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => updateStatus(actualIndex, 'PRESENT')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                    student.status === 'PRESENT'
                      ? 'bg-[#2E7D32] text-white border-[#2E7D32] shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  P (Present)
                </button>

                <button
                  type="button"
                  onClick={() => updateStatus(actualIndex, 'ABSENT')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                    student.status === 'ABSENT'
                      ? 'bg-[#C62828] text-white border-[#C62828] shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  A (Absent)
                </button>

                <button
                  type="button"
                  onClick={() => updateStatus(actualIndex, 'LATE')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                    student.status === 'LATE'
                      ? 'bg-[#EF6C00] text-white border-[#EF6C00] shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  L (Late)
                </button>

                <button
                  type="button"
                  onClick={() => updateStatus(actualIndex, 'EXCUSED')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                    student.status === 'EXCUSED'
                      ? 'bg-[#1565C0] text-white border-[#1565C0] shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  E (Excused)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleSaveAndNotify}
          className="w-full py-3.5 bg-[#00695C] hover:bg-[#005a4e] active:bg-[#004d40] text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>Save & Notify Guardians ({sessionDate})</span>
        </button>
      </div>
    </div>
  );
};
