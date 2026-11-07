import React, { lazy, Suspense } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { AlertTriangle } from 'lucide-react';
import { ListSkeleton } from '../common/ListSkeleton';

const DashboardSummary = lazy(() => import('../common/DashboardSummary'));

export const TeacherAnalyticsScreen: React.FC = () => {
  const { batches, attendanceRecords, assignments, feeRecords } = useTuition();

  const totalStudents = batches.reduce((acc, curr) => acc + curr.activeStudentCount, 0);
  const totalHomework = assignments.length;

  // Real Attendance Calculations directly from attendanceRecords
  const totalMarked = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
  const lateCount = attendanceRecords.filter((r) => r.status === 'LATE').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
  const excusedCount = attendanceRecords.filter((r) => r.status === 'EXCUSED').length;

  const attendanceRate = totalMarked > 0
    ? Math.round(((presentCount + lateCount) / totalMarked) * 100)
    : 0;



  // Student-Level Attendance Risk Analysis (< 75% attendance)
  const studentAttendanceMap = new Map<string, { id: string; name: string; total: number; attended: number }>();
  attendanceRecords.forEach((r) => {
    const existing = studentAttendanceMap.get(r.studentId) || {
      id: r.studentId,
      name: r.studentName,
      total: 0,
      attended: 0
    };
    existing.total += 1;
    if (r.status === 'PRESENT' || r.status === 'LATE') {
      existing.attended += 1;
    }
    studentAttendanceMap.set(r.studentId, existing);
  });

  const studentAttendanceRates = Array.from(studentAttendanceMap.values()).map((s) => ({
    ...s,
    ratePct: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0
  }));

  const atRiskStudents = studentAttendanceRates.filter((s) => s.ratePct < 75);

  // Real Financial Figures
  const totalDue = feeRecords.reduce((acc, curr) => acc + curr.amountDue, 0);
  const totalCollected = feeRecords.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const collectionRate = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0;



  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Header Banner */}
      <div className="bg-[#00695C] rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-teal-200 font-semibold block">
              Tuition Management Insights
            </span>
            <h2 className="text-2xl font-bold tracking-tight">Executive Analytics & Real Attendance</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-teal-100 font-medium">
              <span>{batches.length} Managed Batches</span>
              <span aria-hidden="true">·</span>
              <span>{totalStudents} Active Students</span>
              <span aria-hidden="true">·</span>
              <span>{attendanceRate}% Real Attendance Rate</span>
              <span aria-hidden="true">·</span>
              <span>{totalMarked} Attendance Logs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Headline KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center space-y-1">
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{batches.length}</span>
          <span className="text-xs text-slate-500 font-medium block">Batches</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center space-y-1">
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{totalStudents}</span>
          <span className="text-xs text-slate-500 font-medium block">Students</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center space-y-1">
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{totalHomework}</span>
          <span className="text-xs text-slate-500 font-medium block">Assignments</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center space-y-1">
          <span className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">{attendanceRate}%</span>
          <span className="text-xs text-slate-500 font-medium block">Real Attendance Rate</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center space-y-1 col-span-2 sm:col-span-1">
          <span className="text-2xl font-bold text-teal-800 font-mono tabular-nums">{collectionRate}%</span>
          <span className="text-xs text-slate-500 font-medium block">Fee Collection</span>
        </div>
      </div>

      {/* Attendance Composition Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-center">
          <span className="text-xs font-semibold text-emerald-800 block">Present Sessions</span>
          <span className="text-xl font-bold font-mono text-emerald-900">{presentCount}</span>
          <span className="text-[10px] text-emerald-700 block mt-0.5">
            {totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0}% of records
          </span>
        </div>

        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-center">
          <span className="text-xs font-semibold text-amber-800 block">Late Arrivals</span>
          <span className="text-xl font-bold font-mono text-amber-900">{lateCount}</span>
          <span className="text-[10px] text-amber-700 block mt-0.5">
            {totalMarked > 0 ? Math.round((lateCount / totalMarked) * 100) : 0}% of records
          </span>
        </div>

        <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 text-center">
          <span className="text-xs font-semibold text-rose-800 block">Unexcused Absences</span>
          <span className="text-xl font-bold font-mono text-rose-900">{absentCount}</span>
          <span className="text-[10px] text-rose-700 block mt-0.5">
            {totalMarked > 0 ? Math.round((absentCount / totalMarked) * 100) : 0}% of records
          </span>
        </div>

        <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 text-center">
          <span className="text-xs font-semibold text-blue-800 block">Excused Leaves</span>
          <span className="text-xl font-bold font-mono text-blue-900">{excusedCount}</span>
          <span className="text-[10px] text-blue-700 block mt-0.5">
            {totalMarked > 0 ? Math.round((excusedCount / totalMarked) * 100) : 0}% of records
          </span>
        </div>
      </div>

      {/* Attendance Risk Alert Banner if any student is under 75% */}
      {atRiskStudents.length > 0 && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
              <div>
                <h3 className="font-bold text-rose-950 text-sm">
                  Attendance Risk Alert ({atRiskStudents.length} Students Below 75%)
                </h3>
                <p className="text-xs text-rose-800">
                  Computed in real-time from recorded attendance sessions in Firestore. Guardian outreach recommended.
                </p>
              </div>
            </div>
            <span className="text-xs bg-rose-200 text-rose-900 font-bold px-2.5 py-1 rounded-full border border-rose-300">
              Intervention Required
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {atRiskStudents.map((st) => (
              <div
                key={st.id}
                className="bg-white p-3 rounded-xl border border-rose-200 flex items-center justify-between text-xs shadow-2xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{st.name}</span>
                  <span className="text-[11px] text-slate-500">
                    Attended {st.attended} of {st.total} sessions
                  </span>
                </div>
                <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {st.ratePct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Recharts Analytics & Visual Summary */}
      <Suspense fallback={<ListSkeleton count={2} />}>
        <DashboardSummary />
      </Suspense>

      {/* Batch Performance Summary Table computed dynamically */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">Subject Batch Attendance & Compliance Metrics</h3>
          <p className="text-xs text-slate-500">
            Computed in real time per batch from attendance and submission collections
          </p>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Subject & Batch</th>
                <th className="py-2.5 px-3 text-center">Active Roster</th>
                <th className="py-2.5 px-3 text-center">Sessions Logged</th>
                <th className="py-2.5 px-3 text-center">Real Attendance Rate</th>
                <th className="py-2.5 px-3 text-right">Syllabus Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((batch) => {
                const batchRecords = attendanceRecords.filter((r) => r.batchId === batch.id);
                const batchPresent = batchRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
                const batchRate = batchRecords.length > 0
                  ? Math.round((batchPresent / batchRecords.length) * 100)
                  : attendanceRate;

                return (
                  <tr key={batch.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div>
                        <span>{batch.title}</span>
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {batch.subject} · {batch.teacherName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      {batch.activeStudentCount} students
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {batchRecords.length} records
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold border ${
                          batchRate >= 80
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : batchRate >= 70
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {batchRate}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-teal-900">
                      {batch.syllabusProgress}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
