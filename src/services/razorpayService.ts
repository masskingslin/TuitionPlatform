/**
 * Razorpay Client Service for TuitionPlatform
 * Manages Razorpay Checkout script loading, order creation, and backend signature verification.
 */

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpayOrderResponse {
  success: boolean;
  orderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
  invoiceId: string;
  error?: string;
}

export interface RazorpayVerificationResult {
  success: boolean;
  paymentId?: string;
  invoiceId?: string;
  error?: string;
  verifiedAt?: string;
}

/**
 * Dynamically loads the Razorpay Checkout script into the DOM
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay checkout script from CDN.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Calls server / Cloud Function to create a Razorpay Order
 */
export async function createOrderOnServer(params: {
  invoiceId: string;
  amount: number;
  studentName: string;
  studentId?: string;
}): Promise<RazorpayOrderResponse> {
  try {
    const response = await fetch('/api/createRazorpayOrder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const data = await response.json();
      const payload = data.data || data;
      if (payload.keyId && payload.orderId) {
        return {
          success: true,
          orderId: payload.orderId,
          amount: payload.amount,
          currency: payload.currency || 'INR',
          keyId: payload.keyId,
          invoiceId: params.invoiceId
        };
      }
      return {
        success: false,
        orderId: '',
        amount: 0,
        currency: 'INR',
        keyId: '',
        invoiceId: params.invoiceId,
        error: payload.error || 'Razorpay environment keys not configured.'
      };
    }
    const errData = await response.json().catch(() => ({}));
    return {
      success: false,
      orderId: '',
      amount: 0,
      currency: 'INR',
      keyId: '',
      invoiceId: params.invoiceId,
      error: errData.error || errData.data?.error || 'Payment order creation failed.'
    };
  } catch (err: unknown) {
    console.error('Server createRazorpayOrder error:', err);
    return {
      success: false,
      orderId: '',
      amount: 0,
      currency: 'INR',
      keyId: '',
      invoiceId: params.invoiceId,
      error: err instanceof Error ? err.message : 'Unable to connect to payment server.'
    };
  }
}

/**
 * Calls server / Cloud Function to verify Razorpay HMAC-SHA256 signature
 * Fee is marked as PAID ONLY after signature is verified.
 */
export async function verifySignatureOnServer(params: {
  invoiceId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<RazorpayVerificationResult> {
  try {
    const response = await fetch('/api/verifyRazorpayPayment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const data = await response.json();
      const payload = data.data || data;
      if (payload.success) {
        return {
          success: true,
          paymentId: params.paymentId,
          invoiceId: params.invoiceId,
          verifiedAt: payload.verifiedAt || new Date().toISOString()
        };
      }
      return {
        success: false,
        error: payload.error || 'Signature verification failed'
      };
    }
    const errData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errData.error || errData.data?.error || 'Payment signature verification failed.'
    };
  } catch (err: unknown) {
    console.error('Server verifyRazorpayPayment error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error during signature verification.'
    };
  }
}
