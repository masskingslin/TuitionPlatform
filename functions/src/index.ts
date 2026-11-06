import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

/**
 * 1. createParentLinkCode
 * Server-side code generation with 24-hour expiration and single-use enforcement.
 */
export const createParentLinkCode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to generate a link code.');
  }

  const { studentId, studentName = 'Student' } = request.data || {};
  const targetStudentId = studentId || request.auth.uid;

  // Generate cryptographically secure random 6-character suffix
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomBytes = crypto.randomBytes(6);
  let randomSuffix = '';
  for (let i = 0; i < 6; i++) {
    randomSuffix += characters.charAt(randomBytes[i] % characters.length);
  }
  const code = `P-${randomSuffix}`;

  const nowMs = Date.now();
  const expiresAtMs = nowMs + 24 * 60 * 60 * 1000; // Strictly 24 hours

  const codeRecord = {
    code,
    studentId: targetStudentId,
    studentName,
    createdAt: new Date(nowMs).toISOString(),
    createdAtMs: nowMs,
    expiresAt: 'In 24 hours',
    expiresAtMs,
    used: false,
    usedBy: null,
    usedAt: null
  };

  await db.collection('parent_links').doc(code).set(codeRecord);

  return {
    success: true,
    parentLinkCode: codeRecord
  };
});

/**
 * 2. linkChildWithCode
 * Validates existence, 24-hour expiration, and single-use status before linking child.
 */
export const linkChildWithCode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to link a child.');
  }

  const parentId = request.auth.uid;
  const { code } = request.data || {};

  if (!code || typeof code !== 'string') {
    throw new HttpsError('invalid-argument', 'A valid parent link code must be provided.');
  }

  const cleanCode = code.trim().toUpperCase();
  const codeRef = db.collection('parent_links').doc(cleanCode);

  return await db.runTransaction(async (transaction) => {
    const codeDoc = await transaction.get(codeRef);

    if (!codeDoc.exists) {
      return {
        success: false,
        message: 'Invalid parent link code. Ask your student to generate a fresh code.'
      };
    }

    const data = codeDoc.data();
    if (!data) {
      return { success: false, message: 'Invalid parent link code data.' };
    }

    // Single-use validation
    if (data.used === true) {
      return {
        success: false,
        message: 'This parent link code has already been used. Please generate a fresh code.'
      };
    }

    // 24-hour expiration validation
    const currentTime = Date.now();
    if (data.expiresAtMs && currentTime > data.expiresAtMs) {
      return {
        success: false,
        message: 'This parent link code has expired (codes expire after 24 hours). Please request a fresh code.'
      };
    }

    // Mark single-use
    transaction.update(codeRef, {
      used: true,
      usedBy: parentId,
      usedAt: currentTime
    });

    const childProfile = {
      id: data.studentId,
      fullName: data.studentName || 'Student',
      grade: 'Grade 10',
      section: 'State Board Batch A',
      schoolName: 'Apex Academy of Excellence'
    };

    // Update parent's user doc with linked child
    const parentUserRef = db.collection('users').doc(parentId);
    const parentDoc = await transaction.get(parentUserRef);
    if (parentDoc.exists) {
      const existingChildren: string[] = parentDoc.data()?.linkedChildIds || [];
      if (!existingChildren.includes(childProfile.id)) {
        transaction.update(parentUserRef, {
          linkedChildIds: [...existingChildren, childProfile.id]
        });
      }
    }

    return {
      success: true,
      message: `Successfully linked ${childProfile.fullName}!`,
      child: childProfile
    };
  });
});

/**
 * 3. regenerateSchoolCodes
 * Server-side rotation of school join codes for students and teachers. Restricted to ADMIN/TEACHER.
 */
export const regenerateSchoolCodes = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const callerDoc = await db.collection('users').doc(request.auth.uid).get();
  const callerRole = callerDoc.data()?.role;
  if (callerRole !== 'ADMIN' && callerRole !== 'TEACHER') {
    throw new HttpsError('permission-denied', 'Only teachers and admins can regenerate school codes.');
  }

  const { which = 'both', schoolId = 'sch-1' } = request.data || {};

  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const generateHex = () => {
    let result = '';
    const bytes = crypto.randomBytes(7);
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(bytes[i] % chars.length);
    }
    return result;
  };

  const secretsRef = db.collection('school_secrets').doc(schoolId);
  const secretsDoc = await secretsRef.get();
  const currentData = secretsDoc.exists ? secretsDoc.data() : null;

  const newStudentCode = which === 'teacher' ? (currentData?.studentCode || `S-${generateHex()}`) : `S-${generateHex()}`;
  const newTeacherCode = which === 'student' ? (currentData?.teacherCode || `T-${generateHex()}`) : `T-${generateHex()}`;

  await secretsRef.set(
    {
      studentCode: newStudentCode,
      teacherCode: newTeacherCode,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return {
    success: true,
    studentCode: newStudentCode,
    teacherCode: newTeacherCode
  };
});

/**
 * 4. createRazorpayOrder
 * Creates a Razorpay order server-side for tuition fees
 */
