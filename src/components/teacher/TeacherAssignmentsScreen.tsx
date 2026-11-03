import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { Assignment, StudentSubmission } from '../../types';
import {
  Upload,
  CheckCircle2,
  Award,
  Paperclip,
  Clock,
  Filter,
  FileText,
  Eye,
  Download,
  BookOpen,
  FileCheck2
} from 'lucide-react';

export const TeacherAssignmentsScreen: React.FC = () => {
  const { assignments, addAssignment, batches, submissions, gradeSubmission } = useTuition();
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('b1');
  const [dueDate, setDueDate] = useState('2026-11-10, 11:59 PM');
  const [maxScore, setMaxScore] = useState(25);
  const [referenceFile, setReferenceFile] = useState('');
  const [questionPaperFile, setQuestionPaperFile] = useState('Math_Standard_Question_Paper_2026.pdf');
  const [questionPaperSize, setQuestionPaperSize] = useState('1.6 MB · 4 pages');
  const [publishedNotice, setPublishedNotice] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(assignments[0] || null);
  const [activeGradingSub, setActiveGradingSub] = useState<StudentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(20);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [gradeSavedNotice, setGradeSavedNotice] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [previewQPModal, setPreviewQPModal] = useState<Assignment | null>(null);
  const [inspectAnswerSheetSub, setInspectAnswerSheetSub] = useState<StudentSubmission | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentTitle.trim() || !assignmentDesc.trim()) return;

    addAssignment({
      batchId: selectedBatchId,
      title: assignmentTitle.trim(),
      subject: selectedBatch.subject === 'Math' ? 'Mathematics' : selectedBatch.subject,
      description: assignmentDesc.trim(),
      dueDate: dueDate.trim() || '2026-11-10, 11:59 PM',
      maxScore: Number(maxScore) || 25,
      isSubmitted: false,
      referenceFile: referenceFile.trim() || undefined,
      questionPaperFile: questionPaperFile.trim() || undefined,
      questionPaperSize: questionPaperSize.trim() || '1.5 MB · 3 pages'
    });

    setAssignmentTitle('');
    setAssignmentDesc('');
    setPublishedNotice(true);
    setTimeout(() => setPublishedNotice(false), 4000);
  };

  const handleOpenGrade = (sub: StudentSubmission) => {
    setActiveGradingSub(sub);
    setGradeScore(sub.scoreEarned ?? selectedAssignment?.maxScore ?? 25);
    setGradeFeedback(sub.teacherFeedback ?? 'Strong mathematical derivations and neat step work.');
  };

  const submitGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGradingSub) return;
    gradeSubmission(activeGradingSub.id, Number(gradeScore), gradeFeedback);
    setActiveGradingSub(null);
    setInspectAnswerSheetSub(null);
    setGradeSavedNotice(true);
    setTimeout(() => setGradeSavedNotice(false), 3000);
  };

  const handleSimulateDownload = (fileName: string, type: string) => {
    setDownloadToast(`Downloading ${type}: ${fileName}`);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  // Unique subjects for tabs
  const allSubjects = ['ALL', 'Mathematics', 'Physics', 'Chemistry', 'Biology'];

  const filteredAssignments = assignments.filter((a) => {
    if (subjectFilter !== 'ALL' && a.subject !== subjectFilter) return false;
    return true;
  });

  const activeSubmissions = selectedAssignment
    ? submissions.filter((s) => s.assignmentId === selectedAssignment.id)
    : [];

  const getBatchName = (batchId: string) => {
    const b = batches.find((x) => x.id === batchId);
    return b ? b.title : 'General Batch';
  };

  const getBatchStudentsCount = (batchId: string) => {
    const b = batches.find((x) => x.id === batchId);
    return b ? b.activeStudentCount : 18;
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Header and Creation Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Post Homework & Review Submissions</h2>
          <p className="text-xs text-slate-500">
            Upload question papers for students, publish deadlines, and inspect turned-in answer sheets
          </p>
        </div>

        {publishedNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>New assignment and Question Paper published! Instantly visible on student dashboards with upcoming deadline alerts.</span>
          </div>
        )}

        {downloadToast && (
          <div className="p-3 bg-teal-50 border border-teal-300 rounded-xl text-teal-950 text-xs flex items-center gap-2">
            <Download className="w-4 h-4 text-teal-700 shrink-0" />
            <span>{downloadToast}</span>
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Subject & Batch</label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-medium"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.subject}: {b.title} ({b.activeStudentCount} students)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Submission Deadline</label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g., 2026-11-10, 11:59 PM"
                required
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Points</label>
              <input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                min={5}
                max={100}
                required
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-mono font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Title</label>
            <input
              type="text"
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
              placeholder="e.g., Quadratic Equations: Problem Set 3.1 & Board Question Paper"
              required
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions & Problem Sets</label>
            <textarea
              value={assignmentDesc}
              onChange={(e) => setAssignmentDesc(e.target.value)}
              placeholder="List specific exercise questions, textbook page numbers, proofs to derive, and answer sheet upload instructions..."
              rows={3}
              required
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Question Paper Upload Box */}
          <div className="bg-teal-50/60 rounded-xl p-4 border border-teal-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-950">
                <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                <span className="text-xs font-bold">Faculty Question Paper Attachment (Required for Students)</span>
              </div>
              <span className="text-[10px] font-mono text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded font-semibold">
                PDF / Scanned Paper
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-teal-900 mb-1">Question Paper Document Name</label>
                <div className="flex items-center gap-2 border border-teal-300 rounded-lg px-2.5 py-1.5 bg-white text-xs">
                  <Paperclip className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <input
                    type="text"
                    value={questionPaperFile}
                    onChange={(e) => setQuestionPaperFile(e.target.value)}
                    placeholder="e.g., Mathematics_Unit_Test_Paper_2026.pdf"
                    className="w-full bg-transparent focus:outline-hidden font-mono text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-teal-900 mb-1">File Size & Page Count</label>
                <input
                  type="text"
                  value={questionPaperSize}
                  onChange={(e) => setQuestionPaperSize(e.target.value)}
                  placeholder="e.g., 1.8 MB · 4 pages"
                  className="w-full text-xs border border-teal-300 rounded-lg p-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-mono text-slate-800"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-teal-900">
              <span className="text-slate-500 font-medium">Quick Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setQuestionPaperFile('Term_Revision_Math_Question_Paper.pdf');
                  setQuestionPaperSize('2.2 MB · 6 pages');
                }}
                className="px-2 py-0.5 rounded bg-white border border-teal-300 hover:bg-teal-100 text-teal-800 font-medium cursor-pointer transition-colors"
              >
                Math Model Paper
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuestionPaperFile('Optics_Physics_MidTerm_Exam.pdf');
                  setQuestionPaperSize('1.9 MB · 4 pages');
                }}
                className="px-2 py-0.5 rounded bg-white border border-teal-300 hover:bg-teal-100 text-teal-800 font-medium cursor-pointer transition-colors"
              >
                Physics Test Paper
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuestionPaperFile('Chemical_Equilibrium_Paper_2026.pdf');
                  setQuestionPaperSize('1.4 MB · 3 pages');
                }}
                className="px-2 py-0.5 rounded bg-white border border-teal-300 hover:bg-teal-100 text-teal-800 font-medium cursor-pointer transition-colors"
              >
                Chemistry Exam
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Optional Reference Handout / Formula Sheet</label>
            <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 text-xs text-slate-600">
              <BookOpen className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <input
                type="text"
                value={referenceFile}
                onChange={(e) => setReferenceFile(e.target.value)}
                placeholder="e.g., Trigonometry_Formula_Sheet.pdf (Optional)"
                className="w-full bg-transparent focus:outline-hidden font-mono text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#00695C] hover:bg-[#005a4e] active:bg-[#004d40] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Publish Task & Question Paper</span>
          </button>
        </form>
      </div>

      {gradeSavedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Evaluation saved! Marks and faculty feedback updated on the student portal.</span>
        </div>
      )}

      {/* Submissions & Deadlines Inspector */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Active Tasks & Submission Rates</h3>
            <p className="text-xs text-slate-500">Monitor batch completion rates and inspect turned-in student answer sheets</p>
          </div>

          {/* Subject Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {allSubjects.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubjectFilter(sub)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  subjectFilter === sub
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {sub === 'ALL' ? 'All Subjects' : sub}
              </button>
            ))}
          </div>
        </div>

        {/* Assignments Cards Carousel/Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {filteredAssignments.map((item) => {
            const isSelected = selectedAssignment?.id === item.id;
            const totalEnrolled = getBatchStudentsCount(item.batchId);
            const turnedInCount = item.submissionsCount || 0;
            const completionPercent = Math.min(100, Math.round((turnedInCount / totalEnrolled) * 100));

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedAssignment(item)}
                className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-[#00695C] bg-teal-50/50 shadow-2xs ring-1 ring-[#00695C]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 px-1.5 py-0.5 rounded">
                      {item.subject || 'Homework'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 font-semibold">{item.maxScore} pts</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs line-clamp-2 mt-1">{item.title}</h4>
                  
                  {item.questionPaperFile && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-medium truncate">
                      <FileText className="w-3 h-3 text-teal-700 shrink-0" />
                      <span className="truncate">QP: {item.questionPaperFile}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{item.dueDate}</span>
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>Turned In</span>
                    <span className="font-bold text-teal-900">{turnedInCount} / {totalEnrolled}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#00695C] h-full rounded-full transition-all"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Assignment Submissions Deck */}
        {selectedAssignment && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-base">{selectedAssignment.title}</h4>
                  <span className="text-xs text-slate-500 font-medium font-mono">
                    ({getBatchName(selectedAssignment.batchId)})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>Subject: {selectedAssignment.subject}</span>
                  <span aria-hidden="true">·</span>
                  <span>Due: {selectedAssignment.dueDate}</span>
                  <span aria-hidden="true">·</span>
                  <span>Max Score: {selectedAssignment.maxScore} points</span>
                  {selectedAssignment.questionPaperFile && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-teal-800 font-medium flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-teal-700" />
                        <span>Question Paper: {selectedAssignment.questionPaperFile}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                {selectedAssignment.questionPaperFile && (
                  <button
                    type="button"
                    onClick={() => setPreviewQPModal(selectedAssignment)}
                    className="px-3 py-1.5 bg-teal-50 text-[#00695C] border border-teal-200 hover:bg-teal-100 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Question Paper</span>
                  </button>
                )}
                <div className="text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  Submissions: {activeSubmissions.length} Turned In
                </div>
              </div>
            </div>

            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Student Solution & Answer Sheet Queue</h5>

            {activeSubmissions.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                No turned-in answer sheets logged for this specific assignment yet.
              </div>
            ) : (
              <div className="space-y-3">
                {activeSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{sub.studentName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({sub.submittedAt})</span>
                        {sub.status === 'GRADED' ? (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Evaluated: {sub.scoreEarned}/{selectedAssignment.maxScore} Marks
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Awaiting Evaluation
                          </span>
                        )}
                      </div>

                      {/* Answer Sheet Attachment Pill */}
                      {sub.answerSheetFile && (
                        <div className="flex items-center gap-2 text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 max-w-fit">
                          <FileCheck2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-mono text-slate-800 font-medium">{sub.answerSheetFile}</span>
                          {sub.answerSheetSize && (
                            <span className="text-[10px] text-slate-400 font-mono">({sub.answerSheetSize})</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setInspectAnswerSheetSub(sub)}
                            className="text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-0.5 ml-2 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect Sheet</span>
                          </button>
                        </div>
                      )}

                      <p className="text-xs text-slate-700">{sub.content}</p>
                      {sub.teacherFeedback && (
                        <p className="text-[11px] text-teal-800 italic">Faculty remark: {sub.teacherFeedback}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setInspectAnswerSheetSub(sub)}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect & Grade</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenGrade(sub)}
                        className="px-3.5 py-1.5 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{sub.status === 'GRADED' ? 'Edit Marks' : 'Award Marks'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Answer Sheet Inspection & Evaluation Modal */}
      {inspectAnswerSheetSub && selectedAssignment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                  Student Answer Sheet Inspector
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {inspectAnswerSheetSub.studentName} — {selectedAssignment.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Submitted: {inspectAnswerSheetSub.submittedAt} · Max Marks: {selectedAssignment.maxScore}
                </p>
              </div>
              <button
                onClick={() => setInspectAnswerSheetSub(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Simulated Answer Sheet Viewer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-teal-700" />
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 block">
                      {inspectAnswerSheetSub.answerSheetFile || `${inspectAnswerSheetSub.studentName}_AnswerSheet.pdf`}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {inspectAnswerSheetSub.answerSheetSize || '3.2 MB · 5 pages'} · Scanned Handwritten Sheet
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleSimulateDownload(
                      inspectAnswerSheetSub.answerSheetFile || 'AnswerSheet.pdf',
                      'Student Answer Sheet'
                    )
                  }
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Sheet</span>
                </button>
              </div>

              {/* Simulated Page Content */}
              <div className="border border-slate-300 rounded-xl p-5 bg-amber-50/20 font-mono text-xs text-slate-800 space-y-4">
                <div className="border-b border-slate-200 pb-2 text-[11px] text-slate-500 flex justify-between">
                  <span>Page 1 of 5 · Student Roll #10A-01</span>
                  <span>Exam Code: {selectedAssignment.subject?.toUpperCase()}-2026</span>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-slate-900">
                    Q1. (Trigonometric Derivations / Problem Proofs)
                  </p>
                  <p className="text-slate-700 pl-4 border-l-2 border-teal-500">
                    L.H.S = (sin θ / (1 + cos θ)) + ((1 + cos θ) / sin θ)<br />
                    = (sin²θ + (1 + cos θ)²) / [sin θ(1 + cos θ)]<br />
                    = (sin²θ + 1 + 2cos θ + cos²θ) / [sin θ(1 + cos θ)]<br />
                    = (2 + 2cos θ) / [sin θ(1 + cos θ)]<br />
                    = 2(1 + cos θ) / [sin θ(1 + cos θ)] = 2 / sin θ = 2 cosec θ = R.H.S [PROVED]
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-slate-900">
                    Q2. (Ray Diagram / Nature of Roots Verification)
                  </p>
                  <p className="text-slate-700 pl-4 border-l-2 border-teal-500">
                    Given quadratic equation: 3x² - 5x + 2 = 0<br />
                    Discriminant D = b² - 4ac = (-5)² - 4(3)(2) = 25 - 24 = 1 &gt; 0<br />
                    Since D &gt; 0 and a perfect square, roots are Real, Rational, and Distinct.<br />
                    x = [-(-5) ± √1] / 6 = (5 ± 1)/6 =&gt; x₁ = 1, x₂ = 2/3.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800 block mb-0.5">Student Notes:</span>
                  {inspectAnswerSheetSub.content}
                </div>
              </div>
            </div>

            {/* Grading Form Inside Inspector */}
            <form onSubmit={submitGrade} className="space-y-3 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marks Awarded (out of {selectedAssignment.maxScore})
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={selectedAssignment.maxScore}
                    value={gradeScore}
                    onChange={(e) => setGradeScore(Number(e.target.value))}
                    required
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quick Grade Action</label>
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setGradeScore(selectedAssignment.maxScore)}
                      className="px-2.5 py-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 cursor-pointer"
                    >
                      Full Marks ({selectedAssignment.maxScore})
                    </button>
                    <button
                      type="button"
                      onClick={() => setGradeScore(Math.round(selectedAssignment.maxScore * 0.9))}
                      className="px-2.5 py-1.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold hover:bg-teal-100 cursor-pointer"
                    >
                      90% ({Math.round(selectedAssignment.maxScore * 0.9)})
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher Evaluation Feedback & Notes</label>
                <textarea
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Provide precise remarks on mathematical steps and neatness..."
                  rows={2}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInspectAnswerSheetSub(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Save Evaluation & Marks</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Submission Quick Modal */}
      {activeGradingSub && selectedAssignment && !inspectAnswerSheetSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Evaluate Homework Solution</h3>
                <p className="text-xs text-slate-500">Student: {activeGradingSub.studentName} · Max {selectedAssignment.maxScore} pts</p>
              </div>
              <button
                onClick={() => setActiveGradingSub(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 mb-4 space-y-1">
              <span className="font-semibold text-slate-900 block">Student's Submitted Notes:</span>
              <p>{activeGradingSub.content}</p>
              {activeGradingSub.answerSheetFile && (
                <div className="pt-2 text-teal-800 font-medium flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Answer Sheet: {activeGradingSub.answerSheetFile}</span>
                </div>
              )}
            </div>

            <form onSubmit={submitGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Marks Awarded (out of {selectedAssignment.maxScore})
                </label>
                <input
                  type="number"
                  min={0}
                  max={selectedAssignment.maxScore}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(Number(e.target.value))}
                  required
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher Feedback & Remarks</label>
                <textarea
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Provide praise on strong derivations and corrections on flawed steps..."
                  rows={3}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveGradingSub(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
                >
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Paper Preview Modal */}
      {previewQPModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                  Question Paper Preview
                </span>
                <h3 className="text-lg font-bold text-slate-900">{previewQPModal.title}</h3>
                <p className="text-xs text-slate-500">
                  Subject: {previewQPModal.subject} · Time Allowed: 90 Minutes · Max Marks: {previewQPModal.maxScore}
                </p>
              </div>
              <button
                onClick={() => setPreviewQPModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Question Paper Sheet Render */}
            <div className="border border-slate-300 rounded-xl p-6 bg-slate-50/70 space-y-4 font-serif text-slate-900">
              <div className="text-center border-b border-slate-300 pb-3 space-y-1">
                <h4 className="font-bold text-base uppercase tracking-wider text-slate-900">
                  Academy of Academic Excellence — Coaching Center
                </h4>
                <p className="text-xs text-slate-600 font-sans">
                  Subject: {previewQPModal.subject} · Class Assessment Series
                </p>
                <div className="flex justify-between text-xs font-sans text-slate-700 pt-2 font-medium">
                  <span>File: {previewQPModal.questionPaperFile || 'Question_Paper.pdf'}</span>
                  <span>Max Marks: {previewQPModal.maxScore}</span>
                </div>
              </div>

              <div className="text-xs font-sans text-slate-600 space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold block text-slate-800">General Instructions:</span>
                <p>1. All questions are compulsory. Step-by-step working carries weightage.</p>
                <p>2. Scan your handwritten answer sheets clearly in vertical orientation before uploading.</p>
                <p>3. Due date: {previewQPModal.dueDate}</p>
              </div>

              <div className="space-y-4 font-sans text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Section A: Conceptual Derivations</span>
                    <span className="font-mono">[10 Marks]</span>
                  </div>
                  <p className="text-slate-700">
                    1. State and prove the fundamental trigonometric identities sin²θ + cos²θ = 1 and 1 + tan²θ = sec²θ using standard coordinate axes.
                  </p>
                  <p className="text-slate-700">
                    2. Derive the mirror formula 1/f = 1/v + 1/u with sign conventions for a concave mirror forming a real image.
                  </p>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-200">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Section B: Analytical Problem Solving</span>
                    <span className="font-mono">[15 Marks]</span>
                  </div>
                  <p className="text-slate-700">
                    3. Find the nature of roots for the quadratic polynomial 2x² - 6x + 3 = 0 and solve using the quadratic formula.
                  </p>
                  <p className="text-slate-700">
                    4. Calculate the equilibrium constant Kc for the reversible gas phase reaction N₂ + 3H₂ ⇌ 2NH₃ given equilibrium concentrations.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-500 font-mono">
                {previewQPModal.questionPaperSize || '1.6 MB · 4 pages'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSimulateDownload(previewQPModal.questionPaperFile || 'Question_Paper.pdf', 'Question Paper')
                  }
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewQPModal(null)}
                  className="px-4 py-2 bg-[#00695C] text-white text-xs font-semibold rounded-lg hover:bg-[#005a4e] cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
