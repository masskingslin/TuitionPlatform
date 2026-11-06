import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { AttendanceStatus } from '../../types';
import { MessageLogsModal } from '../common/MessageLogsModal';
import { openWhatsAppClickToChat } from '../../services/messagingService';
import {
  CheckCircle2,
  Send,
  CheckCheck,
  Search,
  Smartphone,
  MessageSquare,
  ShieldCheck,
  History,
  Loader2
} from 'lucide-react';

interface StudentAttendanceItem {
  id: string;
  name: string;
  rollNo: string;
  guardianName: string;
  guardianPhone: string;
  status: AttendanceStatus;
}

export const TeacherAttendanceScreen: React.FC = () => {
  const {
    markAttendance,
    batches,
    notificationLogs,
    sendGuardianSmsOrWhatsApp,
    sendPushNotification
  } = useTuition();

  const [selectedBatchId, setSelectedBatchId] = useState('b1');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{
    count: number;
    channel: string;
    recipients: string[];
    provider: string;
  } | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [singleStudentNotice, setSingleStudentNotice] = useState<string | null>(null);

  const [students, setStudents] = useState<StudentAttendanceItem[]>([
    { id: 's1', name: 'Aravind Kumar', rollNo: '10A-01', guardianName: 'Kumar Raman', guardianPhone: '+91 98765 43210', status: 'PRESENT' },
    { id: 's2', name: 'Divya Sharma', rollNo: '10A-02', guardianName: 'Ramesh Sharma', guardianPhone: '+91 98765 43211', status: 'PRESENT' },
    { id: 's3', name: 'Ganesh Raman', rollNo: '10A-03', guardianName: 'S. Raman', guardianPhone: '+91 98765 43212', status: 'ABSENT' },
    { id: 's4', name: 'Kavitha Selvam', rollNo: '10A-04', guardianName: 'Selvam Mani', guardianPhone: '+91 98765 43213', status: 'PRESENT' },
    { id: 's5', name: 'Pradeep Raj', rollNo: '10A-05', guardianName: 'Rajendran P.', guardianPhone: '+91 98765 43214', status: 'LATE' },
    { id: 's6', name: 'Rohit Verma', rollNo: '10A-06', guardianName: 'Anand Verma', guardianPhone: '+91 98765 43215', status: 'PRESENT' },
    { id: 's7', name: 'Sneha Nair', rollNo: '10A-07', guardianName: 'Suresh Nair', guardianPhone: '+91 98765 43216', status: 'PRESENT' }
  ]);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  const updateStatus = (index: number, newStatus: AttendanceStatus) => {
    setStudents((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: newStatus };
      return updated;
    });
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'PRESENT' })));
  };

  /**
   * Dispatches zero-cost in-app and FCM Push notifications via Express server,
   * and provides 1-click WhatsApp Click-to-Chat (wa.me) links, logging all sends in Firestore.
   */
  const handleSaveAndNotify = async () => {
    setIsDispatching(true);

    // 1. Save attendance records in Firestore
    const records = students.map((s) => ({
      id: `att-${Date.now()}-${s.id}`,
      batchId: selectedBatchId,
      studentId: s.id,
      studentName: s.name,
      date: sessionDate,
      status: s.status,
      notes: s.status === 'ABSENT' ? 'Marked absent by faculty' : s.status === 'LATE' ? 'Late arrival recorded' : ''
    }));

    markAttendance({
      batchId: selectedBatchId,
      date: sessionDate,
      records
    });

    // 2. Filter absent and late students
    const absentOrLate = students.filter((s) => s.status === 'ABSENT' || s.status === 'LATE');
    const sentRecipients: string[] = [];

    // 3. Dispatch zero-cost in-app and FCM push notifications
    for (const s of absentOrLate) {
      const content = `Dear ${s.guardianName}, your ward ${s.name} was marked ${s.status} for ${selectedBatch.title} on ${sessionDate}. If this was unplanned, please contact the center.`;

      // Zero-cost in-app notification & FCM push
      await sendGuardianSmsOrWhatsApp({
        recipientPhone: s.guardianPhone,
        recipientName: s.guardianName,
        studentId: s.id,
        studentName: s.name,
        messageType: 'ATTENDANCE_ALERT',
        channel: 'IN_APP',
        title: `Attendance Alert: ${s.name} (${s.status})`,
        content,
        metadata: {
          batchId: selectedBatchId,
          batchTitle: selectedBatch.title,
          date: sessionDate,
          status: s.status
        }
      });

      sentRecipients.push(`${s.name} → ${s.guardianPhone}`);

      // Dispatch FCM Push notification
      await sendPushNotification({
        title: `Attendance Update: ${s.name}`,
        body: `${selectedBatch.title} · Marked ${s.status} on ${sessionDate}.`,
        messageType: 'ANNOUNCEMENT',
        targetRole: 'PARENT',
        studentId: s.id,
        studentName: s.name,
        batchId: selectedBatchId,
        batchTitle: selectedBatch.title
      });
    }

    setIsDispatching(false);
    setDispatchResult({
      count: absentOrLate.length,
      channel: 'In-App + FCM Push',
      recipients: sentRecipients,
      provider: 'Zero-Cost FCM Dispatcher'
    });

    setTimeout(() => {
      setDispatchResult(null);
    }, 7000);
  };

  /**
   * Opens official WhatsApp Click-to-Chat (wa.me) directly for an individual student
   */
  const handleSendOnWhatsApp = async (student: StudentAttendanceItem) => {
    const content = `Dear ${student.guardianName}, tuition alert from Apex Academy: your ward ${student.name} was marked ${student.status} for ${selectedBatch.title} on ${sessionDate}. If this was unplanned, please contact the center.`;

    await openWhatsAppClickToChat(student.guardianPhone, content, {
      studentId: student.id,
      studentName: student.name,
      recipientName: student.guardianName,
      messageType: 'ATTENDANCE_ALERT',
      title: `Attendance Alert: ${student.name} (${student.status})`
    });

    setSingleStudentNotice(
      `WhatsApp Click-to-Chat opened for ${student.guardianName} (${student.guardianPhone}) & logged in audit records.`
    );
    setTimeout(() => setSingleStudentNotice(null), 5000);
  };

  /**
   * Direct individual alert via In-App / FCM push
   */
  const handleSendDirectAlert = async (student: StudentAttendanceItem) => {
    const content = `Dear ${student.guardianName}, tuition alert for ${student.name}: status is ${student.status} for ${selectedBatch.title} session on ${sessionDate}. Contact us for queries.`;

    const res = await sendGuardianSmsOrWhatsApp({
      recipientPhone: student.guardianPhone,
      recipientName: student.guardianName,
      studentId: student.id,
      studentName: student.name,
      messageType: 'ATTENDANCE_ALERT',
      channel: 'IN_APP',
      title: `Direct Alert: ${student.name} marked ${student.status}`,
      content,
      metadata: {
        batchId: selectedBatchId,
        date: sessionDate,
        status: student.status
      }
    });

    // Also send FCM push
    await sendPushNotification({
      title: `Tuition Attendance: ${student.name}`,
      body: `Status recorded as ${student.status} for ${selectedBatch.title}.`,
      messageType: 'ANNOUNCEMENT',
      targetRole: 'PARENT',
      studentId: student.id,
      studentName: student.name
    });

    setSingleStudentNotice(
      `In-App & FCM alert dispatched to ${student.guardianName} (${student.guardianPhone}). Msg ID: ${res.messageId}`
    );
    setTimeout(() => setSingleStudentNotice(null), 5000);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.guardianPhone.includes(searchQuery)
  );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Session Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-teal-600" />
                <span>Zero-Cost In-App, FCM & WhatsApp (wa.me)</span>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">Mark Batch Attendance & Notify Guardians</h2>
            <p className="text-xs text-slate-500">Record session roll call and dispatch alerts to guardians without SMS charges</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setShowLogsModal(true)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="View Firestore message audit logs"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Dispatch Log ({notificationLogs.length})</span>
            </button>

            <button
              type="button"
              onClick={markAllPresent}
              className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#00695C] border border-teal-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Present</span>
            </button>
          </div>
        </div>

        {/* Batch, Date, and Dispatch Gateway Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-medium cursor-pointer"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.scheduleTime})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Session Date</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dispatch Gateway Channel</label>
            <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-teal-700" />
                <span>In-App & FCM Push</span>
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase">
                Zero Cost
              </span>
            </div>
          </div>
        </div>

        {/* Live Metrics Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              {students.filter((s) => s.status === 'PRESENT').length} Present
            </span>
            <span className="text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
              {students.filter((s) => s.status === 'ABSENT').length} Absent
            </span>
            <span className="text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              {students.filter((s) => s.status === 'LATE').length} Late
            </span>
            <span className="text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              {students.filter((s) => s.status === 'EXCUSED').length} Excused
            </span>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search student or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Real Message Dispatch Notification Banner */}
      {dispatchResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs shadow-2xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-sm">
                Real {dispatchResult.channel} Messages Dispatched Successfully!
              </span>
            </div>
            <button
              onClick={() => setShowLogsModal(true)}
              className="font-bold underline text-emerald-800 hover:text-emerald-950 cursor-pointer"
            >
              Open Audit Log
            </button>
          </div>
          <p className="text-xs text-emerald-900">
            Cloud Function sent {dispatchResult.count} message(s) via <strong>{dispatchResult.provider}</strong> and broadcasted FCM Push. Each send has been logged into Firestore.
          </p>
          {dispatchResult.recipients.length > 0 && (
            <div className="text-[11px] font-mono text-emerald-800 bg-emerald-100/60 p-2 rounded-lg border border-emerald-200">
              {dispatchResult.recipients.join(' · ')}
            </div>
          )}
        </div>
      )}

      {singleStudentNotice && (
        <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl text-blue-950 text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{singleStudentNotice}</span>
          </div>
          <button
            onClick={() => setShowLogsModal(true)}
            className="font-bold underline text-blue-800 hover:text-blue-950"
          >
            Audit Log
          </button>
        </div>
      )}

      {/* Student Attendance List */}
      <div className="space-y-2.5">
        {filteredStudents.map((student) => {
          const actualIndex = students.findIndex((s) => s.id === student.id);
          return (
            <div
              key={student.id}
              className={`bg-white rounded-xl p-4 border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                student.status === 'ABSENT'
                  ? 'border-rose-200 bg-rose-50/20'
                  : student.status === 'LATE'
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs border border-teal-200">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{student.name}</span>
                    <span className="text-[11px] font-mono text-slate-400 font-medium">({student.rollNo})</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>Guardian: {student.guardianName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-slate-700 font-medium">{student.guardianPhone}</span>
                  </div>
                </div>
              </div>

              {/* Status Selector & Individual Alert Action */}
              <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => updateStatus(actualIndex, 'PRESENT')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    student.status === 'PRESENT'
                      ? 'bg-[#2E7D32] text-white border-[#2E7D32] shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  P (Present)
                </button>

                <button
                  type="button"
                  onClick={() => updateStatus(actualIndex, 'ABSENT')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    student.status === 'ABSENT'
                      ? 'bg-[#C62828] text-white border-[#C62828] shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  A (Absent)
                </button>

                <button
                  type="button"
                  onClick={() => updateStatus(actualIndex, 'LATE')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    student.status === 'LATE'
                      ? 'bg-[#EF6C00] text-white border-[#EF6C00] shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  L (Late)
                </button>

                <button
                  type="button"
                  onClick={() => updateStatus(actualIndex, 'EXCUSED')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    student.status === 'EXCUSED'
                      ? 'bg-[#1565C0] text-white border-[#1565C0] shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  E (Excused)
                </button>

                {/* Send on WhatsApp (wa.me) button */}
                <button
                  type="button"
                  onClick={() => handleSendOnWhatsApp(student)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
                  title={`Open WhatsApp Click-to-Chat (wa.me) directly for ${student.guardianPhone}`}
                >
                  <MessageSquare className="w-3 h-3 text-emerald-700" />
                  <span>Send on WhatsApp</span>
                </button>

                {/* Direct in-app & push alert trigger */}
                <button
                  type="button"
                  onClick={() => handleSendDirectAlert(student)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  title={`Dispatch in-app & FCM alert directly to ${student.guardianPhone}`}
                >
                  <Send className="w-3 h-3 text-teal-600" />
                  <span>FCM Alert</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2">
        <button
          type="button"
          disabled={isDispatching}
          onClick={handleSaveAndNotify}
          className="w-full py-3.5 bg-[#00695C] hover:bg-[#005a4e] active:bg-[#004d40] text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isDispatching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Dispatching In-App & FCM Push Notifications...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Save Attendance & Dispatch In-App/FCM Alerts ({sessionDate})</span>
            </>
          )}
        </button>
      </div>

      {/* Message and Push Audit Logs Modal */}
      {showLogsModal && (
        <MessageLogsModal
          logs={notificationLogs}
          onClose={() => setShowLogsModal(false)}
        />
      )}
    </div>
  );
};
