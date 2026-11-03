import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { CourseBatch, StudentNavScreen } from '../../types';
import { VirtualClassroomModal } from '../classroom/VirtualClassroomModal';
import { ParentAccessCard } from './ParentAccessCard';
import {
  Clock,
  User,
  MapPin,
  Video,
  Bell,
  BookOpen,
  FileSpreadsheet,
  HelpCircle,
  Plus,
  CheckCircle2,
  Send,
  MessageSquareQuote,
  Calendar
} from 'lucide-react';

interface StudentDashboardScreenProps {
  onNavigate?: (screen: StudentNavScreen) => void;
}

export const StudentDashboardScreen: React.FC<StudentDashboardScreenProps> = ({ onNavigate }) => {
  const {
    batches,
    announcements,
    attendanceRecords,
    assignments,
    doubts,
    askDoubt,
    resources,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead
  } = useTuition();
  const [selectedBatch, setSelectedBatch] = useState<CourseBatch | null>(null);
  const [activeDayFilter, setActiveDayFilter] = useState<string>('All');
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('ALL');
  const [showDoubtModal, setShowDoubtModal] = useState(false);
  const [doubtSubject, setDoubtSubject] = useState('Mathematics');
  const [doubtTopic, setDoubtTopic] = useState('');
  const [doubtQuestion, setDoubtQuestion] = useState('');
  const [doubtSuccess, setDoubtSuccess] = useState(false);

  // Filter student doubts
  const studentDoubts = doubts.filter((d) => d.studentId === 's1');

  // Compute overall attendance % from student's records
  const studentRecords = attendanceRecords.filter((r) => r.studentId === 's1');
  const presentCount = studentRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const attendancePercent = studentRecords.length > 0
    ? ((presentCount / studentRecords.length) * 100).toFixed(1)
    : '91.4';

  const pendingAssignmentsCount = assignments.filter((a) => !a.isSubmitted).length;

  const filteredBatches = batches.filter((b) => {
    if (activeDayFilter !== 'All' && !b.days?.includes(activeDayFilter)) return false;
    const batchSub = b.subject === 'Math' ? 'Mathematics' : b.subject;
    if (activeSubjectFilter !== 'ALL' && batchSub !== activeSubjectFilter) return false;
    return true;
  });

  const handleAskDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtTopic.trim() || !doubtQuestion.trim()) return;

    askDoubt({
      studentId: 's1',
      studentName: 'Aravind Kumar',
      subject: doubtSubject,
      topic: doubtTopic.trim(),
      question: doubtQuestion.trim()
    });

    setDoubtTopic('');
    setDoubtQuestion('');
    setShowDoubtModal(false);
    setDoubtSuccess(true);
    setTimeout(() => setDoubtSuccess(false), 4000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Student Hero Banner */}
      <div className="rounded-2xl p-6 text-white shadow-md bg-gradient-to-r from-blue-600 via-blue-700 to-teal-700 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back, Aravind!</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-blue-100 font-medium">
              <span>Grade 10 State Board</span>
              <span aria-hidden="true">·</span>
              <span>Batch A (2026–27)</span>
              <span aria-hidden="true">·</span>
              <span>Roll #10A-01</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20">
            <div>
              <span className="text-[11px] text-blue-100 block font-medium">Attendance Rate</span>
              <span className="text-xl font-bold font-mono tabular-nums">{attendancePercent}%</span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <span className="text-[11px] text-blue-100 block font-medium">Pending Tasks</span>
              <span className="text-xl font-bold font-mono tabular-nums">{pendingAssignmentsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements Stream */}
      {announcements.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-700 shrink-0" />
                <h4 className="font-semibold text-amber-950 text-sm">{announcements[0].title}</h4>
                <span className="text-[11px] text-amber-700/80 font-mono">({announcements[0].timestamp})</span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed pl-6">{announcements[0].message}</p>
            </div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md shrink-0">
              Notice
            </span>
          </div>
        </div>
      )}

      {/* Live Faculty Alerts for Assignments & Materials */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                <Bell className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Live Faculty Alerts & Tasks</h3>
              {unreadNotificationsCount > 0 && (
                <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md font-mono">
                  {unreadNotificationsCount} unread
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 font-mono">Real-time sync</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {notifications.slice(0, 2).map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  markNotificationAsRead(notif.id);
                  if (notif.actionScreen && onNavigate) onNavigate(notif.actionScreen);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                  !notif.read
                    ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        notif.type === 'HOMEWORK_POSTED'
                          ? 'text-blue-700 bg-blue-50 border-blue-200'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      {notif.type === 'HOMEWORK_POSTED' ? 'New Assignment' : 'Material Shared'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{notif.timestamp}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{notif.title}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{notif.message}</p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500 font-medium">By {notif.authorName}</span>
                  <span className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
                    <span>{notif.actionScreen === 'ASSIGNMENTS' ? 'View Homework' : 'Open Material'}</span>
                    <span aria-hidden="true">&rarr;</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Classes & Timetable Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Your Enrolled Batches</h3>
            <p className="text-xs text-slate-500">Live lecture schedules, meeting rooms, and syllabus milestones</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {onNavigate && (
              <button
                onClick={() => onNavigate('CALENDAR')}
                className="px-3 py-1 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Dynamic Calendar & Rooms</span>
              </button>
            )}

            {/* Day Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              {['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <button
                  key={day}
                  onClick={() => setActiveDayFilter(day)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    activeDayFilter === day
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subject-Wise Class Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium mr-1">Subject Specialization:</span>
          {['ALL', 'Mathematics', 'Physics', 'Chemistry', 'Biology'].map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubjectFilter(sub)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeSubjectFilter === sub
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {sub === 'ALL' ? 'All Subjects' : sub}
            </button>
          ))}
        </div>

        {/* Batches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredBatches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:border-blue-400 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{batch.title}</h4>
                    <span className="text-xs text-slate-500 font-medium">{batch.subject} Faculty</span>
                  </div>
                  <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-100">
                    {batch.roomOrMeetingLink}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{batch.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-teal-800 font-medium">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>{batch.scheduleTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Days: {batch.days?.join(', ')}</span>
                  </div>
                </div>

                {/* Syllabus Progress */}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Syllabus Covered</span>
                    <span className="font-mono font-bold text-slate-700">{batch.syllabusProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${batch.syllabusProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-1">
                    Next: <span className="text-slate-800 font-medium">{batch.nextTopic}</span>
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-3">
                <button
                  onClick={() => setSelectedBatch(batch)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Enter Session Room</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Study Materials & Revision Hub */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-700" />
            <h4 className="font-bold text-slate-900 text-sm">Course Study Materials & Shared Links</h4>
          </div>
          {onNavigate ? (
            <button
              onClick={() => onNavigate('RESOURCES')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>View All ({resources.length})</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500 font-mono tabular-nums">{resources.length} materials</span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {resources.slice(0, 3).map((res) => (
            <div
              key={res.id}
              onClick={() => onNavigate?.('RESOURCES')}
              className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex items-center justify-between hover:border-blue-400 hover:shadow-2xs transition-all cursor-pointer"
            >
              <div className="space-y-0.5 truncate pr-2">
                <span className="font-semibold text-slate-900 block truncate">{res.title}</span>
                <span className="text-slate-500 text-[11px] block truncate">
                  {res.subject} · {res.fileSizeOrDuration || res.type}
                </span>
              </div>
              <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Academic Doubts & Faculty Answers Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm">Academic Doubts & Faculty Guidance</h4>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ask questions on complex derivations or practice problems directly to course teachers
            </p>
          </div>

          <button
            onClick={() => setShowDoubtModal(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-center"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ask a Doubt</span>
          </button>
        </div>

        {doubtSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Your doubt has been submitted to the faculty! You'll receive a response here shortly.</span>
          </div>
        )}

        {studentDoubts.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            You haven't asked any doubts yet. Click "Ask a Doubt" to get help from your teachers.
          </div>
        ) : (
          <div className="space-y-3">
            {studentDoubts.map((d) => (
              <div key={d.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{d.topic}</span>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {d.subject}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">Asked {d.askedAt}</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold self-start sm:self-center border ${
                      d.isResolved
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {d.isResolved ? 'Resolved by Teacher' : 'Pending Faculty Review'}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800 block text-[11px] mb-0.5">Your Question:</span>
                  {d.question}
                </p>

                {d.reply && (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-950 space-y-1">
                    <div className="flex items-center gap-1.5 text-teal-800 font-bold text-[11px]">
                      <MessageSquareQuote className="w-3.5 h-3.5" />
                      <span>Faculty Answer ({d.repliedBy}) · {d.repliedAt}</span>
                    </div>
                    <p className="leading-relaxed pl-5">{d.reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parent Access & Link Code Section (From Zip Upgrade) */}
      <ParentAccessCard />

      {/* Ask Doubt Modal */}
      {showDoubtModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  Academic Help
                </span>
                <h3 className="text-lg font-bold text-slate-900">Ask Faculty a Question</h3>
              </div>
              <button
                onClick={() => setShowDoubtModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAskDoubt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  value={doubtSubject}
                  onChange={(e) => setDoubtSubject(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic / Chapter Name</label>
                <input
                  type="text"
                  value={doubtTopic}
                  onChange={(e) => setDoubtTopic(e.target.value)}
                  placeholder="e.g., Trigonometric Identities Exercise 4.2"
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Question or Doubt</label>
                <textarea
                  value={doubtQuestion}
                  onChange={(e) => setDoubtQuestion(e.target.value)}
                  placeholder="Describe where you got stuck or what step in the formula derivation needs clarification..."
                  rows={4}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDoubtModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Question</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Virtual Classroom Whiteboard & Lecture Modal */}
      {selectedBatch && (
        <VirtualClassroomModal
          batch={selectedBatch}
          onClose={() => setSelectedBatch(null)}
          isTeacher={false}
        />
      )}
    </div>
  );
};
