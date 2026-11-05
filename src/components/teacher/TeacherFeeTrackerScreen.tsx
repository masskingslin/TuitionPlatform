import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { FeePaymentStatus, FeeRecord } from '../../types';
import { UpiQrPaymentModal } from '../payment/UpiQrPaymentModal';
import { MessageLogsModal } from '../common/MessageLogsModal';
import {
  Receipt,
  CheckCircle2,
  Search,
  Download,
  QrCode,
  Clock,
  Check,
  X,
  ShieldCheck,
  History,
  Smartphone
} from 'lucide-react';

const studentGuardianDirectory: Record<string, { guardianName: string; guardianPhone: string }> = {
  s1: { guardianName: 'Kumar Raman', guardianPhone: '+91 98765 43210' },
  s2: { guardianName: 'Ramesh Sharma', guardianPhone: '+91 98765 43211' },
  s3: { guardianName: 'S. Raman', guardianPhone: '+91 98765 43212' },
  s4: { guardianName: 'Selvam Mani', guardianPhone: '+91 98765 43213' },
  s5: { guardianName: 'Rajendran P.', guardianPhone: '+91 98765 43214' },
  s6: { guardianName: 'Anand Verma', guardianPhone: '+91 98765 43215' },
  s7: { guardianName: 'Suresh Nair', guardianPhone: '+91 98765 43216' }
};

