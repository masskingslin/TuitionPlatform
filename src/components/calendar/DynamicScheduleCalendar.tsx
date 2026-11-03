import React, { useState, useMemo } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { ScheduleSlot, DayOfWeek, ClassroomRoom } from '../../types';
import {
  Clock,
  MapPin,
  Building2,
  Users,
  Plus,
  CheckCircle2,
  AlertTriangle,
  DoorOpen,
  Filter,
  Trash2,
  Edit2,
  Info,
  LayoutGrid,
  ListFilter,
  Check
} from 'lucide-react';

interface DynamicScheduleCalendarProps {
  isTeacher?: boolean;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DynamicScheduleCalendar: React.FC<DynamicScheduleCalendarProps> = ({
  isTeacher = false
}) => {
  const {
    scheduleSlots,
    rooms,
    batches,
    currentStudent,
    currentTeacher,
    addScheduleSlot,
    updateScheduleSlot,
    deleteScheduleSlot,
    checkRoomAvailability
  } = useTuition();

  const [selectedDay, setSelectedDay] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST' | 'ROOMS'>('GRID');
  const [studentOnlyMyBatches, setStudentOnlyMyBatches] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [selectedRoomDetail, setSelectedRoomDetail] = useState<ClassroomRoom | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for Add / Edit slot
  const [formBatchId, setFormBatchId] = useState<string>('b1');
  const [formDay, setFormDay] = useState<DayOfWeek>('Mon');
  const [formStartTime, setFormStartTime] = useState<string>('17:00');
  const [formEndTime, setFormEndTime] = useState<string>('18:30');
  const [formDisplayTime, setFormDisplayTime] = useState<string>('05:00 PM - 06:30 PM');
  const [formRoomId, setFormRoomId] = useState<string>('r1');
  const [formLocationNotes, setFormLocationNotes] = useState<string>('Main Academic Block · Floor 1');

  // Student enrolled courses: ['Grade 10 Mathematics', 'Physics Fundamentals', 'Chemistry & Reactions', 'Biology & Life Systems']
  const studentEnrolledSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];

  // Filter schedule slots
  const filteredSlots = useMemo(() => {
    return scheduleSlots.filter((slot) => {
      // Day filter
      if (selectedDay !== 'All' && slot.day !== selectedDay) return false;

      // Subject filter
      if (selectedSubject !== 'ALL' && slot.subject !== selectedSubject) return false;

      // Room filter
      if (selectedRoomId !== 'ALL' && slot.roomId !== selectedRoomId) return false;

      // Student view: filter by enrolled subjects or enrolled batches
      if (!isTeacher && studentOnlyMyBatches) {
        const isEnrolledSubject = studentEnrolledSubjects.includes(slot.subject);
        const isEnrolledBatch = currentStudent.enrolledCourses.some(
          (course) => course.toLowerCase().includes(slot.subject.toLowerCase()) || slot.batchTitle.toLowerCase().includes(course.toLowerCase())
        );
        if (!isEnrolledSubject && !isEnrolledBatch) return false;
      }

      return true;
    });
  }, [scheduleSlots, selectedDay, selectedSubject, selectedRoomId, isTeacher, studentOnlyMyBatches, studentEnrolledSubjects, currentStudent]);

  // Compute live room availability status for selected day
  const roomAvailabilityList = useMemo(() => {
    const targetDay = selectedDay === 'All' ? 'Mon' : (selectedDay as DayOfWeek);
    return rooms.map((room) => {
      const bookedSlots = scheduleSlots.filter(
        (s) => s.roomId === room.id && (selectedDay === 'All' ? true : s.day === targetDay)
      );
      return {
        ...room,
        bookedSlots,
        isOccupiedOnDay: bookedSlots.length > 0
      };
    });
  }, [rooms, scheduleSlots, selectedDay]);

  // Live conflict checking for Form
  const conflictCheck = useMemo(() => {
    return checkRoomAvailability(
      formRoomId,
      formDay,
      formStartTime,
      formEndTime,
      editingSlot?.id
    );
  }, [formRoomId, formDay, formStartTime, formEndTime, editingSlot, checkRoomAvailability]);

  // Selected batch for form to check capacity
  const targetBatchForForm = batches.find((b) => b.id === formBatchId) || batches[0];
  const targetRoomForForm = rooms.find((r) => r.id === formRoomId) || rooms[0];
  const isOverCapacity =
    targetBatchForForm && targetRoomForForm
      ? targetBatchForForm.activeStudentCount > targetRoomForForm.capacity
      : false;

