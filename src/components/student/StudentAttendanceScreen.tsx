import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { AttendanceStatus } from '../../types';
import { CheckCircle2, Download, Calendar } from 'lucide-react';

export const StudentAttendanceScreen: React.FC = () => {
  const { attendanceRecords } = useTuition();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [downloadSlip, setDownloadSlip] = useState(false);

  // Filter for student 's1' (Aravind Kumar)
  const studentRecords = attendanceRecords.filter((r) => r.studentId === 's1');
  const totalSessions = studentRecords.length;
  const presentCount = studentRecords.filter((r) => r.status === 'PRESENT').length;
  const lateCount = studentRecords.filter((r) => r.status === 'LATE').length;
  const absentCount = studentRecords.filter((r) => r.status === 'ABSENT').length;
  const excusedCount = studentRecords.filter((r) => r.status === 'EXCUSED').length;

  const attendancePercent = totalSessions > 0
    ? (((presentCount + lateCount) / totalSessions) * 100).toFixed(1)
    : '91.4';

  const filteredRecords = statusFilter === 'ALL'
    ? studentRecords
    : studentRecords.filter((r) => r.status === statusFilter);

  const getStatusDisplay = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return {
          label: 'Present',
          classes: 'text-emerald-700 bg-emerald-50 border-emerald-200'
        };
      case 'ABSENT':
        return {
          label: 'Absent',
          classes: 'text-red-700 bg-red-50 border-red-200'
        };
      case 'LATE':
        return {
          label: 'Late',
          classes: 'text-amber-700 bg-amber-50 border-amber-200'
        };
      case 'EXCUSED':
        return {
          label: 'Excused',
          classes: 'text-blue-700 bg-blue-50 border-blue-200'
        };
    }
  };

  const handleDownloadReport = () => {
    setDownloadSlip(true);
    setTimeout(() => setDownloadSlip(false), 4000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Attendance Summary Header */}
      <div className="bg-[#E8F5E9] border border-emerald-200 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Term 1 Academic Attendance
            </span>
            <h2 className="text-2xl font-bold text-emerald-950">
              Overall Rate: <span className="font-mono tabular-nums text-[#2E7D32]">{attendancePercent}%</span>
            </h2>
            <div className="flex items-center gap-2 text-xs text-emerald-800">
              <span>{presentCount} Sessions Present</span>
              <span aria-hidden="true">·</span>
              <span>{lateCount} Late</span>
              <span aria-hidden="true">·</span>
              <span>{absentCount} Absent</span>
              <span aria-hidden="true">·</span>
              <span>{excusedCount} Excused</span>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-emerald-900 border border-emerald-300 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Above 75% Exam Threshold</span>
            </span>
            <button
              onClick={handleDownloadReport}
              className="text-xs font-semibold text-emerald-900 hover:text-emerald-950 flex items-center gap-1.5 underline underline-offset-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Monthly Report Slip</span>
            </button>
          </div>
        </div>
      </div>

      {downloadSlip && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Attendance statement generated for Aravind Kumar (Oct 2026). Ready for download.</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">Session Attendance History</h3>
          <p className="text-xs text-slate-500">Official log recorded by course instructors</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium self-start sm:self-center">
          {['ALL', 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === status
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table / List */}
      <div className="space-y-2.5">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
            No attendance entries matching this status.
          </div>
        ) : (
          filteredRecords.map((record) => {
            const statusConfig = getStatusDisplay(record.status);
            return (
              <div
                key={record.id}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-900 text-sm">{record.date}</span>
                    <span className="text-xs text-slate-500">Grade 10 Mathematics</span>
                  </div>
                  {record.notes ? (
                    <p className="text-xs text-slate-600 pl-6 italic">Instructor note: {record.notes}</p>
                  ) : (
                    <p className="text-xs text-slate-400 pl-6">Regular lecture verified</p>
                  )}
                </div>

                <div className="self-end sm:self-center shrink-0">
                  <span
                    className={`px-3 py-1 rounded-md text-xs font-bold border ${statusConfig.classes}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