export const TeacherFeeTrackerScreen: React.FC = () => {
  const {
    feeRecords,
    payFee,
    approveManualPayment,
    rejectManualPayment,
    notificationLogs,
    sendGuardianSmsOrWhatsApp,
    sendPushNotification
  } = useTuition();

  const [reminderNotice, setReminderNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportNotice, setExportNotice] = useState(false);
  const [activeUpiInvoice, setActiveUpiInvoice] = useState<FeeRecord | null>(null);
  const [showCenterQr, setShowCenterQr] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);

  // Financial aggregates
  const totalBilled = feeRecords.reduce((acc, f) => acc + f.amountDue, 0);
  const totalCollected = feeRecords.reduce((acc, f) => acc + (f.amountPaid || 0), 0);
  const totalPending = feeRecords.reduce((acc, f) => {
    return f.status !== 'PAID' ? acc + (f.amountDue - f.amountPaid) : acc;
  }, 0);

  const pendingClaims = feeRecords.filter((f) => f.manualPaymentClaimed && f.status !== 'PAID');

  const collectionPercent = totalBilled > 0
    ? ((totalCollected / totalBilled) * 100).toFixed(0)
    : '0';

  const getStatusColor = (status: FeePaymentStatus) => {
    switch (status) {
      case 'PAID':
        return 'text-[#2E7D32] bg-emerald-50 border-emerald-200';
      case 'PENDING':
        return 'text-[#EF6C00] bg-amber-50 border-amber-200';
      case 'OVERDUE':
        return 'text-[#C62828] bg-rose-50 border-rose-200';
    }
  };

  /**
   * Dispatches real SMS reminder via Cloud Function (MSG91 / WhatsApp Cloud API) to guardianPhone
   * and sends an FCM Push notification for fees, logging all sends in Firestore.
   */
  const handleSendReminder = async (fee: FeeRecord) => {
    const guardian = studentGuardianDirectory[fee.studentId] || {
      guardianName: 'Guardian',
      guardianPhone: '+91 98765 43210'
    };
    const pendingAmount = fee.amountDue - (fee.amountPaid || 0);
    const content = `Tuition Fee Reminder from Apex Academy: Invoice #${fee.invoiceId} for ${fee.studentName} (${fee.monthYear}) of Rs.${pendingAmount.toLocaleString()} is due on ${fee.dueDate}. Pay online via Razorpay or UPI: tuitioncenter@okaxis. Contact center for assistance.`;

    // 1. Dispatch real SMS / WhatsApp through Cloud Function
    const res = await sendGuardianSmsOrWhatsApp({
      recipientPhone: guardian.guardianPhone,
      recipientName: guardian.guardianName,
      studentId: fee.studentId,
      studentName: fee.studentName,
      messageType: 'FEE_REMINDER',
      channel: 'SMS',
      title: `Fee Due Reminder: ${fee.studentName} (${fee.monthYear})`,
      content,
      metadata: {
        invoiceId: fee.invoiceId,
        amountDue: fee.amountDue,
        monthYear: fee.monthYear,
        dueDate: fee.dueDate
      }
    });

    // 2. Broadcast FCM Push notification
    await sendPushNotification({
      title: `Tuition Fee Due: ${fee.monthYear}`,
      body: `Invoice #${fee.invoiceId} for ${fee.studentName} (Rs.${pendingAmount.toLocaleString()}) is due on ${fee.dueDate}.`,
      messageType: 'FEE_REMINDER',
      targetRole: 'PARENT',
      studentId: fee.studentId,
      studentName: fee.studentName,
      data: { invoiceId: fee.invoiceId }
    });

    setReminderNotice(
      `Real message dispatched to ${guardian.guardianName} (${guardian.guardianPhone}) via ${res.provider}! Msg ID: ${res.messageId}. Logged to Firestore.`
    );
    setTimeout(() => setReminderNotice(null), 6000);
  };

  const handleApprove = async (invoiceId: string, studentName: string) => {
    try {
      setActionLoading(invoiceId);
      await approveManualPayment(invoiceId);
      setReminderNotice(`Manual payment for ${studentName} approved! Fee marked as PAID.`);
      setTimeout(() => setReminderNotice(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (invoiceId: string, studentName: string) => {
    try {
      setActionLoading(invoiceId);
      await rejectManualPayment(invoiceId);
      setReminderNotice(`Payment claim for ${studentName} rejected. Student/parent notified to resubmit.`);
      setTimeout(() => setReminderNotice(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpiSuccess = (paymentMethod: string, utr: string, paymentId?: string) => {
    if (!activeUpiInvoice) return;
    if (paymentId) {
      payFee(activeUpiInvoice.invoiceId, paymentMethod, paymentId);
      setReminderNotice(`Razorpay verified payment confirmed for ${activeUpiInvoice.studentName}! Payment ID: ${paymentId}`);
    } else {
      payFee(activeUpiInvoice.invoiceId, `${paymentMethod} (UTR: ${utr})`);
      setReminderNotice(`Desk payment confirmed for ${activeUpiInvoice.studentName}! Reference: ${utr}`);
    }
    setActiveUpiInvoice(null);
    setTimeout(() => setReminderNotice(null), 4000);
  };

  const handleExportCsv = () => {
    const headers = [
      'Invoice ID',
      'Student ID',
      'Student Name',
      'Month / Year',
      'Amount Due (INR)',
      'Amount Paid (INR)',
      'Outstanding Balance (INR)',
      'Payment Status',
      'Due Date',
      'Settled Via',
      'Payment Reference / UTR',
      'Payment ID (Razorpay)',
      'Settlement Timestamp'
    ];

    const escapeCsv = (str: string | number | undefined | null) => {
      if (str == null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = feeRecords.map((fee) => {
      const balance = Math.max(0, fee.amountDue - (fee.amountPaid || 0));
      return [
        escapeCsv(fee.invoiceId),
        escapeCsv(fee.studentId),
        escapeCsv(fee.studentName),
        escapeCsv(fee.monthYear),
        fee.amountDue,
        fee.amountPaid || 0,
        balance,
        escapeCsv(fee.status),
        escapeCsv(fee.dueDate),
        escapeCsv(fee.paymentMethod || 'Unpaid'),
        escapeCsv(fee.manualPaymentUtr || 'N/A'),
        escapeCsv(fee.paymentId || 'N/A'),
        escapeCsv(fee.paidAt || 'N/A')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `tuition_fee_ledger_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 4000);
  };

  const filtered = feeRecords.filter((f) => {
    const matchesFilter = statusFilter === 'ALL'
      ? true
      : statusFilter === 'PENDING_APPROVAL'
      ? f.manualPaymentClaimed && f.status !== 'PAID'
      : f.status === statusFilter;
    const matchesSearch = f.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Financial Overview Metrics Banner */}
      <div className="bg-[#ECEFF1] border border-slate-300 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Tuition Center Financials
              </span>
              <span className="text-[10px] bg-emerald-700/10 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-700/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                <span>Live MSG91, WhatsApp & FCM Active</span>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">Tuition Fee Collection Overview</h2>
            <p className="text-xs text-slate-500 mt-0.5">Tracking monthly dues with real guardian SMS & WhatsApp dispatch</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setShowLogsModal(true)}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Inspect Firestore audit log of all SMS and Push messages"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Dispatch Log ({notificationLogs.length})</span>
            </button>

            <button
              onClick={() => setShowCenterQr(true)}
              className="px-3.5 py-2 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Show Center UPI QR</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Download real CSV ledger of all fee accounts"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Ledger</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200/80 mt-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">Total Collected</span>
            <div className="text-xl font-bold text-[#2E7D32] font-mono tabular-nums">
              ₹{totalCollected.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400">{collectionPercent}% of total batch tuition</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">Pending & Overdue</span>
            <div className="text-xl font-bold text-[#C62828] font-mono tabular-nums">
              ₹{totalPending.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400">
              {feeRecords.filter((f) => f.status !== 'PAID').length} Outstanding invoices
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">Total Billed</span>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              ₹{totalBilled.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400">Fixed rate ₹1,500 / month / course</span>
          </div>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Accounting audit summary statement generated and exported successfully.</span>
        </div>
      )}

      {reminderNotice && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{reminderNotice}</span>
          </div>
          <button
            onClick={() => setShowLogsModal(true)}
            className="font-bold underline text-teal-800 hover:text-teal-950 shrink-0 cursor-pointer"
          >
            Inspect Logs
          </button>
        </div>
      )}

      {/* Manual UPI Claims Requiring Teacher Approval */}
      {pendingClaims.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <h3 className="font-bold text-amber-950 text-sm">
                  Pending Manual UPI Payment Approvals ({pendingClaims.length})
                </h3>
                <p className="text-xs text-amber-800">
                  Students/parents made a direct UPI transfer and submitted their UTR number for verification.
                </p>
              </div>
            </div>
            <span className="text-xs bg-amber-200/80 text-amber-900 font-bold px-2.5 py-1 rounded-full border border-amber-300">
              Action Required
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {pendingClaims.map((claim) => (
              <div
                key={claim.invoiceId}
                className="bg-white rounded-xl p-4 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{claim.studentName}</span>
                    <span className="text-xs text-slate-400 font-mono">({claim.monthYear})</span>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                      Inv #{claim.invoiceId}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                    <span>Amount Due: <strong className="font-mono text-slate-900">₹{claim.amountDue.toLocaleString()}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Reported UTR: <strong className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">{claim.manualPaymentUtr || 'N/A'}</strong></span>
                    {claim.manualPaymentSubmittedAt && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-400">{claim.manualPaymentSubmittedAt}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    disabled={actionLoading === claim.invoiceId}
                    onClick={() => handleReject(claim.invoiceId, claim.studentName)}
                    className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    disabled={actionLoading === claim.invoiceId}
                    onClick={() => handleApprove(claim.invoiceId, claim.studentName)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Payment (Mark PAID)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium self-start sm:self-center">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING_APPROVAL', label: `Pending Approval (${pendingClaims.length})` },
            { id: 'PENDING', label: 'Pending' },
            { id: 'OVERDUE', label: 'Overdue' },
            { id: 'PAID', label: 'Paid' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search student or invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
          />
        </div>
      </div>

      {/* Fee Invoices List */}
      <div className="space-y-3">
        {filtered.map((fee) => (
          <div
            key={fee.invoiceId}
            className={`bg-white rounded-xl p-4 sm:p-5 border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
              fee.manualPaymentClaimed && fee.status !== 'PAID'
                ? 'border-amber-300 bg-amber-50/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-bold text-slate-900 text-base">{fee.studentName}</span>
                <span className="text-xs text-slate-400 font-mono">({fee.monthYear})</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Invoice: {fee.invoiceId}</span>
                <span aria-hidden="true">·</span>
                <span>Due Date: {fee.dueDate}</span>
                {fee.paidAt && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-medium">Paid: {fee.paidAt}</span>
                  </>
                )}
              </div>
              <div className="text-sm font-bold text-slate-900 font-mono tabular-nums pt-0.5">
                Fee Amount: ₹{fee.amountDue.toLocaleString()}
              </div>
              {fee.paymentMethod && (
                <div className="text-[11px] text-slate-500 font-mono">
                  Settled via: <span className="font-semibold text-slate-800">{fee.paymentMethod}</span>
                </div>
              )}
              {fee.paymentId && (
                <div className="text-[11px] text-emerald-800 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Razorpay ID:</span>
                  <span className="font-semibold">{fee.paymentId}</span>
                </div>
              )}

              {/* Manual payment claim info */}
              {fee.manualPaymentClaimed && fee.status !== 'PAID' && (
                <div className="p-2 bg-amber-100/60 border border-amber-300 rounded-lg text-amber-950 text-xs flex items-center gap-2 mt-1">
                  <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>
                    Claimed via UPI UTR: <strong className="font-mono">{fee.manualPaymentUtr || 'Pending'}</strong> (Awaiting your approval)
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(fee.status)}`}>
                {fee.status}
              </span>

              {fee.status !== 'PAID' ? (
                <>
                  {fee.manualPaymentClaimed ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={actionLoading === fee.invoiceId}
                        onClick={() => handleReject(fee.invoiceId, fee.studentName)}
                        className="px-2.5 py-1.5 border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        title="Reject UTR claim"
                      >
                        Reject
                      </button>
                      <button
                        disabled={actionLoading === fee.invoiceId}
                        onClick={() => handleApprove(fee.invoiceId, fee.studentName)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                        title="Approve and mark fee as PAID"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Real SMS & WhatsApp Reminder Dispatch button */}
                      <button
                        onClick={() => handleSendReminder(fee)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Dispatch real SMS / WhatsApp reminder to guardianPhone and send FCM push"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Send SMS/WA Alert</span>
                      </button>

                      <button
                        onClick={() => setActiveUpiInvoice(fee)}
                        className="px-3 py-1.5 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                        title="Open dynamic UPI QR or Razorpay for parent to pay"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Collect Online</span>
                      </button>

                      <button
                        onClick={() => payFee(fee.invoiceId, 'Cash Collected by Teacher')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-300 cursor-pointer"
                        title="Record cash or direct settlement"
                      >
                        Cash
                      </button>
                    </>
                  )}
                </>
              ) : (
                <span className="text-xs text-emerald-800 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Settled</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invoice Specific UPI / Razorpay Modal */}
      {activeUpiInvoice && (
        <UpiQrPaymentModal
          invoiceId={activeUpiInvoice.invoiceId}
          studentName={activeUpiInvoice.studentName}
          amount={activeUpiInvoice.amountDue}
          monthYear={activeUpiInvoice.monthYear}
          onClose={() => setActiveUpiInvoice(null)}
          onPaymentSuccess={handleUpiSuccess}
          isTeacherDesk={true}
        />
      )}

      {/* General Center UPI QR Code Display for Reception Desk */}
      {showCenterQr && (
        <UpiQrPaymentModal
          invoiceId="CENTER-DIRECT"
          studentName="Visiting Student / Parent"
          amount={1500}
          monthYear="Standard Monthly"
          onClose={() => setShowCenterQr(false)}
          onPaymentSuccess={(_method, utr, paymentId) => {
            setShowCenterQr(false);
            setReminderNotice(`General reception payment verified! Ref/ID: ${paymentId || utr}`);
            setTimeout(() => setReminderNotice(null), 4000);
          }}
          isTeacherDesk={true}
        />
      )}

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