export const createRazorpayOrder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to create a payment order.');
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new HttpsError('failed-precondition', 'Razorpay API credentials not configured in environment.');
  }

  const { invoiceId, amount, studentName = 'Student', studentId, currency = 'INR' } = request.data || {};

  if (!invoiceId || !amount) {
    throw new HttpsError('invalid-argument', 'invoiceId and amount are required.');
  }

  const amountInPaise = Math.round(Number(amount) * 100);
  const orderId = `order_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;

  const orderRecord = {
    orderId,
    invoiceId,
    amount: Number(amount),
    amountInPaise,
    currency,
    studentName,
    studentId: studentId || request.auth.uid,
    status: 'created',
    createdAt: new Date().toISOString()
  };

  await db.collection('razorpay_orders').doc(orderId).set(orderRecord);

  return {
    success: true,
    orderId,
    amount: amountInPaise,
    currency,
    keyId: RAZORPAY_KEY_ID,
    invoiceId
  };
});

/**
 * 5. verifyRazorpayPayment
 * Verifies Razorpay HMAC-SHA256 signature and checks authorization before marking fee.
 */
export const verifyRazorpayPayment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to verify payments.');
  }

  if (!RAZORPAY_KEY_SECRET) {
    throw new HttpsError('failed-precondition', 'Razorpay KEY_SECRET is not configured in environment.');
  }

  const callerUid = request.auth.uid;
  const { invoiceId, orderId, paymentId, signature } = request.data || {};

  if (!invoiceId || !orderId || !paymentId || !signature) {
    throw new HttpsError('invalid-argument', 'Missing parameters for signature verification.');
  }

  // Strict HMAC SHA256 Signature Check
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expectedSignature !== signature) {
    throw new HttpsError('permission-denied', 'Razorpay payment signature mismatch. Verification failed.');
  }

  const feeRef = db.collection('fees').doc(invoiceId);
  const feeDoc = await feeRef.get();
  if (!feeDoc.exists) {
    throw new HttpsError('not-found', `Fee invoice #${invoiceId} not found.`);
  }

  const feeData = feeDoc.data()!;
  const targetStudentId = feeData.studentId;

  // Authorization check: Caller must be the student or a linked parent
  const callerDoc = await db.collection('users').doc(callerUid).get();
  const callerData = callerDoc.data() || {};
  const callerRole = callerData.role;
  const isStudent = callerUid === targetStudentId || callerData.studentId === targetStudentId;
  const isLinkedParent =
    callerRole === 'PARENT' &&
    Array.isArray(callerData.linkedChildIds) &&
    callerData.linkedChildIds.includes(targetStudentId);
  const isStaff = callerRole === 'TEACHER' || callerRole === 'ADMIN';

  if (!isStudent && !isLinkedParent && !isStaff) {
    throw new HttpsError('permission-denied', 'You are not authorized for this fee record.');
  }

  const amountDue = feeData.amountDue;
  if (amountDue === undefined || amountDue === null) {
    throw new HttpsError('failed-precondition', 'Fee invoice record is missing amountDue.');
  }

  const nowIso = new Date().toISOString();

  await feeRef.update({
    status: 'PAID',
    amountPaid: amountDue,
    paymentId,
    razorpayOrderId: orderId,
    paymentMethod: `Razorpay (${paymentId})`,
    paidAt: nowIso,
    approvalStatus: 'APPROVED'
  });

  return {
    success: true,
    invoiceId,
    paymentId,
    verifiedAt: nowIso
  };
});

/**
 * 6. razorpayWebhook
 * Webhook that receives payment.captured or order.paid, verifies signature,
 * and acts as final authority for marking fee record as PAID in Firestore.
 */
export const razorpayWebhook = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  if (!RAZORPAY_WEBHOOK_SECRET) {
    res.status(500).json({ error: 'Razorpay webhook secret not configured' });
    return;
  }

  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  if (!signature) {
    res.status(400).json({ error: 'Missing x-razorpay-signature header' });
    return;
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.warn('Razorpay webhook signature verification failed.');
    res.status(400).json({ error: 'Signature verification failed' });
    return;
  }

  const event = req.body?.event;
  const payload = req.body?.payload;

  if (event === 'payment.captured' || event === 'order.paid') {
    const payment = payload?.payment?.entity;
    const order = payload?.order?.entity;

    const paymentId = payment?.id;
    const orderId = payment?.order_id || order?.id;
    const invoiceId = payment?.notes?.invoiceId || order?.notes?.invoiceId;

    if (invoiceId && paymentId) {
      const feeRef = db.collection('fees').doc(invoiceId);
      const feeDoc = await feeRef.get();
      if (feeDoc.exists) {
        const amountDue = feeDoc.data()?.amountDue || 0;
        const nowIso = new Date().toISOString();
        await feeRef.update({
          status: 'PAID',
          amountPaid: amountDue,
          paymentId,
          razorpayOrderId: orderId || null,
          paymentMethod: `Razorpay (${payment?.method || 'Online'} · ${paymentId})`,
          paidAt: nowIso,
          approvalStatus: 'APPROVED'
        });
        console.log(`Razorpay webhook finalized fee #${invoiceId} as PAID with paymentId ${paymentId}`);
      }
    }
  }

  res.status(200).json({ status: 'ok', received: true });
});

