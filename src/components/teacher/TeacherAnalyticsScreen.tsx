import React from 'react';
import { useTuition } from '../../context/TuitionContext';
export const TeacherAnalyticsScreen: React.FC = () => {
  const { batches, attendanceRecords, assignments, feeRecords } = useTuition();

  const totalStudents = batches.reduce((acc, curr) => acc + curr.activeStudentCount, 0);
  const totalHomework = assignments.length;

  // Attendance stats for 30d
  const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
  const lateCount = attendanceRecords.filter((r) => r.status === 'LATE').length;
  const totalMarked = attendanceRecords.length;
  const attendanceRate = totalMarked > 0 ? Math.round(((presentCount + lateCount) / totalMarked) * 100) : 91;

  // Revenue stats
  const totalDue = feeRecords.reduce((acc, curr) => acc + curr.amountDue, 0);
  const totalCollected = feeRecords.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const collectionRate = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 60;

  // Simulated 30-day attendance points for SVG chart
  const attendanceTrendData = [
    { date: 'Oct 04', present: 16, late: 2, absent: 1 },
    { date: 'Oct 07', present: 18, late: 1, absent: 0 },
    { date: 'Oct 09', present: 15, late: 3, absent: 1 },
    { date: 'Oct 11', present: 17, late: 0, absent: 2 },
    { date: 'Oct 14', present: 18, late: 1, absent: 0 },
    { date: 'Oct 16', present: 16, late: 2, absent: 1 },
    { date: 'Oct 18', present: 17, late: 1, absent: 1 },
    { date: 'Oct 21', present: 19, late: 0, absent: 0 },
    { date: 'Oct 23', present: 15, late: 3, absent: 1 },
    { date: 'Oct 25', present: 18, late: 1, absent: 0 },
    { date: 'Oct 28', present: 17, late: 1, absent: 1 },
    { date: 'Oct 30', present: 18, late: 1, absent: 0 }
  ];

  // 6-Month revenue trend data
  const revenueTrendData = [
    { month: 'Jun', collected: 24000, pending: 3000 },
    { month: 'Jul', collected: 27500, pending: 4500 },
    { month: 'Aug', collected: 28000, pending: 3500 },
    { month: 'Sep', collected: 31000, pending: 2000 },
    { month: 'Oct', collected: 32500, pending: 4000 },
    { month: 'Nov', collected: 15000, pending: 18000 }
  ];

  // Calculate SVG bar geometry
  const chartWidth = 700;
  const chartHeight = 160;
  const padding = 20;
  const barGap = 12;
  const barWidth = (chartWidth - padding * 2) / attendanceTrendData.length - barGap;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Header Banner */}
      <div className="bg-[#00695C] rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-teal-200 font-semibold block">
              Tuition Management Insights
            </span>
            <h2 className="text-2xl font-bold tracking-tight">Executive Analytics & Performance</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-teal-100 font-medium">
              <span>{batches.length} Managed Batches</span>
              <span aria-hidden="true">·</span>
              <span>{totalStudents} Active Students</span>
              <span aria-hidden="true">·</span>
              <span>{attendanceRate}% Monthly Attendance</span>
              <span aria-hidden="true">·</span>
              <span>{collectionRate}% Fee Recovery</span>
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
          <span className="text-xs text-slate-500 font-medium block">Homework</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center space-y-1">
          <span className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">{attendanceRate}%</span>
          <span className="text-xs text-slate-500 font-medium block">Attendance (30d)</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center space-y-1 col-span-2 sm:col-span-1">
          <span className="text-2xl font-bold text-teal-800 font-mono tabular-nums">{collectionRate}%</span>
          <span className="text-xs text-slate-500 font-medium block">Fees Collected</span>
        </div>
      </div>

      {/* 30-Day Attendance Trend Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Attendance Trend — Last 30 Days</h3>
            <p className="text-xs text-slate-500">Daily attendance composition across active coaching batches</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-600" /> Present</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> Late</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-600" /> Absent</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-40" preserveAspectRatio="none">
            {attendanceTrendData.map((p, i) => {
              const x = padding + i * (barWidth + barGap);
              const maxTotal = 20;
              const scale = (chartHeight - padding * 2) / maxTotal;
              const presentH = p.present * scale;
              const lateH = p.late * scale;
              const absentH = p.absent * scale;

              const yPresent = chartHeight - padding - presentH;
              const yLate = yPresent - lateH;
              const yAbsent = yLate - absentH;

              return (
                <g key={p.date}>
                  {/* Present segment */}
                  <rect x={x} y={yPresent} width={barWidth} height={presentH} fill="#2E7D32" rx={2}>
                    <title>{`${p.date} - Present: ${p.present}`}</title>
                  </rect>
                  {/* Late segment */}
                  {lateH > 0 && (
                    <rect x={x} y={yLate} width={barWidth} height={lateH} fill="#EF6C00" rx={2}>
                      <title>{`${p.date} - Late: ${p.late}`}</title>
                    </rect>
                  )}
                  {/* Absent segment */}
                  {absentH > 0 && (
                    <rect x={x} y={yAbsent} width={barWidth} height={absentH} fill="#C62828" rx={2}>
                      <title>{`${p.date} - Absent: ${p.absent}`}</title>
                    </rect>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex justify-between text-[11px] font-mono text-slate-400 px-2 pt-1 border-t border-slate-100">
          {attendanceTrendData.map((p) => (
            <span key={p.date}>{p.date}</span>
          ))}
        </div>
      </div>

      {/* 6-Month Revenue Trend Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Fee Revenue Collection — Last 6 Months</h3>
            <p className="text-xs text-slate-500">Collected tuition fees versus outstanding pending receivables</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-600" /> Collected</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> Pending</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <svg viewBox="0 0 700 180" className="w-full h-44" preserveAspectRatio="none">
            {revenueTrendData.map((p, i) => {
              const groupW = (700 - 48) / revenueTrendData.length;
              const groupX = 24 + i * groupW;
              const bWidth = (groupW - 16) / 2;
              const maxAmount = 40000;
              const scale = (180 - 48) / maxAmount;
              const collH = p.collected * scale;
              const pendH = p.pending * scale;

              return (
                <g key={p.month}>
                  {/* Collected bar */}
                  <rect x={groupX} y={180 - 24 - collH} width={bWidth} height={collH} fill="#2E7D32" rx={3}>
                    <title>{`${p.month} - Collected: ₹${p.collected.toLocaleString()}`}</title>
                  </rect>
                  {/* Pending bar */}
                  <rect x={groupX + bWidth + 3} y={180 - 24 - pendH} width={bWidth} height={pendH} fill="#EF6C00" rx={3}>
                    <title>{`${p.month} - Pending: ₹${p.pending.toLocaleString()}`}</title>
                  </rect>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex justify-between text-xs font-semibold text-slate-700 px-6 pt-1 border-t border-slate-100">
          {revenueTrendData.map((p) => (
            <span key={p.month}>{p.month} 2026</span>
          ))}
        </div>
      </div>

      {/* Batch Performance Summary Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">Subject Batch Performance</h3>
          <p className="text-xs text-slate-500">Comparative evaluation of homework submission compliance and attendance</p>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full">
            <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 text-left">Subject & Batch</th>
                <th className="py-2.5 px-3 text-center">Enrolled Students</th>
                <th className="py-2.5 px-3 text-center">Homework Completion</th>
                <th className="py-2.5 px-3 text-center">Attendance Rate</th>
                <th className="py-2.5 px-3 text-right">Curriculum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <div>
                      <span>{batch.title}</span>
                      <span className="block text-[11px] text-slate-400 font-normal">{batch.subject} Specialization</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                    {batch.activeStudentCount}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      85%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      92%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-teal-900">
                    {batch.syllabusProgress}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
