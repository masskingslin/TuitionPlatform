import React, { useState, useEffect } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { buildUpiDeepLink, generateUpiQrDataUrl } from '../../utils/upiQr';
import {
  ShieldCheck,
  QrCode,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  X,
  Smartphone,
  ExternalLink,
  Info
} from 'lucide-react';

interface UpiQrPaymentModalProps {
  invoiceId: string;
  studentName: string;
  amount: number;
  monthYear: string;
  onClose: () => void;
  onPaymentSuccess?: (paymentMethod: string, utr: string, paymentId?: string) => void;
  isTeacherDesk?: boolean;
}

export const UpiQrPaymentModal: React.FC<UpiQrPaymentModalProps> = ({
  invoiceId,
  studentName,
  amount,
  monthYear,
  onClose,
  onPaymentSuccess,
  isTeacherDesk = false
}) => {
  const { schoolInfo, submitManualPayment, approveManualPayment, userProfile } = useTuition();
  const isFaculty = userProfile?.role === 'TEACHER' || userProfile?.role === 'ADMIN' || isTeacherDesk;

  // Institute UPI credentials from school_info
  const tuitionVpa = schoolInfo.upiVpa || 'apex.academy@okaxis';
  const tuitionMerchant = schoolInfo.upiPayeeName || schoolInfo.name || 'Apex Academy of Excellence';

  // Component states
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(true);
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [manualSubmitted, setManualSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate NPCI UPI deep link: upi://pay?pa=<teacher VPA>&pn=&am=&tn=
  const upiDeepLink = buildUpiDeepLink(tuitionVpa, tuitionMerchant, amount, invoiceId);

  useEffect(() => {
    let isMounted = true;
    setIsGeneratingQr(true);
    generateUpiQrDataUrl(tuitionVpa, tuitionMerchant, amount, invoiceId)
      .then((dataUrl) => {
        if (isMounted) {
          setQrDataUrl(dataUrl);
          setIsGeneratingQr(false);
        }
      })
      .catch((err) => {
        console.warn('QR code generation error:', err);
        if (isMounted) setIsGeneratingQr(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tuitionVpa, tuitionMerchant, amount, invoiceId]);

  const handleCopyUpi = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(tuitionVpa);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  /**
   * Student / Parent submits 12-digit UTR reference
   * Sets fee status to PENDING_APPROVAL awaiting faculty verification
   */
  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr) {
      setErrorMessage('Please enter the 12-digit UPI reference / UTR number from your payment app.');
      return;
    }

    if (cleanUtr.length < 6) {
      setErrorMessage('UTR / Reference number must be at least 6 alphanumeric characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitManualPayment(invoiceId, cleanUtr);
      setManualSubmitted(true);
      if (onPaymentSuccess) {
        onPaymentSuccess('UPI Transfer', cleanUtr);
      }
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record UPI payment claim.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  /**
   * Teacher desk direct approval
   */
  const handleTeacherDirectApprove = async () => {
    setIsSubmitting(true);
    try {
      await approveManualPayment(invoiceId);
      if (onPaymentSuccess) {
        onPaymentSuccess('Cash / Desk Collection', 'DESK_COLLECTION');
      }
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to approve payment.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header with Amount & Security Badge */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white p-5 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-teal-100 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-teal-300" />
                <span>Zero-Fee Direct UPI Payment</span>
              </span>
              <span className="text-xs text-teal-200 font-mono">
                {isFaculty ? 'Teacher Collection Desk' : 'Direct Bank-to-Bank'}
              </span>
            </div>
            <h3 className="text-2xl font-black tracking-tight mt-1.5 font-mono">
              ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-teal-100 mt-0.5">
              Invoice #{invoiceId} · {monthYear} Tuition for{' '}
              <span className="font-semibold text-white">{studentName}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {manualSubmitted ? (
            <div className="p-6 text-center space-y-3 bg-emerald-50 border border-emerald-300 rounded-2xl animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-700">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-emerald-950">Payment Submitted for Approval!</h4>
              <p className="text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
                Your UPI reference (<strong>{utrNumber}</strong>) has been submitted. Status is now{' '}
                <strong className="text-amber-800">PENDING_APPROVAL</strong>. Once your teacher verifies the payment in
                the institute account, they will mark it <strong>PAID</strong>.
              </p>
              <span className="text-[11px] text-emerald-700 font-mono block">Closing dialog...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Notice */}
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2.5 text-teal-950 text-xs">
                <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">100% Direct UPI Transfer (Zero Platform Fee)</span>
                  <p className="mt-0.5 leading-relaxed text-teal-900">
                    Scan the QR code with any UPI app or tap the button to pay directly. Enter the 12-digit UPI reference
                    (UTR) below to submit for teacher approval.
                  </p>
                </div>
              </div>

              {/* UPI QR Display */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Scan to Pay with Any UPI App
                </span>

                <div className="w-52 h-52 bg-white p-2 rounded-xl border border-slate-300 shadow-inner flex items-center justify-center">
                  {isGeneratingQr ? (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
                      <span className="text-xs">Generating UPI QR...</span>
                    </div>
                  ) : qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="UPI Payment QR Code"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <QrCode className="w-24 h-24 text-slate-400" />
                  )}
                </div>

                {/* UPI VPA Copy Bar */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono">
                  <span className="text-slate-800 font-semibold">{tuitionVpa}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="text-teal-700 hover:text-teal-900 cursor-pointer p-0.5"
                    title="Copy UPI VPA"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Deep Link Button for Mobile Users */}
                <a
                  href={upiDeepLink}
                  className="w-full py-2.5 px-4 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open in UPI App (GPay, PhonePe, Paytm)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* UTR Submission Form */}
              <form onSubmit={handleSubmitUtr} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Bank Reference / 12-Digit UPI UTR Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 431092817291 or UPI Ref ID"
                    required
                    className="w-full text-xs font-mono font-medium border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    Found in your GPay / PhonePe / Paytm transaction receipt after completing payment.
                  </span>
                </div>

                {errorMessage && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting || !utrNumber.trim()}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs shadow-2xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting for Teacher Approval...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>I Paid via UPI — Submit for Teacher Approval</span>
                      </>
                    )}
                  </button>

                  {isFaculty && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleTeacherDirectApprove}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Teacher Desk: Mark Paid Directly (Cash / Handover)</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>Payee: {tuitionMerchant}</span>
          <span>Invoice: #{invoiceId}</span>
        </div>
      </div>
    </div>
  );
};
