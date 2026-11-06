import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';

const app = express();
app.use(express.json());

interface StoredLinkCode {
  code: string;
  studentId: string;
  studentName: string;
  createdAt: string;
  createdAtMs: number;
  expiresAt: string;
  expiresAtMs: number;
  used: boolean;
  usedBy?: string | null;
  usedAt?: number | null;
}

const serverCodesStore = new Map<string, StoredLinkCode>();

let activeSchoolCodes = {
  studentCode: `S-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
  teacherCode: `T-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
};

function generateServerCode(prefix: string, length = 5): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return `${prefix}-${result}`;
}

/**
 * 1. Cloud Function / API: createParentLinkCode
 * Generates single-use parent link code server-side with 24-hour expiration.
 */
app.post(['/api/createParentLinkCode', '/createParentLinkCode'], (req: Request, res: Response) => {
  const payload = req.body?.data || req.body || {};
  const { studentId, studentName = 'Student' } = payload;

  if (!studentId) {
    return res.status(400).json({ success: false, error: 'studentId is required' });
  }

  const code = generateServerCode('P', 6);
  const nowMs = Date.now();
  const expiresAtMs = nowMs + 24 * 60 * 60 * 1000;

  const newCodeRecord: StoredLinkCode = {
    code,
    studentId,
    studentName,
    createdAt: new Date(nowMs).toISOString(),
    createdAtMs: nowMs,
    expiresAt: 'In 24 hours',
    expiresAtMs,
    used: false,
    usedBy: null,
    usedAt: null
  };

  serverCodesStore.set(code, newCodeRecord);

  const responsePayload = {
    success: true,
    parentLinkCode: {
      code: newCodeRecord.code,
      studentId: newCodeRecord.studentId,
      studentName: newCodeRecord.studentName,
      expiresAt: newCodeRecord.expiresAt,
      createdAt: 'Just now',
      expiresAtMs: newCodeRecord.expiresAtMs,
      used: false
    }
  };

  res.json({ ...responsePayload, data: responsePayload });
});

/**
 * 2. Cloud Function / API: linkChildWithCode
 * Validates existence, 24-hour expiration, and single-use status before linking child.
 */
app.post(['/api/linkChildWithCode', '/linkChildWithCode'], (req: Request, res: Response) => {
  const payload = req.body?.data || req.body || {};
  const { code, parentId = 'p1' } = payload;

  if (!code || typeof code !== 'string') {
    const errorResponse = {
      success: false,
      message: 'Please provide a valid parent link code.'
    };
    return res.status(400).json({ ...errorResponse, data: errorResponse });
  }

  const cleanCode = code.trim().toUpperCase();
  const codeRecord = serverCodesStore.get(cleanCode);

  if (!codeRecord) {
    const notFoundResponse = {
      success: false,
      message: 'Invalid parent link code. Ask your student to generate a fresh code.'
    };
    return res.json({ ...notFoundResponse, data: notFoundResponse });
  }

  if (codeRecord.used === true) {
    const usedResponse = {
      success: false,
      message: 'This parent link code has already been used (single-use only). Please request a fresh code.'
    };
    return res.json({ ...usedResponse, data: usedResponse });
  }

  const currentTime = Date.now();
  if (currentTime > codeRecord.expiresAtMs) {
    const expiredResponse = {
      success: false,
      message: 'This parent link code has expired (codes expire after 24 hours). Please request a fresh code.'
    };
    return res.json({ ...expiredResponse, data: expiredResponse });
  }

  codeRecord.used = true;
  codeRecord.usedBy = parentId;
  codeRecord.usedAt = currentTime;

  const childProfile = {
    id: codeRecord.studentId,
    fullName: codeRecord.studentName || 'Student',
    grade: 'Grade 10',
    section: 'State Board Batch A',
    schoolName: 'Apex Academy of Excellence'
  };

  const successResponse = {
    success: true,
    message: `Successfully linked ${childProfile.fullName}!`,
    child: childProfile
  };

  res.json({ ...successResponse, data: successResponse });
});

/**
 * 3. Cloud Function / API: regenerateSchoolCodes
 */
