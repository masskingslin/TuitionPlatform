import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { FeePaymentStatus, FeeRecord } from '../../types';
import { UpiQrPaymentModal } from '../payment/UpiQrPaymentModal';
import { CheckCircle2, Receipt, Printer, QrCode, Clock, ShieldCheck } from 'lucide-react';

export const StudentFeeScreen: React.FC = () => {
  const { feeRecords, currentStudent } = useTuition();
  const [selectedInvoice, setSelectedInvoice] = useState<FeeRecord | null>(null);
  const [receiptModal, setReceiptModal] = useState<FeeRecord | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [lastUtr, setLastUtr] = useState<string | null>(null);

  // Filter for student 's1'
  const studentFees = feeRecords.filter((f) => f.studentId === 's1');
  const totalPaid = studentFees.reduce((acc, f) => acc + (f.amountPaid || 0), 0);
  const totalDue = studentFees.reduce((acc, f) => (f.status !== 'PAID' ? acc + f.amountDue : acc), 0);

  const pendingInvoice = studentFees.find((f) => f.status !== 'PAID');

  const getStatusColor = (status: FeePaymentStatus) => {
    switch (status) {
      case 'PAID':
        return 'text-[#2E7D32] bg-emerald-50 border-emerald-200';
      case 'PENDING_APPROVAL':
        return 'text-amber-800 bg-amber-50 border-amber-300 font-bold';
      case 'PENDING':
        return 'text-[#EF6C00] bg-amber-50 border-amber-200';
      case 'OVERDUE':
        return 'text-[#C62828] bg-rose-50 border-rose-200';
    }
  };

  const handlePaymentSuccess = (_paymentMethod: string, utr: string) => {
    if (!selectedInvoice) return;
    setPaymentSuccess(selectedInvoice.invoiceId);
    setLastUtr(utr);
    setSelectedInvoice(null);
    setTimeout(() => setPaymentSuccess(null), 6000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Fee Balance Metric Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Tuition Account Summary</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                <QrCode className="w-3 h-3" />
                <span>Direct UPI & QR Enabled</span>
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Tuition Fee Ledger</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{currentStudent.name}</span>
              <span aria-hidden="true">·</span>
              <span>Parent: {currentStudent.guardianName}</span>
              <span aria-hidden="true">·</span>
              <span>{currentStudent.guardianPhone}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/80">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Total Paid</span>
              <span className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
                ₹{totalPaid.toLocaleString()}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Outstanding</span>
              <span className="text-xl font-bold text-amber-400 font-mono tabular-nums">
                ₹{totalDue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Direct UPI CTA Bar if fee pending */}
        {pendingInvoice && (
          <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-950/40 -mx-6 -mb-6 p-4 px-6 rounded-b-2xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block">Direct Online Pay via UPI / QR</span>
                <span className="text-slate-400">{pendingInvoice.monthYear} installment due on {pendingInvoice.dueDate}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedInvoice(pendingInvoice)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 self-start sm:self-center"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Pay Online ₹{pendingInvoice.amountDue.toLocaleString()}</span>
            </button>
          </div>
        )}
      </div>

      {paymentSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Payment action processed successfully! Reference / Payment ID: <span className="font-mono font-bold">{lastUtr}</span>.
            </span>
          </div>
          {receiptModal && (
            <button
              onClick={() => {
                const inv = studentFees.find((f) => f.invoiceId === paymentSuccess);
                if (inv) setReceiptModal(inv);
              }}
              className="font-bold underline text-emerald-800 hover:text-emerald-950 self-start sm:self-auto"
            >
              View Official Receipt
            </button>
          )}
        </div>
      )}

      {/* Invoices List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Monthly Fee Invoices</h3>

        {studentFees.map((fee) => (
          <div
            key={fee.invoiceId}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold text-slate-900 text-base">{fee.monthYear} Coaching Fee</span>
                <span className="text-xs text-slate-400 font-mono">#{fee.invoiceId}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Due: {fee.dueDate}</span>
                <span aria-hidden="true">·</span>
                <span>Includes Math, Physics, Chemistry</span>
                {fee.paidAt && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-medium">Paid on {fee.paidAt}</span>
                  </>
                )}
              </div>
              <div className="text-base font-bold text-slate-900 font-mono tabular-nums pt-1">
                Amount: ₹{fee.amountDue.toLocaleString()}
              </div>
              {fee.paymentMethod && (
                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                  <span>Method:</span>
                  <span className="text-slate-800 font-semibold">{fee.paymentMethod}</span>
                </div>
              )}
              {(fee.utrNumber || fee.manualPaymentUtr) && (
                <div className="text-[11px] text-emerald-800 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>UTR Ref:</span>
                  <span className="font-semibold text-emerald-900">{fee.utrNumber || fee.manualPaymentUtr}</span>
                </div>
              )}

              {/* Manual payment claim pending banner */}
              {fee.manualPaymentClaimed && fee.status !== 'PAID' && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center gap-2 mt-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Manual UPI Claim Submitted (Awaiting Teacher Approval)</span>
                    <span className="text-slate-600">UTR / Ref: <span className="font-mono font-bold text-slate-800">{fee.utrNumber || fee.manualPaymentUtr || 'Pending'}</span></span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-center">
              <span className={`px-3 py-1 rounded-md text-xs font-bold border ${getStatusColor(fee.status)}`}>
                {fee.status}
              </span>

              {fee.status === 'PAID' ? (
                <button
                  onClick={() => setReceiptModal(fee)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Receipt</span>
                </button>
              ) : (
                <button
                  onClick={() => setSelectedInvoice(fee)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{fee.manualPaymentClaimed ? 'Re-open Payment' : 'Pay Online / UPI'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* UPI Payment Modal */}
      {selectedInvoice && (
        <UpiQrPaymentModal
          invoiceId={selectedInvoice.invoiceId}
          studentName={currentStudent.name}
          amount={selectedInvoice.amountDue}
          monthYear={selectedInvoice.monthYear}
          onClose={() => setSelectedInvoice(null)}
          onPaymentSuccess={handlePaymentSuccess}
          isTeacherDesk={false}
        />
      )}

      {/* Official Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">
                  Official Tuition Payment Receipt
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">TuitionPlatform Center</h3>
                <p className="text-xs text-slate-500">Affiliated Secondary & Higher Secondary Coaching</p>
              </div>
              <button
                onClick={() => setReceiptModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Receipt No:</span>
                <span className="font-mono font-bold text-slate-800">RCP-{receiptModal.invoiceId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Date of Payment:</span>
                <span className="font-medium text-slate-800">{receiptModal.paidAt || 'Recorded'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Student:</span>
                <span className="font-semibold text-slate-900">{receiptModal.studentName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Payment Mode:</span>
                <span className="font-medium text-slate-800">{receiptModal.paymentMethod || 'Direct UPI Transfer'}</span>
              </div>
              {(receiptModal.utrNumber || receiptModal.manualPaymentUtr) && (
                <div className="col-span-2">
                  <span className="text-slate-500 block">UPI Reference (UTR):</span>
                  <span className="font-mono font-bold text-slate-900">{receiptModal.utrNumber || receiptModal.manualPaymentUtr}</span>
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 text-left">Fee Description</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-3 text-slate-800">{receiptModal.monthYear} Tuition & Subject Lab Fee</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">₹{receiptModal.amountDue.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-2.5 px-3 text-slate-900">Total Paid (INR)</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700">
                      ₹{receiptModal.amountDue.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified Online Digital Payment</span>
              </div>
              <span className="font-mono text-[11px] font-semibold text-emerald-800">Status: SUCCESS</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">Authorized Computer Generated Receipt</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print?.()}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptModal(null)}
                  className="px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
