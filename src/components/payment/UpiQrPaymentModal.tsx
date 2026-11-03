import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Check,
  X,
  RefreshCw
} from 'lucide-react';

interface UpiQrPaymentModalProps {
  invoiceId: string;
  studentName: string;
  amount: number;
  monthYear: string;
  onClose: () => void;
  onPaymentSuccess: (paymentMethod: string, utr: string) => void;
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
  const [activeTab, setActiveTab] = useState<'QR' | 'UPI_ID' | 'CARDS'>('QR');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(540); // 9 minutes timer
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim'>('gpay');

  const tuitionVpa = 'tuitioncenter@okaxis';
  const tuitionMerchant = 'TuitionPlatform Institute';

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(tuitionVpa);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleConfirmPayment = (methodName?: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const generatedUtr = utrNumber.trim() || `UPI${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      const finalMethod = methodName || (
        activeTab === 'QR'
          ? `UPI QR (Scanned & Paid)`
          : activeTab === 'UPI_ID'
          ? `UPI (${selectedUpiApp.toUpperCase()} - ${upiIdInput || tuitionVpa})`
          : 'NetBanking / Debit Card'
      );
      onPaymentSuccess(finalMethod, generatedUtr);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 sm:p-5 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-blue-100">
                Unified Payments Interface
              </span>
              <span className="text-xs text-blue-200">Instant Settlement</span>
            </div>
            <h3 className="text-xl font-extrabold tracking-tight mt-1">
              ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-blue-100 mt-0.5">
              Invoice #{invoiceId} · {monthYear} Tuition for <span className="font-semibold">{studentName}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-bold p-1 shrink-0">
          <button
            onClick={() => setActiveTab('QR')}
            className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'QR' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan UPI QR</span>
          </button>
          <button
            onClick={() => setActiveTab('UPI_ID')}
            className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'UPI_ID' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>UPI Apps / ID</span>
          </button>
          <button
            onClick={() => setActiveTab('CARDS')}
            className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'CARDS' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Card / NetBank</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {activeTab === 'QR' && (
            <div className="flex flex-col items-center text-center space-y-3">
              {/* Dynamic QR Code Card */}
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm relative group">
                {/* Crisp Vector QR Code SVG */}
                <div className="w-52 h-52 bg-white relative p-1 flex items-center justify-center">
                  <svg
                    viewBox="0 0 200 200"
                    className="w-full h-full text-slate-900"
                    fill="currentColor"
                  >
                    {/* Top-Left Finder */}
                    <rect x="10" y="10" width="50" height="50" rx="6" fill="#0F172A" />
                    <rect x="18" y="18" width="34" height="34" rx="4" fill="#FFFFFF" />
                    <rect x="26" y="26" width="18" height="18" rx="2" fill="#1E88E5" />

                    {/* Top-Right Finder */}
                    <rect x="140" y="10" width="50" height="50" rx="6" fill="#0F172A" />
                    <rect x="148" y="18" width="34" height="34" rx="4" fill="#FFFFFF" />
                    <rect x="156" y="26" width="18" height="18" rx="2" fill="#1E88E5" />

                    {/* Bottom-Left Finder */}
                    <rect x="10" y="140" width="50" height="50" rx="6" fill="#0F172A" />
                    <rect x="18" y="148" width="34" height="34" rx="4" fill="#FFFFFF" />
                    <rect x="26" y="156" width="18" height="18" rx="2" fill="#1E88E5" />

                    {/* Timing Tracks */}
                    <rect x="68" y="32" width="6" height="6" fill="#0F172A" />
                    <rect x="80" y="32" width="6" height="6" fill="#0F172A" />
                    <rect x="92" y="32" width="6" height="6" fill="#0F172A" />
                    <rect x="104" y="32" width="6" height="6" fill="#0F172A" />
                    <rect x="116" y="32" width="6" height="6" fill="#0F172A" />
                    <rect x="128" y="32" width="6" height="6" fill="#0F172A" />

                    <rect x="32" y="68" width="6" height="6" fill="#0F172A" />
                    <rect x="32" y="80" width="6" height="6" fill="#0F172A" />
                    <rect x="32" y="92" width="6" height="6" fill="#0F172A" />
                    <rect x="32" y="104" width="6" height="6" fill="#0F172A" />
                    <rect x="32" y="116" width="6" height="6" fill="#0F172A" />
                    <rect x="32" y="128" width="6" height="6" fill="#0F172A" />

                    {/* Data Matrix Dots */}
                    <rect x="70" y="70" width="8" height="8" fill="#1E88E5" />
                    <rect x="82" y="70" width="8" height="8" fill="#0F172A" />
                    <rect x="94" y="70" width="8" height="8" fill="#0F172A" />
                    <rect x="106" y="70" width="8" height="8" fill="#1E88E5" />
                    <rect x="118" y="70" width="8" height="8" fill="#0F172A" />

                    <rect x="70" y="82" width="8" height="8" fill="#0F172A" />
                    <rect x="94" y="82" width="8" height="8" fill="#1E88E5" />
                    <rect x="118" y="82" width="8" height="8" fill="#0F172A" />

                    <rect x="70" y="110" width="8" height="8" fill="#1E88E5" />
                    <rect x="82" y="110" width="8" height="8" fill="#0F172A" />
                    <rect x="106" y="110" width="8" height="8" fill="#0F172A" />
                    <rect x="118" y="110" width="8" height="8" fill="#1E88E5" />

                    <rect x="70" y="122" width="8" height="8" fill="#0F172A" />
                    <rect x="82" y="122" width="8" height="8" fill="#1E88E5" />
                    <rect x="94" y="122" width="8" height="8" fill="#0F172A" />
                    <rect x="118" y="122" width="8" height="8" fill="#0F172A" />

                    <rect x="70" y="140" width="8" height="8" fill="#0F172A" />
                    <rect x="94" y="140" width="8" height="8" fill="#1E88E5" />
                    <rect x="106" y="140" width="8" height="8" fill="#0F172A" />
                    <rect x="118" y="140" width="8" height="8" fill="#0F172A" />

                    <rect x="70" y="152" width="8" height="8" fill="#1E88E5" />
                    <rect x="82" y="152" width="8" height="8" fill="#0F172A" />
                    <rect x="106" y="152" width="8" height="8" fill="#1E88E5" />

                    <rect x="140" y="70" width="8" height="8" fill="#0F172A" />
                    <rect x="152" y="70" width="8" height="8" fill="#1E88E5" />
                    <rect x="164" y="70" width="8" height="8" fill="#0F172A" />
                    <rect x="176" y="70" width="8" height="8" fill="#0F172A" />

                    <rect x="140" y="82" width="8" height="8" fill="#1E88E5" />
                    <rect x="164" y="82" width="8" height="8" fill="#1E88E5" />
                    <rect x="176" y="82" width="8" height="8" fill="#0F172A" />

                    <rect x="140" y="94" width="8" height="8" fill="#0F172A" />
                    <rect x="152" y="94" width="8" height="8" fill="#0F172A" />
                    <rect x="164" y="94" width="8" height="8" fill="#1E88E5" />

                    <rect x="140" y="110" width="8" height="8" fill="#1E88E5" />
                    <rect x="152" y="110" width="8" height="8" fill="#0F172A" />
                    <rect x="176" y="110" width="8" height="8" fill="#1E88E5" />

                    <rect x="140" y="140" width="8" height="8" fill="#0F172A" />
                    <rect x="152" y="140" width="8" height="8" fill="#1E88E5" />
                    <rect x="164" y="140" width="8" height="8" fill="#0F172A" />
                    <rect x="176" y="140" width="8" height="8" fill="#0F172A" />

                    <rect x="140" y="152" width="8" height="8" fill="#0F172A" />
                    <rect x="164" y="152" width="8" height="8" fill="#1E88E5" />
                    <rect x="176" y="152" width="8" height="8" fill="#0F172A" />

                    <rect x="140" y="164" width="8" height="8" fill="#1E88E5" />
                    <rect x="152" y="164" width="8" height="8" fill="#0F172A" />
                    <rect x="164" y="164" width="8" height="8" fill="#0F172A" />
                    <rect x="176" y="164" width="8" height="8" fill="#1E88E5" />

                    {/* Center UPI Badge Overlay */}
                    <circle cx="100" cy="100" r="16" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
                    <path
                      d="M93 94 L100 87 L107 94 L103 94 L103 103 L97 103 L97 94 Z"
                      fill="#00695C"
                    />
                    <circle cx="100" cy="108" r="2.5" fill="#1E88E5" />
                  </svg>
                </div>

                <div className="flex items-center justify-center gap-1.5 mt-2 text-[11px] font-semibold text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>QR Code expires in: <span className="font-mono font-bold text-slate-800">{formatTime(timeLeft)}</span></span>
                </div>
              </div>

              {/* Supported UPI Apps Row */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                  Scan with any installed UPI App
                </span>
                <div className="flex items-center justify-center gap-2 text-xs font-bold">
                  <span className="px-2.5 py-1 bg-slate-100 rounded-md text-slate-800 border border-slate-200">
                    GPay
                  </span>
                  <span className="px-2.5 py-1 bg-purple-50 rounded-md text-purple-800 border border-purple-200">
                    PhonePe
                  </span>
                  <span className="px-2.5 py-1 bg-blue-50 rounded-md text-blue-800 border border-blue-200">
                    Paytm
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 rounded-md text-emerald-800 border border-emerald-200">
                    BHIM UPI
                  </span>
                  <span className="px-2.5 py-1 bg-amber-50 rounded-md text-amber-800 border border-amber-200">
                    CRED
                  </span>
                </div>
              </div>

              {/* VPA Copy Box */}
              <div className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div className="text-left space-y-0.5">
                  <span className="text-slate-500 text-[11px] block font-medium">Coaching Institute VPA / UPI ID</span>
                  <span className="font-mono font-bold text-slate-900 select-all">{tuitionVpa}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-2xs"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>

              {/* UTR Input (Optional for manual bank reference) */}
              <div className="w-full text-left space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  12-Digit UPI Transaction Ref / UTR (Optional)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="e.g., 432109876543 (from GPay / PhonePe receipt)"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          )}

          {activeTab === 'UPI_ID' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Choose Preferred UPI App
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'gpay', label: 'Google Pay', suffix: '@okaxis / @oksbi' },
                    { id: 'phonepe', label: 'PhonePe', suffix: '@ybl / @ibl' },
                    { id: 'paytm', label: 'Paytm UPI', suffix: '@paytm' },
                    { id: 'bhim', label: 'BHIM UPI', suffix: '@upi' }
                  ].map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUpiApp(app.id as any)}
                      className={`p-3 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                        selectedUpiApp === app.id
                          ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="font-bold text-slate-900">{app.label}</span>
                      <span className="text-[11px] text-slate-400 font-mono mt-1">{app.suffix}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter Your UPI ID / VPA
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., mobile@upi or username@okhdfcbank"
                    value={upiIdInput}
                    onChange={(e) => setUpiIdInput(e.target.value)}
                    className="flex-1 text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  A payment request notification for ₹{amount} will be dispatched to your UPI app.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Payee:</span>
                  <span className="font-semibold text-slate-900">{tuitionMerchant}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Merchant Category:</span>
                  <span className="text-slate-800">Educational Coaching Services</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Account Type:</span>
                  <span className="text-slate-800">Verified Current Account</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CARDS' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    placeholder="4532 •••• •••• 8892"
                    defaultValue="4532 8901 2345 8892"
                    className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      defaultValue="08/29"
                      className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">CVV</label>
                    <input
                      type="password"
                      maxLength={3}
                      placeholder="•••"
                      defaultValue="782"
                      className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    defaultValue={studentName + ' (Guardian)'}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="pt-1">
                <span className="text-xs font-semibold text-slate-700 block mb-1">Or Select NetBanking Bank</span>
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                  {['HDFC', 'SBI', 'ICICI', 'Axis'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => handleConfirmPayment(`NetBanking (${bank})`)}
                      className="p-2 border border-slate-200 rounded-lg hover:border-blue-400 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Badge */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>NPCI Bharat UPI Certified & 256-Bit SSL Encrypted</span>
            </div>
            <span className="font-semibold text-slate-700">Zero Gateway Surcharge</span>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isVerifying}
            onClick={() => handleConfirmPayment()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-2"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying UPI Payment...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {isTeacherDesk
                    ? `Confirm Payment Received (₹${amount.toLocaleString('en-IN')})`
                    : `I Have Paid ₹${amount.toLocaleString('en-IN')}`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
