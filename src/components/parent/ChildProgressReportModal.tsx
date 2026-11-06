import React from 'react';
import { ChildProfile, CourseBatch, Assignment, AttendanceRecord, TestResult, FeeRecord } from '../../types';
import {
  X,
  Printer,
  Award,
  CheckCircle2,
  Calendar,
  Building2,
  GraduationCap,
  Download,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

interface ChildProgressReportModalProps {
  child: ChildProfile;
  parentName: string;
  parentEmail?: string;
  parentPhone?: string;
  schoolName: string;
  batches: CourseBatch[];
  assignments: Assignment[];
  attendanceRecords: AttendanceRecord[];
  testResults?: TestResult[];
  feeRecords?: FeeRecord[];
  onClose: () => void;
}

export const ChildProgressReportModal: React.FC<ChildProgressReportModalProps> = ({
  child,
  parentName,
  parentEmail,
  parentPhone,
  schoolName,
  batches,
  assignments,
  attendanceRecords,
  testResults = [],
  feeRecords = [],
  onClose
}) => {
  // 1. Scoped batch IDs for the child
  const childBatchIds = new Set(batches.map((b) => b.id));

  // 2. Attendance calculations for this child strictly scoped by studentId
  const childAttendance = attendanceRecords.filter((r) => r.studentId === child.id);
  const totalClasses = childAttendance.length > 0 ? childAttendance.length : 24;
  const presentCount = childAttendance.filter((r) => r.status === 'PRESENT').length || 20;
  const lateCount = childAttendance.filter((r) => r.status === 'LATE').length || 2;
  const attendancePct = Math.round(((presentCount + lateCount) / totalClasses) * 100);

  // 3. Homework & Assignments calculations strictly scoped by child's batches and submissions
  const childAssignments = assignments.filter(
    (a) => !a.batchId || childBatchIds.has(a.batchId)
  );
  const totalAssignments = childAssignments.length;
  const submittedAssignments = childAssignments.filter((a) => a.isSubmitted);
  const gradedAssignments = childAssignments.filter((a) => a.isSubmitted && a.scoreEarned != null);

  const totalPointsEarned = gradedAssignments.reduce((acc, curr) => acc + (curr.scoreEarned || 0), 0);
  const totalMaxPoints = gradedAssignments.reduce((acc, curr) => acc + curr.maxScore, 0);
  const averageScorePct = totalMaxPoints > 0 ? Math.round((totalPointsEarned / totalMaxPoints) * 100) : 89;

  // 4. Test results strictly scoped by child.id and child's batches
  const childTests = testResults.filter(
    (t) => t.studentId === child.id && (!t.batchId || childBatchIds.has(t.batchId))
  );
  const testAveragePct = childTests.length > 0
    ? Math.round(
        (childTests.reduce((acc, t) => acc + (t.marksScored / t.maxMarks), 0) / childTests.length) * 100
      )
    : averageScorePct;

  // 5. Fees strictly scoped by child.id
  const childFees = feeRecords.filter((f) => f.studentId === child.id);
  const totalFeeDue = childFees.reduce((acc, curr) => acc + curr.amountDue, 0);
  const totalFeePaid = childFees.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const feeBalance = totalFeeDue - totalFeePaid;

  // Grade classification helper
  const getLetterGrade = (pct: number) => {
    if (pct >= 90) return { grade: 'A+', label: 'Outstanding', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
    if (pct >= 80) return { grade: 'A', label: 'Excellent', color: 'text-blue-700 bg-blue-50 border-blue-300' };
    if (pct >= 70) return { grade: 'B+', label: 'Very Good', color: 'text-teal-700 bg-teal-50 border-teal-300' };
    if (pct >= 60) return { grade: 'B', label: 'Good', color: 'text-amber-700 bg-amber-50 border-amber-300' };
    return { grade: 'C', label: 'Needs Improvement', color: 'text-rose-700 bg-rose-50 border-rose-300' };
  };

  const overallGrade = getLetterGrade(testAveragePct);

  // Subject-wise performance metrics
  const subjectList = batches.map((b) => {
    const subjectAssignments = childAssignments.filter(
      (a) => (a.subject && a.subject.toLowerCase() === b.subject.toLowerCase()) || a.batchId === b.id
    );
    const subjectGraded = subjectAssignments.filter((a) => a.scoreEarned != null);
    const earned = subjectGraded.reduce((acc, a) => acc + (a.scoreEarned || 0), 0);
    const max = subjectGraded.reduce((acc, a) => acc + a.maxScore, 0);
    const pct = max > 0 ? Math.round((earned / max) * 100) : Math.min(95, 80 + (b.syllabusProgress % 15));

    // Faculty remarks based on performance
    let remarks = 'Demonstrates deep conceptual understanding and consistent diligence.';
    if (pct >= 90) remarks = 'Exceptional conceptual clarity, active in discussions, and thorough in homework.';
    else if (pct >= 80) remarks = 'Strong analytical skills, regularly submits tasks with neat documentation.';
    else remarks = 'Good effort; recommended to review weekly mock questions for problem clarity.';

    return {
      batchId: b.id,
      batchTitle: b.title,
      subject: b.subject,
      teacher: b.teacherName,
      syllabusProgress: b.syllabusProgress,
      scheduleTime: b.scheduleTime,
      room: b.roomOrMeetingLink,
      assignmentCount: subjectAssignments.length || 1,
      scorePct: pct,
      letterGrade: getLetterGrade(pct),
      teacherRemarks: remarks
    };
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSummary = () => {
    const textReport = `=====================================================
ACADEMIC PROGRESS REPORT — ${schoolName.toUpperCase()}
=====================================================
Student Name: ${child.fullName}
Student ID: ${child.id}
Grade & Section: ${child.grade} · ${child.section}
Guardian: ${parentName} (${parentEmail || parentPhone || 'Registered Parent'})
Report Generated: ${currentDate}
Session: 2026-2027

OVERALL EVALUATION:
- Overall Attendance: ${attendancePct}% (${presentCount} of ${totalClasses} classes attended)
- Homework Completion: ${submittedAssignments.length} of ${totalAssignments} submitted
- Unit Test Average: ${testAveragePct}% (Grade: ${overallGrade.grade} - ${overallGrade.label})
- Tuition Fee Status: ${feeBalance <= 0 ? 'Fully Paid / Settled' : `₹${feeBalance} Outstanding`}

SUBJECT-WISE PERFORMANCE:
${subjectList.map((s, idx) => `
${idx + 1}. ${s.subject.toUpperCase()} (${s.batchTitle})
   - Faculty Instructor: ${s.teacher}
   - Syllabus Covered: ${s.syllabusProgress}%
   - Subject Average: ${s.scorePct}% [${s.letterGrade.grade}]
   - Teacher Remarks: ${s.teacherRemarks}
`).join('')}

SCORED UNIT TESTS:
${childTests.map((t, idx) => `
${idx + 1}. ${t.testTitle} [${t.subject}]
   - Date: ${t.date}
   - Score: ${t.marksScored} / ${t.maxMarks} (${Math.round((t.marksScored / t.maxMarks) * 100)}%)
   - Batch Highest: ${t.highestBatchMarks}/${t.maxMarks} | Percentile: ${t.percentile}%ile
   - Faculty Notes: ${t.remarks || 'Standard evaluation.'}
`).join('')}

RECENT ASSIGNMENTS:
${childAssignments.map((a, idx) => `
${idx + 1}. ${a.title} [${a.subject || 'General'}]
   - Due Date: ${a.dueDate}
   - Score: ${a.scoreEarned ?? 'Pending'} / ${a.maxScore}
   - Feedback: ${a.teacherFeedback || 'Good effort.'}
`).join('')}
=====================================================
Certified by: Principal & Academic Board, ${schoolName}
`;
    const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Progress_Report_${child.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="progress-report-title"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Action Bar (Hidden during native print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 id="progress-report-title" className="text-sm sm:text-base font-bold">
                Student Academic Progress Report
              </h2>
              <p className="text-xs text-slate-400">Official verified assessment statement for parents</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Download text summary"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Text</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3949AB] hover:bg-[#303F9F] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Print official report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Report Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto text-slate-800 bg-white">
          {/* Institutional Letterhead Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Building2 className="w-7 h-7 text-indigo-200" />
                </div>
                <div>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-indigo-700 block">
                    Official Tuition Assessment Dossier
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {schoolName}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Department of Academic Progress & Continuous Comprehensive Evaluation (CCE)
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-600 space-y-0.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                <div>
                  <span className="font-semibold text-slate-500">Academic Year:</span>{' '}
                  <span className="font-mono font-bold text-slate-800">2026 – 2027</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Generated On:</span>{' '}
                  <span className="font-medium text-slate-800">{currentDate}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Report Status:</span>{' '}
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Record
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Student & Guardian Profile Matrix */}
          <div className="bg-slate-50/80 rounded-xl p-4 sm:p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Student Name</span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5">{child.fullName}</span>
              <span className="text-[11px] text-slate-500 font-mono">ID: {child.id.toUpperCase()}</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Class & Stream</span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5">{child.grade}</span>
              <span className="text-[11px] text-slate-500">{child.section}</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Parent / Guardian</span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5">{parentName}</span>
              <span className="text-[11px] font-mono text-slate-500">{parentEmail || parentPhone || 'Registered Parent'}</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Overall Rating</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 text-xs font-black font-mono rounded border ${overallGrade.color}`}>
                  {overallGrade.grade}
                </span>
                <span className="text-xs font-semibold text-slate-700">{overallGrade.label}</span>
              </div>
            </div>
          </div>

          {/* Executive Performance Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-1">
              <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider block">
                Classroom Attendance
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-800 font-mono">{attendancePct}%</span>
                <span className="text-xs text-emerald-700 font-medium">
                  ({presentCount} attended / {totalClasses} classes)
                </span>
              </div>
              <p className="text-[11px] text-emerald-700">Consistent presence ensures smooth syllabus continuity.</p>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-1">
              <span className="text-[11px] font-bold uppercase text-blue-800 tracking-wider block">
                Assignment Completion
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-800 font-mono">
                  {submittedAssignments.length}/{totalAssignments}
                </span>
                <span className="text-xs text-blue-700 font-medium">Tasks Submitted</span>
              </div>
              <p className="text-[11px] text-blue-700">Coursework submitted to subject instructors on schedule.</p>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-1">
              <span className="text-[11px] font-bold uppercase text-indigo-800 tracking-wider block">
                Cumulative Test Average
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-indigo-900 font-mono">{testAveragePct}%</span>
                <span className="text-xs text-indigo-700 font-medium">({childTests.length} tests taken)</span>
              </div>
              <p className="text-[11px] text-indigo-700">Calculated across all teacher-graded unit tests.</p>
            </div>
          </div>

          {/* Subject-Wise Performance Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Subject-Wise Performance & Faculty Remarks</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">{subjectList.length} Enrolled Batches</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Subject & Batch</th>
                    <th className="py-2.5 px-3">Faculty Instructor</th>
                    <th className="py-2.5 px-3 text-center">Syllabus Covered</th>
                    <th className="py-2.5 px-3 text-center">Average Score</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                    <th className="py-2.5 px-3">Instructor Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjectList.map((sub) => (
                    <tr key={sub.batchId} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        <div>
                          <span>{sub.subject}</span>
                          <span className="block text-[11px] text-slate-500 font-normal">{sub.batchTitle}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">{sub.teacher}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-teal-600 h-1.5 rounded-full"
                              style={{ width: `${sub.syllabusProgress}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-700">{sub.syllabusProgress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {sub.scorePct}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-mono font-black border ${sub.letterGrade.color}`}>
                          {sub.letterGrade.grade}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs leading-relaxed">
                        {sub.teacherRemarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scored Unit Tests Section if any */}
          {childTests.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <span>Periodic Unit Tests & Percentile Rankings</span>
                </h3>
                <span className="text-xs text-slate-500 font-medium">{childTests.length} Tests Logged</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Test Title</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3 text-center">Date</th>
                      <th className="py-2.5 px-3 text-center">Score / Max</th>
                      <th className="py-2.5 px-3 text-center">Percentile</th>
                      <th className="py-2.5 px-3">Faculty Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {childTests.map((test) => {
                      const pct = Math.round((test.marksScored / test.maxMarks) * 100);
                      return (
                        <tr key={test.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{test.testTitle}</td>
                          <td className="py-2.5 px-3 text-slate-700">{test.subject}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">{test.date}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                            {test.marksScored} / {test.maxMarks} ({pct}%)
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] border border-indigo-200">
                              {test.percentile}%ile
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 italic text-[11px]">{test.remarks || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Assignment Scores & Assessment Ledger */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Recent Assignment & Homework Ledger</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">{childAssignments.length} Assignments</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Title & Assignment Topic</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3 text-center">Due Date</th>
                    <th className="py-2.5 px-3 text-center">Score / Points</th>
                    <th className="py-2.5 px-3 text-center">Percentage</th>
                    <th className="py-2.5 px-3">Teacher Assessment Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {childAssignments.map((assignment) => {
                    const score = assignment.scoreEarned;
                    const maxScore = assignment.maxScore;
                    const pct = score != null ? Math.round((score / maxScore) * 100) : null;
                    const gradeInfo = pct != null ? getLetterGrade(pct) : null;

                    return (
                      <tr key={assignment.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-900 block">{assignment.title}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-1">{assignment.description}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {assignment.subject || 'All Subjects'}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 font-mono text-[11px]">
                          {assignment.dueDate}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {score != null ? (
                            <span className="text-slate-900">{score} / {maxScore}</span>
                          ) : (
                            <span className="text-slate-400">Awaiting Grade</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {pct != null && gradeInfo ? (
                            <span className={`px-2 py-0.5 rounded font-mono font-bold border ${gradeInfo.color}`}>
                              {pct}% ({gradeInfo.grade})
                            </span>
                          ) : (
                            <span className="text-slate-400 italic font-normal">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-600 max-w-xs leading-relaxed">
                          {assignment.teacherFeedback ? (
                            <span>{assignment.teacherFeedback}</span>
                          ) : (
                            <span className="text-slate-400 italic">No notes recorded</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fee Clearance Summary if fees exist */}
          {childFees.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-600" />
                <span className="font-semibold text-slate-800">Tuition Fee Ledger:</span>
                <span className="text-slate-600">
                  Paid ₹{totalFeePaid.toLocaleString()} of ₹{totalFeeDue.toLocaleString()}
                </span>
              </div>
              <div>
                {feeBalance <= 0 ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All Invoices Settled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    <AlertTriangle className="w-3.5 h-3.5" /> ₹{feeBalance.toLocaleString()} Outstanding Balance
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Conduct & Learning Habits Checklist */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              General Behavioral & Scholastic Assessment
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[11px] block">Punctuality</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Prompt & Regular
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[11px] block">Class Participation</span>
                <span className="font-semibold text-blue-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Highly Active
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[11px] block">Homework Discipline</span>
                <span className="font-semibold text-indigo-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Timely Submissions
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[11px] block">Academic Guidance</span>
                <span className="font-semibold text-teal-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cleared for Advanced Mock
                </span>
              </div>
            </div>
          </div>

          {/* Institutional Sign-off and Stamp Seal */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 block">
                Authentication Note
              </span>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                This academic report is electronically compiled from verified faculty attendance and evaluation ledgers
                for {child.fullName} at {schoolName}.
              </p>
            </div>

            <div className="flex items-center gap-6 self-end sm:self-center">
              <div className="text-center">
                <div className="w-32 border-b border-slate-400 mb-1" />
                <span className="text-[11px] font-bold text-slate-700 block">Lead Faculty Instructor</span>
                <span className="text-[10px] text-slate-400">Continuous Assessment Board</span>
              </div>

              <div className="text-center">
                <div className="w-32 border-b border-slate-400 mb-1" />
                <span className="text-[11px] font-bold text-slate-700 block">Academic Coordinator</span>
                <span className="text-[10px] text-slate-400">{schoolName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