  const handleOpenAddModal = () => {
    setEditingSlot(null);
    setFormBatchId('b1');
    setFormDay('Mon');
    setFormStartTime('17:00');
    setFormEndTime('18:30');
    setFormDisplayTime('05:00 PM - 06:30 PM');
    setFormRoomId('r1');
    setFormLocationNotes('Main Academic Block · Floor 1');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (slot: ScheduleSlot) => {
    setEditingSlot(slot);
    setFormBatchId(slot.batchId);
    setFormDay(slot.day);
    setFormStartTime(slot.startTime);
    setFormEndTime(slot.endTime);
    setFormDisplayTime(slot.displayTime);
    setFormRoomId(slot.roomId);
    setFormLocationNotes(slot.locationNotes);
    setShowAddModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conflictCheck.isAvailable) return;

    const chosenBatch = batches.find((b) => b.id === formBatchId);
    const chosenRoom = rooms.find((r) => r.id === formRoomId);

    const slotPayload = {
      batchId: formBatchId,
      batchTitle: chosenBatch ? chosenBatch.title : 'Scheduled Batch',
      subject: chosenBatch ? (chosenBatch.subject === 'Math' ? 'Mathematics' : chosenBatch.subject) : 'General',
      teacherName: chosenBatch ? chosenBatch.teacherName : currentTeacher.name,
      day: formDay,
      startTime: formStartTime,
      endTime: formEndTime,
      displayTime: formDisplayTime.trim() || `${formStartTime} - ${formEndTime}`,
      roomId: formRoomId,
      roomName: chosenRoom ? chosenRoom.name : 'Classroom',
      locationNotes: formLocationNotes.trim() || (chosenRoom ? chosenRoom.building : 'Classroom'),
      activeStudents: chosenBatch ? chosenBatch.activeStudentCount : 15,
      isOnline: false
    };

    if (editingSlot) {
      updateScheduleSlot(editingSlot.id, slotPayload);
      setToastMessage(`Updated schedule slot for ${slotPayload.batchTitle} in ${slotPayload.roomName}!`);
    } else {
      addScheduleSlot(slotPayload);
      setToastMessage(`Scheduled new batch session on ${slotPayload.day} in ${slotPayload.roomName}!`);
    }

    setShowAddModal(false);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteSlot = (slotId: string, title: string) => {
    deleteScheduleSlot(slotId);
    setToastMessage(`Removed "${title}" from dynamic schedule.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getSubjectColorClass = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics':
      case 'math':
        return 'border-l-4 border-l-blue-600 bg-blue-50/70 text-blue-950';
      case 'physics':
        return 'border-l-4 border-l-purple-600 bg-purple-50/70 text-purple-950';
      case 'chemistry':
        return 'border-l-4 border-l-teal-600 bg-teal-50/70 text-teal-950';
      default:
        return 'border-l-4 border-l-amber-600 bg-amber-50/70 text-amber-950';
    }
  };

  const getSubjectBadge = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics':
      case 'math':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'physics':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'chemistry':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Hero Header */}
      <div
        className={`rounded-2xl p-6 text-white shadow-md relative overflow-hidden ${
          isTeacher
            ? 'bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900'
            : 'bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-teal-200 font-semibold block">
              {isTeacher ? 'Faculty Master Scheduler' : 'Student Academic Timetable'}
            </span>
            <h2 className="text-2xl font-bold tracking-tight">
              {isTeacher ? 'Dynamic Batch Calendar & Room Allocation' : 'Enrolled Course Schedules & Locations'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/80 font-medium">
              <span>{scheduleSlots.length} Weekly Session Slots</span>
              <span aria-hidden="true">·</span>
              <span>{rooms.length} Dedicated Tuition Classrooms & Labs</span>
              <span aria-hidden="true">·</span>
              <span>Live Collision & Capacity Detection</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {isTeacher && (
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-white text-teal-900 hover:bg-teal-50 active:bg-teal-100 text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-teal-700" />
                <span>Schedule Batch Slot</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter and View Controls Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Day Selector Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedDay('All')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                selectedDay === 'All'
                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Days
            </button>
            {DAYS_OF_WEEK.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                  selectedDay === d
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-center shrink-0">
            <button
              onClick={() => setViewMode('GRID')}
              className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'GRID' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Weekly Grid</span>
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'LIST' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Agenda List</span>
            </button>
            <button
              onClick={() => setViewMode('ROOMS')}
              className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'ROOMS' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Room Availability</span>
            </button>
          </div>
        </div>

        {/* Filters Row: Subject Filter & Location/Scope */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Subject:</span>
            </span>
            {['ALL', 'Mathematics', 'Physics', 'Chemistry', 'Biology'].map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  selectedSubject === sub
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sub === 'ALL' ? 'All Subjects' : sub}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Student scope toggle */}
            {!isTeacher && (
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium select-none">
                <input
                  type="checkbox"
                  checked={studentOnlyMyBatches}
                  onChange={(e) => setStudentOnlyMyBatches(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>My Enrolled Subjects Only</span>
              </label>
            )}

            {/* Room Filter Dropdown for Teachers */}
            {isTeacher && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Room:</span>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-700 font-medium"
                >
                  <option value="ALL">All Rooms</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: WEEKLY GRID VIEW */}
      {viewMode === 'GRID' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const daySlots = filteredSlots.filter((s) => s.day === day);
              const isToday = day === 'Mon'; // Highlight current active tuition day

              return (
                <div
                  key={day}
                  className={`bg-white rounded-xl border p-3 flex flex-col min-h-[260px] shadow-2xs ${
                    isToday ? 'border-blue-400 ring-1 ring-blue-100' : 'border-slate-200'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-900">{day}</span>
                    <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                      {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
                    </span>
                  </div>

                  {/* Day Slots */}
                  <div className="space-y-2 flex-1">
                    {daySlots.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[11px] text-slate-400 text-center py-6">
                        No classes scheduled
                      </div>
                    ) : (
                      daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`p-2.5 rounded-lg border text-xs space-y-1.5 shadow-2xs transition-all ${getSubjectColorClass(
                            slot.subject
                          )}`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-slate-900 line-clamp-1 leading-snug">
                              {slot.batchTitle}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-700">
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{slot.displayTime}</span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-slate-600 truncate">
                            <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{slot.roomName}</span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                            <span className="text-slate-500">{slot.teacherName}</span>
                            {isTeacher && (
                              <button
                                onClick={() => handleOpenEditModal(slot)}
                                className="text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                                title="Edit schedule slot"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: AGENDA / TIMELINE LIST VIEW */}
      {viewMode === 'LIST' && (
        <div className="space-y-3">
          {filteredSlots.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              No batch sessions match your current day, subject, or enrolled course filter.
            </div>
          ) : (
            filteredSlots.map((slot) => {
              const matchedRoom = rooms.find((r) => r.id === slot.roomId);
              return (
                <div
                  key={slot.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900 text-white">
                          {slot.day}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base">{slot.batchTitle}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSubjectBadge(slot.subject)}`}>
                          {slot.subject}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-0.5">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {slot.displayTime}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {slot.roomName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {slot.activeStudents} Students
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-500">Faculty: {slot.teacherName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      {matchedRoom && (
                        <button
                          onClick={() => setSelectedRoomDetail(matchedRoom)}
                          className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Info className="w-3.5 h-3.5 text-slate-500" />
                          <span>Room Equipment</span>
                        </button>
                      )}

                      {isTeacher && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(slot)}
                            className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Reschedule / Edit slot"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slot.id, slot.batchTitle)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Cancel / Delete class slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{slot.locationNotes}</span>
                    </div>

                    {matchedRoom && (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Capacity:</span>
                        <span className="font-semibold text-slate-700">
                          {slot.activeStudents}/{matchedRoom.capacity} seats booked
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW MODE 3: ROOM AVAILABILITY & CAPACITY MATRIX */}
      {viewMode === 'ROOMS' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-900 block">Classroom & Lab Occupancy Status</span>
              <span>Showing room schedule allocations for: <span className="font-semibold text-slate-800">{selectedDay === 'All' ? 'Full Week' : selectedDay}</span></span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available / Free Slots
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Booked / Occupied
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roomAvailabilityList.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3.5 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{room.name}</h4>
                      {room.isLab && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                          Laboratory
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {room.building}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      room.bookedSlots.length === 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {room.bookedSlots.length === 0 ? 'Fully Free' : `${room.bookedSlots.length} Sessions Assigned`}
                  </span>
                </div>

                {/* Capacity & Equipment */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span>Seating Capacity:</span>
                    <span className="font-bold text-slate-900">{room.capacity} Students</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 block">Available Equipment:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {room.equipment.map((eq) => (
                        <span
                          key={eq}
                          className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                        >
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Assigned Slots List */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-700 block">Allocated Time Slots:</span>
                  {room.bookedSlots.length === 0 ? (
                    <p className="text-xs text-emerald-700 font-medium bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                      ✓ No schedule clashes. Open for room booking.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {room.bookedSlots.map((bSlot) => (
                        <div
                          key={bSlot.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs border border-slate-200/80"
                        >
                          <span className="font-semibold text-slate-800">
                            {bSlot.day} · {bSlot.displayTime}
                          </span>
                          <span className="text-slate-600 text-[11px]">{bSlot.batchTitle}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teacher Add / Edit Schedule Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                  {editingSlot ? 'Reschedule Session' : 'Batch Schedule Allocation'}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingSlot ? 'Edit Scheduled Class Slot' : 'Assign Batch Timing & Room'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            {/* Live Conflict Warning Banner */}
            {!conflictCheck.isAvailable && conflictCheck.conflictingSlot && (
              <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Room Clash Detected!</span>
                </div>
                <p>
                  <span className="font-semibold">{targetRoomForForm.name}</span> is already allocated to{' '}
                  <span className="font-semibold">{conflictCheck.conflictingSlot.batchTitle}</span> on{' '}
                  <span className="font-semibold">{formDay} ({conflictCheck.conflictingSlot.displayTime})</span>.
                </p>
                <p className="text-[11px] text-rose-800">
                  Please pick another room or adjust the timing interval.
                </p>
              </div>
            )}

            {/* Room Capacity Warning */}
            {isOverCapacity && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Capacity Exceeded Notice</span>
                  <span>
                    Batch has {targetBatchForForm.activeStudentCount} students, but {targetRoomForForm.name} only seats {targetRoomForForm.capacity}.
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Course Batch</label>
                <select
                  value={formBatchId}
                  onChange={(e) => setFormBatchId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:ring-2 focus:ring-teal-600"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.subject} · {b.activeStudentCount} students)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as DayOfWeek)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:ring-2 focus:ring-teal-600"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Classroom / Lab</label>
                  <select
                    value={formRoomId}
                    onChange={(e) => {
                      const nextRoomId = e.target.value;
                      setFormRoomId(nextRoomId);
                      const roomObj = rooms.find((r) => r.id === nextRoomId);
                      if (roomObj) setFormLocationNotes(roomObj.building);
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:ring-2 focus:ring-teal-600"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (Cap: {r.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time (24h)</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => {
                      setFormStartTime(e.target.value);
                      setFormDisplayTime(`${e.target.value} - ${formEndTime}`);
                    }}
                    required
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time (24h)</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => {
                      setFormEndTime(e.target.value);
                      setFormDisplayTime(`${formStartTime} - ${e.target.value}`);
                    }}
                    required
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Label for Students</label>
                <input
                  type="text"
                  value={formDisplayTime}
                  onChange={(e) => setFormDisplayTime(e.target.value)}
                  placeholder="e.g., 05:00 PM - 06:30 PM"
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location Details & Notes</label>
                <input
                  type="text"
                  value={formLocationNotes}
                  onChange={(e) => setFormLocationNotes(e.target.value)}
                  placeholder="e.g., Main Academic Block · Floor 1 · Room 101"
                  className="w-full border border-slate-300 rounded-lg p-2.5 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!conflictCheck.isAvailable}
                  className={`px-4 py-2 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                    conflictCheck.isAvailable
                      ? 'bg-teal-700 hover:bg-teal-800'
                      : 'bg-slate-400 cursor-not-allowed opacity-75'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingSlot ? 'Save Rescheduled Slot' : 'Confirm & Publish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Detail Modal for Students and Teachers */}
      {selectedRoomDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  Classroom Specification
                </span>
                <h3 className="text-lg font-bold text-slate-900">{selectedRoomDetail.name}</h3>
                <p className="text-xs text-slate-500">{selectedRoomDetail.building}</p>
              </div>
              <button
                onClick={() => setSelectedRoomDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600">Student Capacity:</span>
                <span className="font-bold text-slate-900">{selectedRoomDetail.capacity} Seated Students</span>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1.5">Equipped Amenities:</span>
                <div className="space-y-1.5">
                  {selectedRoomDetail.equipment.map((eq) => (
                    <div key={eq} className="flex items-center gap-2 text-slate-700 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{eq}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRoomDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