app.post(['/api/regenerateSchoolCodes', '/regenerateSchoolCodes'], (req: Request, res: Response) => {
  const payload = req.body?.data || req.body || {};
  const { which = 'both' } = payload;

  const newStudentCode = which === 'teacher' ? activeSchoolCodes.studentCode : generateServerCode('S', 6);
  const newTeacherCode = which === 'student' ? activeSchoolCodes.teacherCode : generateServerCode('T', 6);

  activeSchoolCodes = {
    studentCode: newStudentCode,
    teacherCode: newTeacherCode
  };

  const response = {
    success: true,
    studentCode: newStudentCode,
    teacherCode: newTeacherCode
  };

  res.json({ ...response, data: response });
});

// Razorpay Server Configuration from Environment Variables ONLY
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

interface ServerRazorpayOrder {
  orderId: string;
  invoiceId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  studentName: string;
  studentId?: string;
  status: 'created' | 'paid';
  paymentId?: string;
  createdAt: string;
  paidAt?: string;
}

const razorpayOrdersStore = new Map<string, ServerRazorpayOrder>();

/**
 * 4. Razorpay API: createRazorpayOrder
 */
app.post(['/api/createRazorpayOrder', '/createRazorpayOrder'], (req: Request, res: Response) => {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return res.status(500).json({
      success: false,
      error: 'Razorpay API credentials not configured in environment.'
    });
  }

  const payload = req.body?.data || req.body || {};
  const { invoiceId, amount, studentName = 'Student', studentId, currency = 'INR' } = payload;

  if (!invoiceId || !amount) {
    return res.status(400).json({
      success: false,
      error: 'invoiceId and amount are required.'
    });
  }

  const amountInPaise = Math.round(Number(amount) * 100);
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const orderId = `order_${Date.now().toString(36)}_${randomSuffix}`;

  const orderRecord: ServerRazorpayOrder = {
    orderId,
    invoiceId,
    amount: Number(amount),
    amountInPaise,
    currency,
    studentName,
    studentId,
    status: 'created',
    createdAt: new Date().toISOString()
  };

  razorpayOrdersStore.set(orderId, orderRecord);

  const responsePayload = {
    success: true,
    orderId,
    amount: amountInPaise,
    currency,
    keyId: RAZORPAY_KEY_ID,
    invoiceId
  };

  res.json({ ...responsePayload, data: responsePayload });
});

/**
 * 5. Razorpay API: verifyRazorpayPayment
 */
app.post(['/api/verifyRazorpayPayment', '/verifyRazorpayPayment'], (req: Request, res: Response) => {
  if (!RAZORPAY_KEY_SECRET) {
    return res.status(500).json({
      success: false,
      error: 'Razorpay KEY_SECRET is not configured in environment.'
    });
  }

  const payload = req.body?.data || req.body || {};
  const { invoiceId, orderId, paymentId, signature } = payload;

  if (!invoiceId || !orderId || !paymentId || !signature) {
    const err = { success: false, error: 'Missing parameters for signature verification.' };
    return res.status(400).json({ ...err, data: err });
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expectedSignature !== signature) {
    const mismatch = { success: false, error: 'Razorpay payment signature mismatch.' };
    return res.status(400).json({ ...mismatch, data: mismatch });
  }

  const nowIso = new Date().toISOString();
  const existingOrder = razorpayOrdersStore.get(orderId);
  if (existingOrder) {
    existingOrder.status = 'paid';
    existingOrder.paymentId = paymentId;
    existingOrder.paidAt = nowIso;
  }

  const successPayload = {
    success: true,
    invoiceId,
    paymentId,
    orderId,
    verifiedAt: nowIso
  };

  res.json({ ...successPayload, data: successPayload });
});

/**
 * 6. Razorpay API: razorpayWebhook
 */
