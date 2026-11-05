import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { Assignment } from '../../types';
import { FileUploadInput } from '../common/FileUploadInput';
import { FilePreviewModal } from '../common/FilePreviewModal';
import { downloadFile } from '../../services/storageService';
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  MessageSquareQuote,
  Download,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Eye,
  FileCheck2,
  Upload
} from 'lucide-react';

export const StudentAssignmentsScreen: React.FC = () => {
  const { assignments, submitAssignment, batches } = useTuition();
  const [activeSubmission, setActiveSubmission] = useState<Assignment | null>(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [attachedAnswerSheet, setAttachedAnswerSheet] = useState('');
  const [attachedAnswerSize, setAttachedAnswerSize] = useState('2.4 MB · 5 pages');
  const [attachedAnswerUrl, setAttachedAnswerUrl] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'GRADED'>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [previewQP, setPreviewQP] = useState<Assignment | null>(null);
  const [previewAnswerSheet, setPreviewAnswerSheet] = useState<Assignment | null>(null);
  const [activeFilePreview, setActiveFilePreview] = useState<{
    url?: string;
    name: string;
    title: string;
    size?: string;
  } | null>(null);

  const pendingAssignments = assignments.filter((a) => !a.isSubmitted);
  const submittedAssignments = assignments.filter((a) => a.isSubmitted);
  const gradedAssignments = assignments.filter((a) => a.isSubmitted && a.scoreEarned != null);

  const handleOpenSubmit = (item: Assignment) => {
    setActiveSubmission(item);
    setSubmissionNote('');
    setAttachedAnswerSheet(`Aravind_Kumar_${item.subject || 'Assignment'}_Solutions.pdf`);
    setAttachedAnswerSize('2.4 MB · 5 pages');
    setAttachedAnswerUrl(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;
    submitAssignment(
      activeSubmission.id,
      submissionNote.trim() || 'Completed all assigned questions and step derivations.',
      attachedAnswerSheet.trim() || 'Aravind_Kumar_AnswerSheet.pdf',
      attachedAnswerSize.trim() || '2.4 MB · 5 pages',
      attachedAnswerUrl
    );
    setActiveSubmission(null);
    setSubmissionNote('');
    setAttachedAnswerUrl(undefined);
  };

  const handleDownloadFile = (filename: string, fileType: string) => {
    setDownloadNotice(`Downloading ${fileType}: ${filename}`);
    setTimeout(() => setDownloadNotice(null), 3500);
  };

  const allSubjects = ['ALL', 'Mathematics', 'Physics', 'Chemistry', 'Biology'];

  // Filter assignments
  const filteredAssignments = assignments.filter((item) => {
    // Status filter
    if (statusFilter === 'PENDING' && item.isSubmitted) return false;
    if (statusFilter === 'SUBMITTED' && (!item.isSubmitted || item.scoreEarned != null)) return false;
    if (statusFilter === 'GRADED' && (!item.isSubmitted || item.scoreEarned == null)) return false;

    // Subject filter
    if (subjectFilter !== 'ALL' && item.subject !== subjectFilter) return false;

    return true;
  });

  const getSubjectColor = (subject?: string) => {
    switch (subject) {
      case 'Mathematics':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Physics':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'Chemistry':
        return 'text-teal-700 bg-teal-50 border-teal-200';
      case 'Biology':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getBatchName = (batchId: string) => {
    const b = batches.find((x) => x.id === batchId);
    return b ? b.title : 'General Batch';
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Upcoming Deadlines KPI Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-blue-300 font-semibold">
              Homework & Continuous Evaluation
            </span>
            <h2 className="text-2xl font-bold tracking-tight">Your Question Papers & Answer Sheets</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span>{pendingAssignments.length} Pending Tasks</span>
              <span aria-hidden="true">·</span>
              <span>{submittedAssignments.length} Submitted</span>
              <span aria-hidden="true">·</span>
              <span>{gradedAssignments.length} Evaluated</span>
            </div>
          </div>

          {/* Earliest Deadline Card */}
          <div className="flex items-center gap-4 bg-slate-800/90 px-4 py-3 rounded-xl border border-slate-700">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Nearest Upcoming Deadline</span>
              <div className="text-sm font-bold text-amber-300">
                {pendingAssignments.length > 0 ? pendingAssignments[0].dueDate : 'All caught up!'}
              </div>
              <span className="text-[10px] text-slate-400 truncate max-w-[180px] block">
                {pendingAssignments.length > 0 ? pendingAssignments[0].title : 'No pending submissions'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {downloadNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2 shadow-2xs">
          <Download className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Filter and View Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Segmented Buttons */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({assignments.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingAssignments.length})
            </button>
            <button
              onClick={() => setStatusFilter('SUBMITTED')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'SUBMITTED'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Under Review ({submittedAssignments.filter((a) => a.scoreEarned == null).length})
            </button>
            <button
              onClick={() => setStatusFilter('GRADED')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'GRADED'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Graded ({gradedAssignments.length})
            </button>
          </div>

          {/* Subject Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
            {allSubjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSubjectFilter(sub)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  subjectFilter === sub
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {sub === 'ALL' ? 'All Subjects' : sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Homework Task Cards List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
            No assignments match the selected filter criteria.
          </div>
        ) : (
          filteredAssignments.map((item) => {
            const isDueSoon = !item.isSubmitted && (item.dueDate.includes('Tomorrow') || item.dueDate.includes('Today'));

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors space-y-3.5"
              >
                {/* Header Row: Title, Batch, Status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                      {item.subject && (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getSubjectColor(item.subject)}`}>
                          {item.subject}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{getBatchName(item.batchId)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Max {item.maxScore} marks</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.submissionsCount || 0} students turned in</span>
                    </div>
                  </div>

                  {/* Submission Status Badge */}
                  <div className="self-start sm:self-center shrink-0">
                    {item.isSubmitted ? (
                      item.scoreEarned != null ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-[#2E7D32] border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Graded: {item.scoreEarned}/{item.maxScore}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Submitted (Under Review)</span>
                        </span>
                      )
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                          isDueSoon
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isDueSoon ? <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> : <Clock className="w-3.5 h-3.5" />}
                        <span>Pending Submission</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Instructions / Description Box */}
                <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <span className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                    Task Instructions & Problems
                  </span>
                  <p>{item.description}</p>
                </div>

                {/* Teacher Question Paper Attachment Box */}
                {item.questionPaperFile && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs bg-teal-50/70 p-3 rounded-xl border border-teal-200">
                    <div className="flex items-center gap-2 text-teal-950">
                      <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                      <div>
                        <span className="font-semibold block text-slate-900">
                          Official Question Paper:{' '}
                          <span className="font-mono text-teal-900">{item.questionPaperFile}</span>
                        </span>
                        <span className="text-[11px] text-teal-800">
                          {item.questionPaperSize || '1.5 MB · 3 pages'} · Solve on paper and upload scanned answer sheet below
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.questionPaperUrl) {
                            setActiveFilePreview({
                              url: item.questionPaperUrl,
                              name: item.questionPaperFile || 'Question_Paper.pdf',
                              title: `Question Paper: ${item.title}`,
                              size: item.questionPaperSize
                            });
                          } else {
                            setPreviewQP(item);
                          }
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-teal-700" />
                        <span>Preview Paper</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.questionPaperUrl) {
                            downloadFile(item.questionPaperUrl, item.questionPaperFile || 'Question_Paper.pdf');
                          } else {
                            handleDownloadFile(item.questionPaperFile!, 'Question Paper');
                          }
                        }}
                        className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download QP</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Reference File Download (if attached by teacher) */}
                {item.referenceFile && (
                  <div className="flex items-center justify-between text-xs bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-900">
                      <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        Teacher Reference Material: <span className="font-mono font-semibold">{item.referenceFile}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(item.referenceFile!, 'Reference Material')}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                )}

                {/* Student's Turned-in Content & Answer Sheet Details */}
                {item.isSubmitted && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    {/* Turned-in Answer Sheet Box */}
                    {item.answerSheetFile && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              Your Turned-in Answer Sheet: <span className="font-mono">{item.answerSheetFile}</span>
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {item.answerSheetSize || '2.4 MB · 5 pages'}
                              {item.submissionDate ? ` · Uploaded on ${item.submissionDate}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.answerSheetUrl) {
                                setActiveFilePreview({
                                  url: item.answerSheetUrl,
                                  name: item.answerSheetFile || 'AnswerSheet.pdf',
                                  title: `Your Answer Sheet: ${item.title}`,
                                  size: item.answerSheetSize
                                });
                              } else {
                                setPreviewAnswerSheet(item);
                              }
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span>View Sheet</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (item.answerSheetUrl) {
                                downloadFile(item.answerSheetUrl, item.answerSheetFile || 'AnswerSheet.pdf');
                              } else {
                                handleDownloadFile(item.answerSheetFile!, 'Your Answer Sheet');
                              }
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3 text-slate-500" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {item.submissionNote && (
                      <div className="text-slate-600 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-800 block mb-0.5">Solution Notes:</span>
                        <p>{item.submissionNote}</p>
                      </div>
                    )}

                    {item.teacherFeedback && (
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-emerald-950 flex items-start gap-2.5">
                        <MessageSquareQuote className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-emerald-900 block mb-0.5">
                            Teacher Evaluation Feedback ({item.scoreEarned}/{item.maxScore} Marks):
                          </span>
                          <p>{item.teacherFeedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Bar with Deadline Details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Submission Cutoff: </span>
                    <span className={`font-semibold ${isDueSoon ? 'text-amber-800' : 'text-slate-800'}`}>
                      {item.dueDate}
                    </span>
                  </div>

                  {!item.isSubmitted ? (
                    <button
                      onClick={() => handleOpenSubmit(item)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs self-end sm:self-center cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Answer Sheet</span>
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-semibold self-end sm:self-center flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Answer Sheet Submitted</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Answer Sheet Modal */}
      {activeSubmission && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  Answer Sheet Submission
                </span>
                <h3 className="text-lg font-bold text-slate-900">{activeSubmission.title}</h3>
                <p className="text-xs text-slate-500">
                  Subject: {activeSubmission.subject} · Cutoff: {activeSubmission.dueDate} · Max {activeSubmission.maxScore} pts
                </p>
              </div>
              <button
                onClick={() => setActiveSubmission(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Question Paper Reference Reminder */}
              {activeSubmission.questionPaperFile && (
                <div className="bg-teal-50 p-2.5 rounded-lg border border-teal-200 text-xs flex items-center justify-between text-teal-950">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>Question Paper: <span className="font-mono font-bold">{activeSubmission.questionPaperFile}</span></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewQP(activeSubmission)}
                    className="text-[11px] font-bold text-teal-800 hover:underline cursor-pointer"
                  >
                    View Paper
                  </button>
                </div>
              )}

              {/* Upload Scanned Answer Sheet File Box with Firebase Storage */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                <FileUploadInput
                  label="Upload Scanned Answer Sheet Document"
                  folder="answer_sheets"
                  currentFileName={attachedAnswerSheet}
                  currentFileSize={attachedAnswerSize}
                  currentFileUrl={attachedAnswerUrl}
                  onFileUploaded={(res) => {
                    setAttachedAnswerSheet(res.fileName);
                    setAttachedAnswerSize(res.fileSizeFormatted);
                    setAttachedAnswerUrl(res.downloadUrl);
                  }}
                  accentColor="blue"
                  required
                />
                <span className="text-[11px] text-slate-500 block">
                  Tip: Upload your handwritten solution as PDF or clear photos (max 10 MB). Ensure questions are numbered clearly.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Solution Notes & Comments for Faculty
                </label>
                <textarea
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  placeholder="Detail tricky derivations, questions skipped, or questions where alternative proofs were used..."
                  rows={3}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubmission(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Answer Sheet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Paper Preview Modal for Students */}
      {previewQP && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  Question Paper Viewer
                </span>
                <h3 className="text-lg font-bold text-slate-900">{previewQP.title}</h3>
                <p className="text-xs text-slate-500">
                  Subject: {previewQP.subject} · Total Marks: {previewQP.maxScore} · Due: {previewQP.dueDate}
                </p>
              </div>
              <button
                onClick={() => setPreviewQP(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Paper Sheet Rendering */}
            <div className="border border-slate-300 rounded-xl p-6 bg-slate-50/70 space-y-4 font-serif text-slate-900">
              <div className="text-center border-b border-slate-300 pb-3 space-y-1">
                <h4 className="font-bold text-base uppercase tracking-wider text-slate-900">
                  Tuition Institute Academic Board Assessment
                </h4>
                <p className="text-xs text-slate-600 font-sans">
                  Subject: {previewQP.subject} · Time Allowed: 90 Minutes
                </p>
                <div className="flex justify-between text-xs font-sans text-slate-700 pt-2 font-medium">
                  <span>Attachment: {previewQP.questionPaperFile || 'Question_Paper.pdf'}</span>
                  <span>Maximum Marks: {previewQP.maxScore}</span>
                </div>
              </div>

              <div className="text-xs font-sans text-slate-600 space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold block text-slate-800">Student Instructions:</span>
                <p>1. Solve on clean ruled sheets. Mention your full name and Roll Number on each page.</p>
                <p>2. Scan in upright orientation and compile into a single PDF before uploading.</p>
              </div>

              <div className="space-y-4 font-sans text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Part I: Derivations and Theoretical Proofs</span>
                    <span className="font-mono">[10 Marks]</span>
                  </div>
                  <p className="text-slate-700">
                    1. Prove that sin θ / (1 + cos θ) + (1 + cos θ) / sin θ = 2 cosec θ. Show all algebraic steps.
                  </p>
                  <p className="text-slate-700">
                    2. State Snell's law of refraction and derive the relation between critical angle and refractive index.
                  </p>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-200">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Part II: Numerical Calculations & Problem Set</span>
                    <span className="font-mono">[15 Marks]</span>
                  </div>
                  <p className="text-slate-700">
                    3. Determine whether the equation 2x² - 4x + 3 = 0 has real roots without evaluating the square root explicitly.
                  </p>
                  <p className="text-slate-700">
                    4. Explain Le Chatelier's principle and predict the effect of increasing pressure on the yield of ammonia in the Haber process.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-500 font-mono">
                {previewQP.questionPaperSize || '1.5 MB · 3 pages'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (previewQP.questionPaperUrl) {
                      downloadFile(previewQP.questionPaperUrl, previewQP.questionPaperFile || 'Question_Paper.pdf');
                    } else {
                      handleDownloadFile(previewQP.questionPaperFile || 'Question_Paper.pdf', 'Question Paper');
                    }
                  }}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewQP(null)}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Answer Sheet Preview Modal for Students */}
      {previewAnswerSheet && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  Your Turned-in Answer Sheet
                </span>
                <h3 className="text-lg font-bold text-slate-900">{previewAnswerSheet.title}</h3>
                <p className="text-xs text-slate-500">
                  Uploaded File: {previewAnswerSheet.answerSheetFile} ({previewAnswerSheet.answerSheetSize || '2.4 MB · 5 pages'})
                </p>
              </div>
              <button
                onClick={() => setPreviewAnswerSheet(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs space-y-3">
              <div className="flex justify-between text-slate-500 border-b border-slate-200 pb-2 text-[11px]">
                <span>Student: Aravind Kumar (Roll #10A-01)</span>
                <span>Verified Upload</span>
              </div>
              <p className="text-slate-800">
                Document: <span className="font-bold text-blue-900">{previewAnswerSheet.answerSheetFile}</span><br />
                Status: {previewAnswerSheet.scoreEarned != null ? `Graded (${previewAnswerSheet.scoreEarned}/${previewAnswerSheet.maxScore})` : 'Submitted (Awaiting Faculty Grade)'}<br />
                Submission Time: {previewAnswerSheet.submissionDate || 'Recent'}
              </p>
              {previewAnswerSheet.submissionNote && (
                <div className="bg-white p-3 rounded border border-slate-200 text-slate-700">
                  <span className="font-bold block mb-1">Your Attached Notes:</span>
                  {previewAnswerSheet.submissionNote}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (previewAnswerSheet.answerSheetUrl) {
                    downloadFile(previewAnswerSheet.answerSheetUrl, previewAnswerSheet.answerSheetFile || 'AnswerSheet.pdf');
                  } else {
                    handleDownloadFile(previewAnswerSheet.answerSheetFile!, 'Answer Sheet');
                  }
                }}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Copy</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewAnswerSheet(null)}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real File Preview Modal */}
      <FilePreviewModal
        isOpen={!!activeFilePreview}
        onClose={() => setActiveFilePreview(null)}
        fileUrl={activeFilePreview?.url}
        fileName={activeFilePreview?.name || 'Document'}
        title={activeFilePreview?.title}
        fileSize={activeFilePreview?.size}
      />
    </div>
  );
};
