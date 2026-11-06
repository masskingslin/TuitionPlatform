import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { NotificationLog, MessageChannel, MessageType } from '../types';

export interface SendGuardianMessageParams {
  recipientPhone: string;
  recipientName: string;
  studentId?: string;
  studentName: string;
  messageType: MessageType;
  channel?: MessageChannel;
  content: string;
  title?: string;
  metadata?: Record<string, any>;
}

export interface SendMessageResult {
  success: boolean;
  messageId: string;
  channel: MessageChannel;
  provider: 'MSG91' | 'WHATSAPP_CLOUD' | 'SYSTEM_DISPATCHER';
  status: 'DELIVERED' | 'SENT' | 'FAILED';
  error?: string;
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  return `+${cleaned}`;
}

/**
 * Sends real SMS or WhatsApp message via Cloud Function / backend API.
 * If MSG91/WhatsApp keys are missing, logs status FAILED and returns error "SMS not configured".
 */
export async function sendGuardianMessage(
  params: SendGuardianMessageParams
): Promise<SendMessageResult> {
  const normalizedPhone = formatPhoneNumber(params.recipientPhone);
  const preferredChannel = params.channel || 'SMS';
  const logId = `msg-${Date.now()}`;
  const nowIso = new Date().toISOString();

  let result: SendMessageResult = {
    success: false,
    messageId: '',
    channel: preferredChannel,
    provider: preferredChannel === 'WHATSAPP' ? 'WHATSAPP_CLOUD' : 'MSG91',
    status: 'FAILED',
    error: 'SMS not configured'
  };

  try {
    const response = await fetch('/api/sendParentMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipientPhone: normalizedPhone,
        recipientName: params.recipientName,
        studentId: params.studentId || null,
        studentName: params.studentName,
        messageType: params.messageType,
        channel: preferredChannel,
        content: params.content,
        title: params.title,
        metadata: params.metadata
      })
    });

    if (response.ok) {
      const data = await response.json();
      const payload = data.data || data;
      result = {
        success: payload.success ?? false,
        messageId: payload.messageId || '',
        channel: payload.channel || preferredChannel,
        provider: payload.provider || result.provider,
        status: payload.status || (payload.success ? 'DELIVERED' : 'FAILED'),
        error: payload.error || (payload.success ? undefined : 'SMS not configured')
      };
    } else {
      const errData = await response.json().catch(() => ({}));
      result.error = errData.error || errData.data?.error || 'SMS not configured';
    }
  } catch (err: unknown) {
    console.warn('Network call to /api/sendParentMessage failed:', err);
    result.error = 'SMS not configured';
  }

  // Save persistent log in Firestore
  try {
    const logDoc: NotificationLog = {
      id: logId,
      channel: result.channel,
      messageType: params.messageType,
      recipientPhone: normalizedPhone,
      recipientName: params.recipientName,
      studentId: params.studentId || 's1',
      studentName: params.studentName,
      title: params.title || (params.messageType === 'ATTENDANCE_ALERT' ? 'Attendance Notification' : 'Tuition Fee Notice'),
      content: params.content,
      provider: result.provider,
      providerMessageId: result.messageId || 'N/A',
      status: result.status,
      sentAt: nowIso,
      metadata: {
        ...(params.metadata || {}),
        error: result.error
      }
    };

    await setDoc(doc(db, 'notification_logs', logId), logDoc);
  } catch (firestoreErr) {
    console.error('Failed to log message send to Firestore:', firestoreErr);
  }

  return result;
}
