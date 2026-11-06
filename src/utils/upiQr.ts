import QRCode from 'qrcode';

/**
 * Builds standard National Payments Corporation of India (NPCI) UPI deep link URI
 */
export function buildUpiDeepLink(
  vpa: string,
  payeeName: string,
  amount: number,
  invoiceId: string
): string {
  const cleanVpa = vpa.trim();
  const cleanName = payeeName.trim();
  return `upi://pay?pa=${encodeURIComponent(cleanVpa)}&pn=${encodeURIComponent(cleanName)}&am=${amount}&tn=${encodeURIComponent(`Fee-${invoiceId}`)}&cu=INR`;
}

/**
 * Generates an offline, high-contrast QR Code Data URL for any UPI payment
 */
export async function generateUpiQrDataUrl(
  vpa: string,
  payeeName: string,
  amount: number,
  invoiceId: string
): Promise<string> {
  const upiUri = buildUpiDeepLink(vpa, payeeName, amount, invoiceId);
  try {
    return await QRCode.toDataURL(upiUri, {
      width: 280,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.warn('QR code generation error:', err);
    return '';
  }
}