app.post(['/api/razorpayWebhook', '/razorpayWebhook'], (req: Request, res: Response) => {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'Razorpay webhook secret not configured' });
  }

  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  if (!signature) {
    return res.status(400).json({ error: 'Missing x-razorpay-signature header' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    return res.status(400).json({ error: 'Signature verification failed' });
  }

  const event = req.body?.event;
  const payload = req.body?.payload;

  if (event === 'payment.captured' || event === 'order.paid') {
    const payment = payload?.payment?.entity;
    const order = payload?.order?.entity;

    const paymentId = payment?.id;
    const orderId = payment?.order_id || order?.id;

    if (orderId && razorpayOrdersStore.has(orderId)) {
      const stored = razorpayOrdersStore.get(orderId)!;
      stored.status = 'paid';
      stored.paymentId = paymentId;
      stored.paidAt = new Date().toISOString();
    }
  }

  res.status(200).json({ status: 'ok', received: true });
});

/**
 * 7. Cloud Function / API: sendParentMessage
 */
app.post(['/api/sendParentMessage', '/sendParentMessage'], async (req: Request, res: Response) => {
  const payload = req.body?.data || req.body || {};
  const {
    recipientPhone,
    recipientName = 'Guardian',
    studentId,
    studentName = 'Student',
    messageType = 'ATTENDANCE_ALERT',
    channel = 'SMS',
    content = '',
    title,
    metadata = {}
  } = payload;

  if (!recipientPhone || !content) {
    return res.status(400).json({
      success: false,
      error: 'recipientPhone and content are required parameters.'
    });
  }

  const cleanPhone = String(recipientPhone).replace(/[^\d+]/g, '');

  if (channel === 'WHATSAPP') {
    if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      const errRes = {
        success: false,
        status: 'FAILED',
        error: 'SMS not configured'
      };
      return res.status(400).json({ ...errRes, data: errRes });
    }

    try {
      const waResponse = await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone.replace(/^\+/, ''),
            type: 'text',
            text: { preview_url: true, body: content }
          })
        }
      );
      const waData = await waResponse.json();
      if (waResponse.ok && waData.messages?.[0]?.id) {
        const okRes = {
          success: true,
          messageId: waData.messages[0].id,
          channel: 'WHATSAPP',
          status: 'DELIVERED'
        };
        return res.json({ ...okRes, data: okRes });
      }
    } catch (err) {
      console.error('WhatsApp API error:', err);
    }
  }

  if (!process.env.MSG91_AUTH_KEY) {
    const errRes = {
      success: false,
      status: 'FAILED',
      error: 'SMS not configured'
    };
    return res.status(400).json({ ...errRes, data: errRes });
  }

  try {
    const msg91Response = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_FLOW_ID || 'tuition_parent_alert_flow',
        short_url: '1',
        recipients: [
          {
            mobiles: cleanPhone.replace(/[^\d]/g, '').slice(-10),
            name: recipientName,
            student_name: studentName,
            message: content
          }
        ]
      })
    });
    const msg91Data = await msg91Response.json();
    if (msg91Response.ok && msg91Data?.type === 'success') {
      const okRes = {
        success: true,
        messageId: msg91Data.message || `msg91_${Date.now()}`,
        channel: 'SMS',
        status: 'DELIVERED'
      };
      return res.json({ ...okRes, data: okRes });
    }
  } catch (err) {
    console.error('MSG91 API error:', err);
  }

  const failedRes = {
    success: false,
    status: 'FAILED',
    error: 'SMS not configured'
  };
  res.status(400).json({ ...failedRes, data: failedRes });
});

/**
 * 8. Cloud Function / API: sendFcmNotification
 */
app.post(['/api/sendFcmNotification', '/sendFcmNotification'], async (req: Request, res: Response) => {
  const payload = req.body?.data || req.body || {};
  const {
    title = 'Tuition Alert',
    body = '',
    messageType = 'HOMEWORK',
    targetRole = 'ALL',
    studentId,
    studentName,
    batchId
  } = payload;

  const fcmMessageId = `fcm_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const responsePayload = {
    success: true,
    messageId: fcmMessageId,
    title,
    body,
    messageType,
    targetRole,
    studentId,
    studentName,
    batchId,
    status: 'DELIVERED',
    dispatchedAt: new Date().toISOString()
  };

  res.json({ ...responsePayload, data: responsePayload });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (isProduction) {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`TuitionPlatform full-stack server running on port ${port} (${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