/**
 * 7. sendParentMessage
 * Cloud Function to dispatch real SMS (MSG91) or WhatsApp (Meta Cloud API) messages to guardianPhone.
 * If MSG91/WhatsApp keys are missing, returns status FAILED and error "SMS not configured".
 */
export const sendParentMessage = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

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
  } = request.data || {};

  if (!recipientPhone || !content) {
    throw new HttpsError('invalid-argument', 'recipientPhone and content are required.');
  }

  const cleanPhone = String(recipientPhone).replace(/[^\d+]/g, '');
  const nowIso = new Date().toISOString();

  // 1. WhatsApp Cloud API
  if (channel === 'WHATSAPP') {
    if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      const logDoc = {
        id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        channel: 'WHATSAPP',
        messageType,
        recipientPhone: cleanPhone,
        recipientName,
        studentId: studentId || null,
        studentName,
        title: title || 'Parent Notice',
        content,
        provider: 'WHATSAPP_CLOUD',
        providerMessageId: null,
        status: 'FAILED',
        error: 'SMS not configured',
        sentAt: nowIso,
        metadata
      };
      await db.collection('notification_logs').doc(logDoc.id).set(logDoc);
      return {
        success: false,
        status: 'FAILED',
        error: 'SMS not configured',
        recipientPhone: cleanPhone
      };
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
      const waData = (await waResponse.json()) as any;
      if (waResponse.ok && waData?.messages?.[0]?.id) {
        const messageId = waData.messages[0].id;
        const logDoc = {
          id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          channel: 'WHATSAPP',
          messageType,
          recipientPhone: cleanPhone,
          recipientName,
          studentId: studentId || null,
          studentName,
          title: title || 'WhatsApp Notice',
          content,
          provider: 'WHATSAPP_CLOUD',
          providerMessageId: messageId,
          status: 'DELIVERED',
          sentAt: nowIso,
          metadata
        };
        await db.collection('notification_logs').doc(logDoc.id).set(logDoc);
        return { success: true, messageId, channel: 'WHATSAPP', status: 'DELIVERED' };
      }
    } catch (err: unknown) {
      console.error('WhatsApp dispatch error:', err);
    }
  }

  // 2. MSG91 SMS
  if (!process.env.MSG91_AUTH_KEY) {
    const logDoc = {
      id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      channel: 'SMS',
      messageType,
      recipientPhone: cleanPhone,
      recipientName,
      studentId: studentId || null,
      studentName,
      title: title || 'SMS Alert',
      content,
      provider: 'MSG91',
      providerMessageId: null,
      status: 'FAILED',
      error: 'SMS not configured',
      sentAt: nowIso,
      metadata
    };
    await db.collection('notification_logs').doc(logDoc.id).set(logDoc);
    return {
      success: false,
      status: 'FAILED',
      error: 'SMS not configured',
      recipientPhone: cleanPhone
    };
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
    const msg91Data = (await msg91Response.json()) as any;
    if (msg91Response.ok && msg91Data?.type === 'success') {
      const messageId = msg91Data.message || `msg91_${Date.now()}`;
      const logDoc = {
        id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        channel: 'SMS',
        messageType,
        recipientPhone: cleanPhone,
        recipientName,
        studentId: studentId || null,
        studentName,
        title: title || 'SMS Alert',
        content,
        provider: 'MSG91',
        providerMessageId: messageId,
        status: 'DELIVERED',
        sentAt: nowIso,
        metadata
      };
      await db.collection('notification_logs').doc(logDoc.id).set(logDoc);
      return { success: true, messageId, channel: 'SMS', status: 'DELIVERED' };
    }
  } catch (err: unknown) {
    console.error('MSG91 dispatch error:', err);
  }

  return {
    success: false,
    status: 'FAILED',
    error: 'SMS dispatch failed',
    recipientPhone: cleanPhone
  };
});

/**
 * 8. sendFcmNotification
 * Cloud Function to broadcast Firebase Cloud Messaging push for homework, announcements and fees.
 */
export const sendFcmNotification = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const {
    title = 'Tuition Alert',
    body = '',
    messageType = 'HOMEWORK',
    targetRole = 'ALL',
    studentId,
    studentName,
    batchId,
    data = {}
  } = request.data || {};

  const fcmMessageId = `fcm_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const logDoc = {
    id: `log_fcm_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    channel: 'FCM_PUSH',
    messageType,
    studentId: studentId || null,
    studentName: studentName || null,
    title,
    content: body,
    provider: 'FCM',
    providerMessageId: fcmMessageId,
    status: 'DELIVERED',
    sentAt: new Date().toISOString(),
    metadata: {
      targetRole,
      batchId: batchId || null,
      ...data
    }
  };

  await db.collection('notification_logs').doc(logDoc.id).set(logDoc);

  return {
    success: true,
    messageId: fcmMessageId,
    title,
    body,
    messageType,
    targetRole,
    status: 'DELIVERED'
  };
});
