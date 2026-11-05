import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { TestResult } from '../../types';
import {
  GraduationCap,
  Plus,
  CheckCircle2,
  Calendar,
  ChevronRight,
  X,
  FileCheck2
} from 'lucide-react';

interface StudentMarkInput {
  studentId: string;
  studentName: string;
  marksScored: number;
  remarks: string;
}

export const TeacherTestsScreen: React.FC = () => {
  const { batches, testResults, schoolMembers, saveBatchTestMarks, currentTeacher } = useTuition();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || 'b1');
  const [testTitle, setTestTitle] = useState('');
  const [subject, setSubject] = useState(batches[0]?.subject || 'Mathematics');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [maxMarks, setMaxMarks] = useState<number>(50);
  const [studentMarks, setStudentMarks] = useState<Record<string, StudentMarkInput>>({});
  const [selectedTestFilter, setSelectedTestFilter] = useState<string>('ALL');
  const [inspectTestGroup, setInspectTestGroup] = useState<string | null>(null);
  const [savingNotice, setSavingNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student list for selected batch
  const enrolledStudents = schoolMembers.filter((m) => m.role === 'STUDENT');
  const fallbackStudents = [
    { id: 's1', fullName: 'Aravind Kumar' },
    { id: 's2', fullName: 'Divya Sharma' },
    { id: 's3', fullName: 'Ganesh Raman' },
    { id: 's4', fullName: 'Kavitha Selvam' },
    { id: 's5', fullName: 'Pradeep Raj' }
  ];
  const activeStudentRoster = enrolledStudents.length > 0
    ? enrolledStudents.map((s) => ({ id: s.id, fullName: s.fullName }))
    : fallbackStudents;

  // Initialize student marks inputs when opening create modal
  const handleOpenCreateModal = () => {
    const defaultBatch = batches[0];
    const initialMarks: Record<string, StudentMarkInput> = {};
    activeStudentRoster.forEach((s) => {
      initialMarks[s.id] = {
        studentId: s.id,
        studentName: s.fullName,
        marksScored: Math.round(maxMarks * 0.8), // convenient default
        remarks: ''
      };
    });
    setStudentMarks(initialMarks);
    if (defaultBatch) {
      setSelectedBatchId(defaultBatch.id);
      setSubject(defaultBatch.subject);
    }
    setTestTitle(`Unit Test: ${defaultBatch?.subject || 'Assessment'}`);
    setShowCreateModal(true);
  };

  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    const b = batches.find((x) => x.id === batchId);
    if (b) {
      setSubject(b.subject);
      setTestTitle(`Monthly Assessment: ${b.subject}`);
    }
  };

  const handleScoreChange = (studentId: string, val: number) => {
    const clamped = Math.max(0, Math.min(maxMarks, val || 0));
    setStudentMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marksScored: clamped
      }
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudentMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const marksList = Object.values(studentMarks);
      await saveBatchTestMarks(
        {
          batchId: selectedBatchId,
          testTitle: testTitle.trim(),
          subject: subject.trim(),
          date,
          maxMarks
        },
        marksList
      );

      setSavingNotice(`Marks recorded successfully for "${testTitle}" across ${marksList.length} students!`);
      setShowCreateModal(false);
      setTimeout(() => setSavingNotice(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group existing test results by testTitle + date
  const testGroupsMap = new Map<string, TestResult[]>();
  testResults.forEach((t) => {
    const key = `${t.testTitle}::${t.date}`;
    const list = testGroupsMap.get(key) || [];
    list.push(t);
    testGroupsMap.set(key, list);
  });

  const testGroups = Array.from(testGroupsMap.entries()).map(([key, results]) => {
    const first = results[0];
    const avgScore = results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.marksScored, 0) / results.length)
      : 0;
    const maxScore = results.length > 0
      ? Math.max(...results.map((r) => r.marksScored))
      : first.maxMarks;

    return {
      key,
      title: first.testTitle,
      subject: first.subject,
      batchId: first.batchId,
      date: first.date,
      maxMarks: first.maxMarks,
      averageScore: avgScore,
      highestScore: maxScore,
      studentCount: results.length,
      results
    };
  });

  const filteredGroups = testGroups.filter((g) => {
    if (selectedTestFilter === 'ALL') return true;
    return g.batchId === selectedTestFilter || g.subject === selectedTestFilter;
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Header Banner */}
      <div className="bg-[#00695C] rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-teal-200 font-semibold block">
              Academic Assessment & Grading
            </span>
            <h2 className="text-2xl font-bold tracking-tight">Tests & Marks Ledger</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-teal-100 font-medium">
              <span>{testGroups.length} Assessments Conducted</span>
              <span aria-hidden="true">·</span>
              <span>{testResults.length} Student Records</span>
              <span aria-hidden="true">·</span>
              <span>Faculty: {currentTeacher.name}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-teal-900 font-bold text-xs rounded-xl shadow-xs hover:bg-teal-50 active:scale-[0.98] transition-all cursor-pointer self-start sm:self-center shrink-0"
          >
            <Plus className="w-4 h-4 text-teal-700" />
            <span>Create Test & Enter Marks</span>
          </button>
        </div>
      </div>

      {savingNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savingNotice}</span>
        </div>
      )}

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium block">Total Tests Conducted</span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{testGroups.length}</div>
          <span className="text-[11px] text-slate-400">Continuous Comprehensive Evaluation (CCE)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium block">Evaluations Logged</span>
          <div className="text-2xl font-bold text-teal-800 font-mono tabular-nums">{testResults.length}</div>
          <span className="text-[11px] text-slate-400">Stored in Firestore test_results</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium block">Average Class Performance</span>
          <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {testResults.length > 0
              ? Math.round(
                  (testResults.reduce((acc, t) => acc + (t.marksScored / t.maxMarks), 0) /
                    testResults.length) *
                    100
                )
              : 88}
            %
          </div>
          <span className="text-[11px] text-slate-400">Calculated across all batches</span>
        </div>
      </div>

      {/* Filter and Assessment Groups List */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recorded Test Assessments</h3>
            <p className="text-xs text-slate-500">Inspect batch test scores, student rankings, and percentile metrics</p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setSelectedTestFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                selectedTestFilter === 'ALL'
                  ? 'bg-teal-50 text-teal-900 border border-teal-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              All Batches
            </button>
            {batches.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedTestFilter(b.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                  selectedTestFilter === b.id
                    ? 'bg-teal-50 text-teal-900 border border-teal-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {b.subject}
              </button>
            ))}
          </div>
        </div>

        {filteredGroups.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No assessments found for this filter.</p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="text-xs text-teal-800 font-bold underline"
            >
              Create your first test now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map((group) => {
              const isInspected = inspectTestGroup === group.key;

              return (
                <div
                  key={group.key}
                  className="rounded-xl border border-slate-200 overflow-hidden transition-all hover:border-slate-300 shadow-2xs"
                >
                  <div className="p-4 sm:p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                          {group.subject}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">{group.title}</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{group.date}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Max Marks: <strong>{group.maxMarks}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>Evaluated: <strong>{group.studentCount} students</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Class Average</div>
                        <div className="text-sm font-bold text-slate-900 font-mono">
                          {group.averageScore} / {group.maxMarks}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Top Score</div>
                        <div className="text-sm font-bold text-emerald-700 font-mono">
                          {group.highestScore} / {group.maxMarks}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setInspectTestGroup(isInspected ? null : group.key)}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title={isInspected ? 'Collapse' : 'Expand roster'}
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform ${isInspected ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Student Marks Table */}
                  {isInspected && (
                    <div className="bg-slate-50 border-t border-slate-200 p-4 text-xs space-y-2">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                        Student Marks Breakdown
                      </span>
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <table className="w-full text-left">
                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">Student Name</th>
                              <th className="py-2 px-3 text-center">Marks Scored</th>
                              <th className="py-2 px-3 text-center">Percentage</th>
                              <th className="py-2 px-3 text-center">Percentile</th>
                              <th className="py-2 px-3">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {group.results.map((res) => {
                              const pct = Math.round((res.marksScored / res.maxMarks) * 100);
                              return (
                                <tr key={res.id} className="hover:bg-slate-50/60">
                                  <td className="py-2 px-3 font-semibold text-slate-900">
                                    {res.studentName || res.studentId}
                                  </td>
                                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                                    {res.marksScored} / {res.maxMarks}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-mono font-semibold text-[11px] ${
                                        pct >= 80
                                          ? 'bg-emerald-50 text-emerald-800'
                                          : pct >= 60
                                          ? 'bg-blue-50 text-blue-800'
                                          : 'bg-rose-50 text-rose-800'
                                      }`}
                                    >
                                      {pct}%
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-center font-mono text-slate-600">
                                    {res.percentile}%ile
                                  </td>
                                  <td className="py-2 px-3 text-slate-600 italic">
                                    {res.remarks || '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Test & Enter Marks Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 text-teal-800 rounded-xl border border-teal-200">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Create Test & Enter Student Marks</h3>
                  <p className="text-xs text-slate-500">Record assessment scores and commit to Firestore test_results</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMarks} className="space-y-4 overflow-y-auto pr-1">
              {/* Test Meta Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Batch</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => handleBatchChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.subject})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assessment / Test Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 3 Mock Exam: Trigonometry & Circle Proofs"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Test Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Maximum Marks</label>
                    <input
                      type="number"
                      min="5"
                      max="200"
                      value={maxMarks}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 50;
                        setMaxMarks(val);
                      }}
                      required
                      className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>
              </div>

              {/* Student Marks Entry Roster */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-teal-700" />
                    <span>Enrolled Student Marks ({activeStudentRoster.length})</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Scale: 0 to {maxMarks} marks</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 text-left">Student</th>
                        <th className="py-2 px-3 text-center w-28">Score (out of {maxMarks})</th>
                        <th className="py-2 px-3 text-left">Instructor Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeStudentRoster.map((student) => {
                        const input = studentMarks[student.id] || {
                          studentId: student.id,
                          studentName: student.fullName,
                          marksScored: Math.round(maxMarks * 0.8),
                          remarks: ''
                        };

                        return (
                          <tr key={student.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {student.fullName}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max={maxMarks}
                                value={input.marksScored}
                                onChange={(e) => handleScoreChange(student.id, parseInt(e.target.value, 10))}
                                className="w-20 text-center font-mono font-bold border border-slate-300 rounded-md py-1 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                placeholder="e.g. Good derivation speed"
                                value={input.remarks}
                                onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                                className="w-full border border-slate-200 rounded-md py-1 px-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving to Firestore...' : 'Save & Publish Marks'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
