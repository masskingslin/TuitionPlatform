import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { FeePaymentStatus, FeeRecord } from '../../types';
import { UpiQrPaymentModal } from '../payment/UpiQrPaymentModal';
import { Receipt, Bell, CheckCircle2, Search, Download, QrCode } from 'lucide-react';

export const TeacherFeeTrackerScreen: React.FC = () => {
  const { feeRecords, payFee } = useTuition();
  const [reminderNotice, setReminderNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportNotice, setExportNotice] = useState(false);
  const [activeUpiInvoice, setActiveUpiInvoice] = useState<FeeRecord | null>(null);
  const [showCenterQr, setShowCenterQr] = useState(false);

  // Financial aggregates
  const totalBilled = feeRecords.reduce((acc, f) => acc + f.amountDue, 0);
  const totalCollected = feeRecords.reduce((acc, f) => acc + (f.amountPaid || 0), 0);
  const totalPending = feeRecords.reduce((acc, f) => {
    return f.status !== 'PAID' ? acc + (f.amountDue - f.amountPaid) : acc;
  }, 0);

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

  const handleSendReminder = (studentName: string) => {
    setReminderNotice(`Automated fee reminder notification dispatched to ${studentName}'s registered parent number via SMS with UPI payment link.`);
    setTimeout(() => setReminderNotice(null), 4000);
  };

  const handleUpiSuccess = (paymentMethod: string, utr: string) => {
    if (!activeUpiInvoice) return;
    payFee(activeUpiInvoice.invoiceId, `${paymentMethod} (UTR: ${utr})`);
    setReminderNotice(`Payment confirmed for ${activeUpiInvoice.studentName}! Reference: ${utr}`);
    setActiveUpiInvoice(null);
    setTimeout(() => setReminderNotice(null), 4000);
  };

  const filtered = feeRecords.filter((f) => {
    const matchesFilter = statusFilter === 'ALL' || f.status === statusFilter;
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
                <QrCode className="w-3 h-3 text-emerald-700" />
                <span>Bharat QR & UPI Active</span>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">Tuition Fee Collection Overview</h2>
            <p className="text-xs text-slate-500 mt-0.5">Tracking monthly dues across Grade 9, 10, and 11 batches</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setShowCenterQr(true)}
              className="px-3.5 py-2 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4" />
              <span>Show Center UPI QR</span>
            </button>

            <button
              onClick={() => {
                setExportNotice(true);
                setTimeout(() => setExportNotice(false), 3000);
              }}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Ledger</span>
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
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{reminderNotice}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium self-start sm:self-center">
          {['ALL', 'PENDING', 'OVERDUE', 'PAID'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === status
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
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
            className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
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
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(fee.status)}`}>
                {fee.status}
              </span>

              {fee.status !== 'PAID' ? (
                <>
                  <button
                    onClick={() => handleSendReminder(fee.studentName)}
                    className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-md transition-colors"
                    title="Send parent reminder SMS"
                  >
                    <Bell className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setActiveUpiInvoice(fee)}
                    className="px-3 py-1.5 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center gap-1"
                    title="Open dynamic UPI QR for parent to scan"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan & Collect</span>
                  </button>

                  <button
                    onClick={() => payFee(fee.invoiceId, 'Cash Collected by Teacher')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-300"
                    title="Record cash or direct settlement"
                  >
                    Cash
                  </button>
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

      {/* Invoice Specific UPI Modal */}
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
          onPaymentSuccess={(_method, utr) => {
            setShowCenterQr(false);
            setReminderNotice(`General reception payment verified! Ref: ${utr}`);
            setTimeout(() => setReminderNotice(null), 4000);
          }}
          isTeacherDesk={true}
        />
      )}
    </div>
  );
};
