import React, { useState, useEffect } from 'react';
import { useTuition } from '../../context/TuitionContext';
import {
  loadRazorpayScript,
  createOrderOnServer,
  verifySignatureOnServer
} from '../../services/razorpayService';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  X,
  Smartphone,
  Lock,
  ArrowRight,
  Info
} from 'lucide-react';

interface UpiQrPaymentModalProps {
  invoiceId: string;
  studentName: string;
  amount: number;
  monthYear: string;
  onClose: () => void;
  onPaymentSuccess: (paymentMethod: string, utr: string, paymentId?: string) => void;
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
  const { payFee, submitManualPayment, currentUser, userProfile } = useTuition();
  const [activeTab, setActiveTab] = useState<'RAZORPAY' | 'MANUAL_UPI'>('RAZORPAY');

  // Razorpay Checkout states
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);
  const [razorpayStatusText, setRazorpayStatusText] = useState<string | null>(null);
  const [razorpayError, setRazorpayError] = useState<string | null>(null);
  const [verifiedPaymentId, setVerifiedPaymentId] = useState<string | null>(null);

  // Manual UPI States
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [manualSubmitted, setManualSubmitted] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const tuitionVpa = 'tuitioncenter@okaxis';
  const tuitionMerchant = 'Apex Academy of Excellence';

  useEffect(() => {
    // Preload Razorpay Checkout script in background
    loadRazorpayScript().catch((err) => console.log('Razorpay script preload note:', err));
  }, []);

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(tuitionVpa);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  /**
   * 1. RAZORPAY CHECKOUT FLOW
   * - Creates order in Cloud Function / server
   * - Launches Razorpay Checkout popup
   * - Marks fee PAID ONLY after webhook/server verifies signature
   * - Stores paymentId in fee record
   */
  const handleLaunchRazorpayCheckout = async () => {
    setIsProcessingRazorpay(true);
    setRazorpayError(null);
    setRazorpayStatusText('Creating secure order with Cloud Function...');

    try {
      // Step A: Create order server-side
      const order = await createOrderOnServer({
        invoiceId,
        amount,
        studentName,
        studentId: userProfile?.studentId || 's1'
      });

      if (!order.success) {
        throw new Error(order.error || 'Failed to create Razorpay order on server.');
      }

      setRazorpayStatusText('Loading Razorpay Checkout gateway...');
      const scriptLoaded = await loadRazorpayScript();

      // If Razorpay SDK loaded from CDN
      if (scriptLoaded && window.Razorpay) {
        setRazorpayStatusText('Opening Razorpay payment window...');

        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'Apex Academy of Excellence',
          description: `Tuition Fee: Invoice #${invoiceId} (${monthYear})`,
          order_id: order.orderId,
          image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=128&auto=format&fit=crop&q=80',
          prefill: {
            name: studentName,
            email: currentUser?.email || 'student@apex.edu',
            contact: '9876543210'
          },
          notes: {
            invoiceId,
            studentName,
            center: 'Apex Academy'
          },
          theme: {
            color: '#00695C'
          },
          handler: async function (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) {
            setRazorpayStatusText('Cryptographic signature verification in progress with server webhook...');

            // Step B: Verify signature on server (fee marked PAID only after signature verified)
            const verification = await verifySignatureOnServer({
              invoiceId,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });

            if (verification.success) {
              setVerifiedPaymentId(response.razorpay_payment_id);
              setRazorpayStatusText('Signature verified! Fee marked as PAID.');

              // Step C: Update fee record in Firestore & Context
              await payFee(
                invoiceId,
                `Razorpay Online (${response.razorpay_payment_id})`,
                response.razorpay_payment_id,
                response.razorpay_order_id
              );

              setTimeout(() => {
                setIsProcessingRazorpay(false);
                onPaymentSuccess(
                  `Razorpay Checkout`,
                  response.razorpay_payment_id,
                  response.razorpay_payment_id
                );
              }, 1200);
            } else {
              setRazorpayError(
                verification.error ||
                  'Razorpay payment signature mismatch. Signature was not verified, so fee could not be marked as paid.'
              );
              setIsProcessingRazorpay(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessingRazorpay(false);
              setRazorpayStatusText(null);
            }
          }
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.on('payment.failed', function (response: any) {
          setIsProcessingRazorpay(false);
          setRazorpayError(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
        });
        razorpayInstance.open();
      } else {
        setIsProcessingRazorpay(false);
        setRazorpayError('Payment unavailable, try again');
      }
    } catch (err: unknown) {
      console.error('Razorpay checkout error:', err);
      setRazorpayError(err instanceof Error ? err.message : 'Unable to complete Razorpay payment.');
      setIsProcessingRazorpay(false);
    }
  };

  /**
   * 2. MANUAL UPI PAYMENT FLOW ("I Paid" option)
   * - Allows parent/student to enter UTR after transferring via UPI app
   * - Explicitly keeps fee pending until approved by teacher
   */
  const handleManualUpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr) {
      setManualError('Please enter the 12-digit UPI reference / UTR number from your payment app.');
      return;
    }

    if (cleanUtr.length < 6) {
      setManualError('UTR / Reference number must be at least 6 alphanumeric characters.');
      return;
    }

    setIsSubmittingManual(true);
    try {
      await submitManualPayment(invoiceId, cleanUtr);
      setManualSubmitted(true);
      setTimeout(() => {
        setIsSubmittingManual(false);
        onClose();
      }, 3000);
    } catch (err) {
      setManualError('Failed to record manual payment claim. Please retry.');
      setIsSubmittingManual(false);
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
                <span>Verified Payment Gateway</span>
              </span>
              <span className="text-xs text-teal-200 font-mono">
                {isTeacherDesk ? 'Teacher Desk Collection' : '256-Bit SSL'}
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

        {/* Tab Switcher: Razorpay Checkout (Instant) vs Manual UPI (Teacher Approved) */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-bold p-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('RAZORPAY')}
            className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'RAZORPAY'
                ? 'bg-white text-teal-800 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-teal-700" />
            <span>Razorpay Checkout</span>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold uppercase">
              Instant
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MANUAL_UPI')}
            className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'MANUAL_UPI'
                ? 'bg-white text-teal-800 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-teal-700" />
            <span>Manual UPI / QR</span>
            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold uppercase">
              Approval Req.
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* TAB 1: RAZORPAY CHECKOUT */}
          {activeTab === 'RAZORPAY' && (
            <div className="space-y-4">
              <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    <span>Official Razorpay Payment Gateway</span>
                  </span>
                  <span className="text-[10px] font-mono text-teal-800 font-bold bg-teal-100 px-2 py-0.5 rounded">
                    Instant Auto-Receipt
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pay securely with UPI (Google Pay, PhonePe, Paytm, BHIM), Debit/Credit Cards (Visa, MasterCard, RuPay), NetBanking, or Wallets. Orders are cryptographically verified with webhook signatures.
                </p>
              </div>

              {/* Supported payment instruments banner */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Accepted Payment Methods
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] font-medium text-slate-700">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <Smartphone className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                    <span>All UPI Apps</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <CreditCard className="w-4 h-4 mx-auto text-purple-600 mb-1" />
                    <span>Cards (RuPay/Visa)</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <Lock className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                    <span>Net Banking</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 mx-auto text-amber-600 mb-1" />
                    <span>Wallets</span>
                  </div>
                </div>
              </div>

              {/* Processing Spinner or Status notice */}
              {isProcessingRazorpay && (
                <div className="p-4 bg-teal-50 border border-teal-300 rounded-xl flex items-center gap-3 text-teal-900 text-xs animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-700 shrink-0" />
                  <div>
                    <span className="font-bold block">Processing Razorpay Transaction</span>
                    <span>{razorpayStatusText || 'Waiting for payment confirmation...'}</span>
                  </div>
                </div>
              )}

              {/* Verified Success Box */}
              {verifiedPaymentId && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3 text-emerald-900 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block text-sm">Payment Verified by Webhook!</span>
                    <span className="font-mono text-[11px]">Razorpay Payment ID: {verifiedPaymentId}</span>
                  </div>
                </div>
              )}

              {/* Error Box */}
              {razorpayError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{razorpayError}</span>
                </div>
              )}

              {/* Main Pay Button */}
              <button
                type="button"
                disabled={isProcessingRazorpay}
                onClick={handleLaunchRazorpayCheckout}
                className="w-full py-3 bg-[#00695C] hover:bg-[#005a4e] active:bg-[#004d40] disabled:opacity-60 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {isProcessingRazorpay ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Secure Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹{amount.toLocaleString('en-IN')} via Razorpay Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Protected by Razorpay Standard Encryption & Signature Verification</span>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL UPI / QR (TEACHER APPROVAL REQUIRED) */}
          {activeTab === 'MANUAL_UPI' && (
            <div className="space-y-4">
              {/* Important Teacher Approval Notice */}
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-amber-950 text-xs">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Manual "I Paid" Option (Requires Teacher Approval)</span>
                  <p className="mt-0.5 leading-relaxed text-amber-900">
                    If you transfer directly using your UPI app or scanning the QR code, your fee will <strong>remain PENDING</strong> until the teacher inspects the institute bank statement and approves the payment.
                  </p>
                </div>
              </div>

              {manualSubmitted ? (
                <div className="p-6 text-center space-y-3 bg-emerald-50 border border-emerald-300 rounded-2xl animate-in zoom-in-95">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-700">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-emerald-950">Payment Claim Submitted!</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
                    Your UTR reference (<strong>{utrNumber}</strong>) has been submitted to the coaching center faculty. Once approved by the teacher, your receipt will be marked as <strong>PAID</strong>.
                  </p>
                  <span className="text-[11px] text-emerald-700 font-mono block">Closing dialog...</span>
                </div>
              ) : (
                <form onSubmit={handleManualUpiSubmit} className="space-y-4">
                  {/* Institute UPI QR Box */}
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Coaching Center Official UPI QR
                    </span>

                    {/* SVG Bharat QR */}
                    <div className="w-44 h-44 bg-white p-2 rounded-xl border border-slate-300 shadow-inner flex items-center justify-center">
                      <svg viewBox="0 0 200 200" className="w-full h-full text-slate-900" fill="currentColor">
                        <rect x="10" y="10" width="50" height="50" rx="6" fill="#0F172A" />
                        <rect x="18" y="18" width="34" height="34" rx="4" fill="#FFFFFF" />
                        <rect x="26" y="26" width="18" height="18" rx="2" fill="#00695C" />

                        <rect x="140" y="10" width="50" height="50" rx="6" fill="#0F172A" />
                        <rect x="148" y="18" width="34" height="34" rx="4" fill="#FFFFFF" />
                        <rect x="156" y="26" width="18" height="18" rx="2" fill="#00695C" />

                        <rect x="10" y="140" width="50" height="50" rx="6" fill="#0F172A" />
                        <rect x="18" y="148" width="34" height="34" rx="4" fill="#FFFFFF" />
                        <rect x="26" y="156" width="18" height="18" rx="2" fill="#00695C" />

                        {/* QR grid elements */}
                        <rect x="75" y="20" width="12" height="12" fill="#0F172A" />
                        <rect x="105" y="20" width="14" height="14" fill="#00695C" />
                        <rect x="75" y="45" width="20" height="10" fill="#0F172A" />
                        <rect x="110" y="45" width="12" height="12" fill="#0F172A" />
                        <rect x="20" y="75" width="14" height="14" fill="#00695C" />
                        <rect x="45" y="80" width="12" height="12" fill="#0F172A" />
                        <rect x="75" y="75" width="50" height="50" rx="6" fill="#00695C" />
                        <rect x="85" y="85" width="30" height="30" rx="4" fill="#FFFFFF" />
                        <rect x="94" y="94" width="12" height="12" rx="2" fill="#00695C" />
                        <rect x="140" y="80" width="20" height="14" fill="#0F172A" />
                        <rect x="170" y="80" width="12" height="12" fill="#00695C" />
                        <rect x="75" y="140" width="12" height="12" fill="#0F172A" />
                        <rect x="100" y="140" width="25" height="10" fill="#0F172A" />
                        <rect x="140" y="140" width="12" height="12" fill="#00695C" />
                        <rect x="165" y="140" width="18" height="18" fill="#0F172A" />
                        <rect x="75" y="165" width="20" height="14" fill="#00695C" />
                        <rect x="110" y="165" width="14" height="14" fill="#0F172A" />
                        <rect x="140" y="165" width="20" height="20" fill="#0F172A" />
                      </svg>
                    </div>

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
                  </div>

                  {/* UTR Input Form */}
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
                      Found in your GPay / PhonePe / Paytm receipt screen after completing the transfer.
                    </span>
                  </div>

                  {manualError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{manualError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingManual || !utrNumber.trim()}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs shadow-2xs"
                  >
                    {isSubmittingManual ? (
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
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>Coaching Center: {tuitionMerchant}</span>
          <span>Invoice: #{invoiceId}</span>
        </div>
      </div>
    </div>
  );
};
