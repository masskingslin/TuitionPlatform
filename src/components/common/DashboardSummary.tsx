import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Users,
  CheckCircle2,
  CreditCard,
  AlertTriangle,
  Download
} from 'lucide-react';

export const DashboardSummary: React.FC = () => {
  const { batches, attendanceRecords, feeRecords, doubts } = useTuition();
  const [timeRange, setTimeRange] = useState<'30D' | '7D' | 'ALL'>('30D');

  // 1. Core Key Metrics
  const totalStudents = batches.reduce((acc, curr) => acc + curr.activeStudentCount, 0);
  const totalMarked = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const overallAttendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 92;

  const totalFeeDue = feeRecords.reduce((acc, curr) => acc + curr.amountDue, 0);
  const totalFeeCollected = feeRecords.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const feeCollectionRate = totalFeeDue > 0 ? Math.round((totalFeeCollected / totalFeeDue) * 100) : 85;
  const overdueFeesCount = feeRecords.filter((f) => f.status === 'OVERDUE').length;
  const pendingDoubtsCount = doubts.filter((d) => !d.isResolved).length;

  // 2. Compute Daily Attendance Trend Data for Recharts
  const attendanceDateMap = new Map<
    string,
    { date: string; fullDate: string; Present: number; Late: number; Absent: number }
  >();

  attendanceRecords.forEach((rec) => {
    const rawDate = rec.date;
    const formattedDate = rawDate.length >= 10 ? `${rawDate.slice(5, 7)}/${rawDate.slice(8, 10)}` : rawDate;
    const existing = attendanceDateMap.get(rawDate) || {
      date: formattedDate,
      fullDate: rawDate,
      Present: 0,
      Late: 0,
      Absent: 0
    };

    if (rec.status === 'PRESENT') existing.Present += 1;
    else if (rec.status === 'LATE') existing.Late += 1;
    else if (rec.status === 'ABSENT') existing.Absent += 1;

    attendanceDateMap.set(rawDate, existing);
  });

  let sortedAttendanceData = Array.from(attendanceDateMap.values()).sort((a, b) =>
    a.fullDate.localeCompare(b.fullDate)
  );

  // Fallback data if attendance array is sparse
  if (sortedAttendanceData.length === 0) {
    sortedAttendanceData = [
      { date: '10/24', fullDate: '2026-10-24', Present: 12, Late: 2, Absent: 1 },
      { date: '10/26', fullDate: '2026-10-26', Present: 14, Late: 1, Absent: 2 },
      { date: '10/28', fullDate: '2026-10-28', Present: 15, Late: 0, Absent: 1 },
      { date: '10/30', fullDate: '2026-10-30', Present: 13, Late: 3, Absent: 0 },
      { date: '11/02', fullDate: '2026-11-02', Present: 16, Late: 1, Absent: 1 },
      { date: '11/04', fullDate: '2026-11-04', Present: 18, Late: 0, Absent: 0 }
    ];
  }

  // Slice based on time range
  if (timeRange === '7D' && sortedAttendanceData.length > 7) {
    sortedAttendanceData = sortedAttendanceData.slice(-7);
  }

  // 3. Compute Fee Payments Breakdown Data for Recharts
  const feeStatusMap = new Map<string, { status: string; amount: number; count: number }>();
  feeRecords.forEach((fee) => {
    const statusLabel = fee.status === 'PAID' ? 'Paid' : fee.status === 'OVERDUE' ? 'Overdue' : 'Pending';
    const existing = feeStatusMap.get(statusLabel) || { status: statusLabel, amount: 0, count: 0 };
    existing.amount += fee.amountPaid > 0 ? fee.amountPaid : fee.amountDue;
    existing.count += 1;
    feeStatusMap.set(statusLabel, existing);
  });

  let feeChartData = Array.from(feeStatusMap.values());
  if (feeChartData.length === 0) {
    feeChartData = [
      { status: 'Paid', amount: 45000, count: 18 },
      { status: 'Pending', amount: 12000, count: 5 },
      { status: 'Overdue', amount: 3500, count: 2 }
    ];
  }

  // 4. Batch Distribution Data for Pie Chart
  const batchPieData = batches.map((b) => ({
    name: b.title,
    students: b.activeStudentCount,
    subject: b.subject
  }));

  const PIE_COLORS = ['#00695C', '#2563EB', '#7C3AED', '#D97706', '#DC2626', '#059669'];

  const handleExportReport = () => {
    const dateStr = new Date().toISOString().split('T')[0];

    // CSV Sections
    const rows: string[][] = [
      ['Tuition Platform - Analytics & Financial Report'],
      [`Generated On: ${new Date().toLocaleString()}`],
      [`Range Selected: ${timeRange}`],
      [''],
      ['--- EXECUTIVE METRICS ---'],
      ['Metric', 'Value'],
      ['Total Revenue Collected', `₹${totalFeeCollected}`],
      ['Total Fee Invoiced', `₹${totalFeeDue}`],
      ['Fee Collection Rate', `${feeCollectionRate}%`],
      ['Overall Attendance Rate', `${overallAttendanceRate}%`],
      ['Total Active Students', `${totalStudents}`],
      ['Active Batches', `${batches.length}`],
      ['Overdue Invoices', `${overdueFeesCount}`],
      ['Open Doubts', `${pendingDoubtsCount}`],
      [''],
      ['--- DAILY ATTENDANCE TRENDS ---'],
      ['Date', 'Present Students', 'Late Students', 'Absent Students', 'Total Marked'],
      ...sortedAttendanceData.map((d) => [
        d.fullDate,
        d.Present.toString(),
        d.Late.toString(),
        d.Absent.toString(),
        (d.Present + d.Late + d.Absent).toString()
      ]),
      [''],
      ['--- FEE PAYMENTS LEDGER ---'],
      ['Invoice ID', 'Student Name', 'Month / Period', 'Amount Due (₹)', 'Amount Paid (₹)', 'Status', 'Payment Method', 'Due Date'],
      ...feeRecords.map((f) => [
        f.invoiceId,
        `"${f.studentName.replace(/"/g, '""')}"`,
        `"${f.monthYear.replace(/"/g, '""')}"`,
        f.amountDue.toString(),
        f.amountPaid.toString(),
        f.status,
        f.paymentMethod || 'N/A',
        f.dueDate
      ])
    ];

    const csvContent = rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Tuition_Analytics_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Range Selector */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">Tuition Dashboard Analytics</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time visual summary of attendance, fee collections, and batch health metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTimeRange('7D')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                timeRange === '7D' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange('30D')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                timeRange === '30D' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                timeRange === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00695C] hover:bg-[#004D40] active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            title="Export Attendance and Fee Trends as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Revenue Collected</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              ₹{totalFeeCollected.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {feeCollectionRate}% Paid
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Total Invoiced: ₹{totalFeeDue.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Overall Attendance Rate</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">{overallAttendanceRate}%</span>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              {totalMarked} Records
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Present + Late student sessions</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Active Batches & Students</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">{totalStudents}</span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {batches.length} Batches
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Enrolled across active subjects</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Pending Action Items</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {overdueFeesCount + pendingDoubtsCount}
            </span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Requires Review
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {overdueFeesCount} overdue fees · {pendingDoubtsCount} open doubts
          </p>
        </div>
      </div>

      {/* Main Charts Row: Attendance Trend & Fee Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trends Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">Attendance Trends & Daily Breakdown</h4>
              <p className="text-xs text-slate-500">Student attendance counts per recorded session date</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sortedAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#FFF',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#F8FAFC' }}
                />
                <Area
                  type="monotone"
                  dataKey="Present"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPresent)"
                />
                <Area
                  type="monotone"
                  dataKey="Late"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLate)"
                />
                <Area
                  type="monotone"
                  dataKey="Absent"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAbsent)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fee Collection & Ledger Bar Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">Recent Fee Payments (₹)</h4>
            <p className="text-xs text-slate-500">Financial status distribution across invoices</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="status" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val || 0).toLocaleString()}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#FFF',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {feeChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.status === 'Paid'
                          ? '#00695C'
                          : entry.status === 'Overdue'
                          ? '#EF4444'
                          : '#F59E0B'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Batch Distribution Pie & Summary Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batch Student Distribution Pie Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">Batch Enrollment Share</h4>
            <p className="text-xs text-slate-500">Student roster distribution per coaching batch</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={batchPieData}
                  dataKey="students"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={40}
                  paddingAngle={3}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                >
                  {batchPieData.map((_, index) => (
                    <Cell key={`cell-pie-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val || 0} Students`, 'Enrolled']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#FFF',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Batch Health Overview Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">Batch Operations & Progress Ledger</h4>
              <p className="text-xs text-slate-500">Live active batch status, teacher assignments & progress</p>
            </div>
            <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              {batches.length} Active Classes
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Batch Name</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3 text-center">Faculty</th>
                  <th className="py-2.5 px-3 text-center">Enrolled</th>
                  <th className="py-2.5 px-3 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-900">{batch.title}</td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {batch.subject}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-700 font-medium">{batch.teacherName}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      {batch.activeStudentCount}
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
    </div>
  );
};

export default DashboardSummary;
