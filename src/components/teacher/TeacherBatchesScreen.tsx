import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { CourseBatch, TeacherNavScreen } from '../../types';
import {
  Clock,
  MapPin,
  Bell,
  Plus,
  CheckCircle2,
  Users,
  Calendar,
  Filter,
  GraduationCap
} from 'lucide-react';

interface TeacherBatchesScreenProps {
  onNavigate?: (screen: TeacherNavScreen) => void;
}

export const TeacherBatchesScreen: React.FC<TeacherBatchesScreenProps> = ({ onNavigate }) => {
  const { batches, announcements, addAnnouncement, scheduleSlots, rooms, addBatch } = useTuition();
  const [selectedBatch, setSelectedBatch] = useState<CourseBatch | null>(null);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');

  // Announcement state
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceMsg, setAnnounceMsg] = useState('');
  const [announcePriority, setAnnouncePriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [announceSuccess, setAnnounceSuccess] = useState(false);

  // New Subject Class form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newTeacherName, setNewTeacherName] = useState('Mr. Kingslin');
  const [newScheduleTime, setNewScheduleTime] = useState('04:30 PM - 05:45 PM');
  const [newDays, setNewDays] = useState<string[]>(['Mon', 'Wed']);
  const [newRoom, setNewRoom] = useState('Room 101');
  const [newStudentsCount, setNewStudentsCount] = useState(16);
  const [newGradeLevel, setNewGradeLevel] = useState('Grade 10');
  const [newNextTopic, setNewNextTopic] = useState('Introductory Concepts & Fundamentals');
  const [batchCreatedNotice, setBatchCreatedNotice] = useState(false);

  const totalStudents = batches.reduce((acc, curr) => acc + curr.activeStudentCount, 0);

  const allSubjects = ['ALL', 'Mathematics', 'Physics', 'Chemistry', 'Biology'];

  const filteredBatches = batches.filter((b) => {
    if (subjectFilter === 'ALL') return true;
    const batchSub = b.subject === 'Math' ? 'Mathematics' : b.subject;
    return batchSub === subjectFilter;
  });

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle.trim() || !announceMsg.trim()) return;

    addAnnouncement({
      title: announceTitle.trim(),
      message: announceMsg.trim(),
      authorName: 'Mr. Kingslin',
      priority: announcePriority
    });

    setAnnounceTitle('');
    setAnnounceMsg('');
    setShowAnnounceModal(false);
    setAnnounceSuccess(true);
    setTimeout(() => setAnnounceSuccess(false), 4000);
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addBatch({
      title: newTitle.trim(),
      subject: newSubject,
      teacherName: newTeacherName.trim() || 'Mr. Kingslin',
      scheduleTime: newScheduleTime.trim() || '04:30 PM - 05:45 PM',
      days: newDays.length > 0 ? newDays : ['Mon', 'Wed'],
      activeStudentCount: Number(newStudentsCount) || 15,
      roomOrMeetingLink: newRoom,
      syllabusProgress: 10,
      nextTopic: newNextTopic.trim() || 'Introductory Concepts',
      gradeLevel: newGradeLevel,
      textbookOrSyllabus: `${newSubject} Standard Syllabus & Board Materials`
    });

    setNewTitle('');
    setShowCreateBatchModal(false);
    setBatchCreatedNotice(true);
    setTimeout(() => setBatchCreatedNotice(false), 4000);
  };

  const toggleDay = (day: string) => {
    setNewDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const sampleRoster = [
    { id: 's1', name: 'Aravind Kumar', attendance: '91.4%', status: 'Active' },
    { id: 's2', name: 'Divya Sharma', attendance: '96.2%', status: 'Active' },
    { id: 's3', name: 'Ganesh Raman', attendance: '78.5%', status: 'Warning' },
    { id: 's4', name: 'Kavitha Selvam', attendance: '94.0%', status: 'Active' },
    { id: 's5', name: 'Pradeep Raj', attendance: '88.3%', status: 'Active' }
  ];

  const getSubjectColor = (sub: string) => {
    switch (sub) {
      case 'Mathematics':
      case 'Math':
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

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Teacher Console Banner (primary: #00695C) */}
      <div className="bg-[#00695C] rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Subject-Wise Classes & Batches</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-teal-100 font-medium">
              <span>{batches.length} Active Subject Batches</span>
              <span aria-hidden="true">·</span>
              <span>{totalStudents} Enrolled Students</span>
              <span aria-hidden="true">·</span>
              <span>{scheduleSlots.length} Scheduled Slots</span>
              <span aria-hidden="true">·</span>
              <span>{rooms.length} Classrooms</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {onNavigate && (
              <button
                onClick={() => onNavigate('CALENDAR')}
                className="px-3.5 py-2 bg-teal-800/80 hover:bg-teal-700/90 text-white text-xs font-semibold rounded-lg border border-teal-600 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-teal-200" />
                <span>Calendar & Rooms</span>
              </button>
            )}

            <button
              onClick={() => setShowCreateBatchModal(true)}
              className="px-4 py-2 bg-white text-[#00695C] hover:bg-teal-50 active:bg-teal-100 text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create Subject Class</span>
            </button>

            <button
              onClick={() => setShowAnnounceModal(true)}
              className="px-3.5 py-2 bg-teal-800/80 hover:bg-teal-700/90 text-white text-xs font-semibold rounded-lg border border-teal-600 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-teal-200" />
              <span>Broadcast Notice</span>
            </button>
          </div>
        </div>
      </div>

      {batchCreatedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>New subject class successfully created and added to faculty timetable!</span>
        </div>
      )}

      {announceSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>New announcement broadcasted to all enrolled students and guardians!</span>
        </div>
      )}

      {/* Subject-Wise Filters & Batches Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Active Subject Classes</h3>
            <p className="text-xs text-slate-500">Filter classes by subject specialization or create new subject batches</p>
          </div>

          {/* Subject Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {allSubjects.map((sub) => {
              const count =
                sub === 'ALL'
                  ? batches.length
                  : batches.filter((b) => (b.subject === 'Math' ? 'Mathematics' : b.subject) === sub).length;

              return (
                <button
                  key={sub}
                  onClick={() => setSubjectFilter(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    subjectFilter === sub
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{sub === 'ALL' ? 'All Subjects' : sub}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      subjectFilter === sub ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredBatches.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500 text-xs space-y-2">
            <p>No classes scheduled under {subjectFilter} yet.</p>
            <button
              onClick={() => {
                setNewSubject(subjectFilter === 'ALL' ? 'Mathematics' : subjectFilter);
                setShowCreateBatchModal(true);
              }}
              className="text-teal-700 font-bold hover:underline cursor-pointer"
            >
              + Create a new {subjectFilter} class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBatches.map((batch) => {
              const displaySubject = batch.subject === 'Math' ? 'Mathematics' : batch.subject;

              return (
                <div
                  key={batch.id}
                  className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:border-teal-400 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSubjectColor(displaySubject)}`}>
                            {displaySubject}
                          </span>
                          {batch.gradeLevel && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              {batch.gradeLevel}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-base">{batch.title}</h4>
                        <span className="text-xs text-slate-500 font-medium">Faculty: {batch.teacherName}</span>
                      </div>
                      <span className="bg-teal-50 text-[#00695C] border border-teal-200 text-xs font-bold px-2 py-0.5 rounded shrink-0 font-mono">
                        {batch.activeStudentCount} Students
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{batch.scheduleTime} ({batch.days?.join(', ')})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Room: {batch.roomOrMeetingLink}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>Curriculum Syllabus</span>
                        <span className="font-mono font-bold text-teal-900">{batch.syllabusProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#00695C] h-full rounded-full transition-all"
                          style={{ width: `${batch.syllabusProgress}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-1">
                        Next: <span className="text-slate-800 font-medium">{batch.nextTopic}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedBatch(batch)}
                      className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-[#00695C] border border-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Inspect Batch Roster</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Center Announcements History */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-teal-800" />
            <h4 className="font-bold text-slate-900 text-sm">Center & Batch Notices</h4>
          </div>
          <span className="text-xs text-slate-400 font-medium">{announcements.length} broadcasts active</span>
        </div>

        <div className="space-y-2.5">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">{ann.title}</span>
                  <span className="text-[11px] text-slate-400 font-mono">({ann.timestamp})</span>
                </div>
                <p className="text-xs text-slate-600">{ann.message}</p>
              </div>
              <span className="text-[10px] font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 self-start sm:self-center shrink-0">
                Author: {ann.authorName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Create Subject Class Modal */}
      {showCreateBatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                  Faculty Scheduling
                </span>
                <h3 className="text-lg font-bold text-slate-900">Create New Subject Class</h3>
                <p className="text-xs text-slate-500">Configure new specialized batch timings, classroom, and curriculum</p>
              </div>
              <button
                onClick={() => setShowCreateBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Specialization</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade Level</label>
                  <select
                    value={newGradeLevel}
                    onChange={(e) => setNewGradeLevel(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="Grade 9">Grade 9 Foundation</option>
                    <option value="Grade 10">Grade 10 Board</option>
                    <option value="Grade 11">Grade 11 Senior</option>
                    <option value="Grade 12">Grade 12 Competitive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Grade 10 Biology - Genetics & Organisms"
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty / Teacher</label>
                  <input
                    type="text"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    placeholder="e.g., Dr. Preethi / Mr. Kingslin"
                    required
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Allocated Classroom / Lab</label>
                  <select
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.name.split(' (')[0]}>
                        {r.name} (Cap: {r.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class Schedule Time</label>
                  <input
                    type="text"
                    value={newScheduleTime}
                    onChange={(e) => setNewScheduleTime(e.target.value)}
                    placeholder="e.g., 03:00 PM - 04:15 PM"
                    required
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Student Capacity</label>
                  <input
                    type="number"
                    min={5}
                    max={40}
                    value={newStudentsCount}
                    onChange={(e) => setNewStudentsCount(Number(e.target.value))}
                    required
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Days of Week</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => {
                    const isSelected = newDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#00695C] text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Syllabus Topic</label>
                <input
                  type="text"
                  value={newNextTopic}
                  onChange={(e) => setNewNextTopic(e.target.value)}
                  placeholder="e.g., Cellular Structure & Microscope Lab"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateBatchModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Create Class</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Roster Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedBatch.title} Roster</h3>
                <p className="text-xs text-slate-500">
                  {selectedBatch.subject} · {selectedBatch.scheduleTime} · {selectedBatch.roomOrMeetingLink}
                </p>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Student Name</th>
                    <th className="py-2.5 px-3 text-center">Attendance</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sampleRoster.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{st.name}</td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-700">{st.attendance}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {st.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedBatch(null)}
                className="px-4 py-2 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Announcement Modal */}
      {showAnnounceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Broadcast Batch Notice</h3>
                <p className="text-xs text-slate-500">Will appear instantly on all student dashboards</p>
              </div>
              <button
                onClick={() => setShowAnnounceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  placeholder="e.g., Saturday Revision Test Rescheduled"
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Details</label>
                <textarea
                  value={announceMsg}
                  onChange={(e) => setAnnounceMsg(e.target.value)}
                  placeholder="State timings, room modifications, materials required, or special instructions..."
                  rows={4}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={announcePriority}
                  onChange={(e) => setAnnouncePriority(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                >
                  <option value="NORMAL">Normal Routine</option>
                  <option value="HIGH">High Priority (Exam / Urgent)</option>
                  <option value="URGENT">Urgent Alert</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnounceModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
                >
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
