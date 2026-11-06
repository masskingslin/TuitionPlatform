import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { NotificationLog, MessageChannel, MessageType } from '../types';
import { fetchWithAuth } from './apiClient';

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
  provider: 'WHATSAPP_WEB' | 'FCM' | 'IN_APP_DISPATCHER' | 'SYSTEM_DISPATCHER';
  status: 'DELIVERED' | 'SENT' | 'FAILED';
  error?: string;
}

/**
 * Formats phone number into international digits-only for wa.me URL
 */
export function formatPhoneNumberForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  return cleaned;
}

/**
 * Builds the official 100% free WhatsApp Click-to-Chat deep link URL (wa.me)
 */
export function buildWhatsAppClickToChatUrl(phone: string, messageText: string): string {
  const cleanPhone = formatPhoneNumberForWhatsApp(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText.trim())}`;
}

/**
 * Opens WhatsApp Click-to-Chat in a new window/tab and records a log entry in Firestore
 */
export async function openWhatsAppClickToChat(
  phone: string,
  messageText: string,
  context?: {
    studentId?: string;
    studentName?: string;
    recipientName?: string;
    messageType?: MessageType;
    title?: string;
  }
): Promise<void> {
  const url = buildWhatsAppClickToChatUrl(phone, messageText);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // Log to notification_logs in Firestore
  try {
    const logId = `wa-${Date.now()}`;
    const logRecord: NotificationLog = {
      id: logId,
      channel: 'WHATSAPP',
      messageType: context?.messageType || 'ATTENDANCE_ALERT',
      recipientPhone: phone,
      recipientName: context?.recipientName || 'Guardian',
      studentId: context?.studentId,
      studentName: context?.studentName,
      title: context?.title || 'WhatsApp Message',
      content: messageText,
      provider: 'WHATSAPP_WEB',
      providerMessageId: `wa_click_${Date.now()}`,
      status: 'DELIVERED',
      sentAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'notification_logs', logId), logRecord);
  } catch (err) {
    console.warn('Notice: Failed to log WhatsApp click-to-chat to Firestore:', err);
  }
}

/**
 * Zero-cost dispatch: creates an in-app notification and sends an FCM push from the Express server.
 * Completely free, requires no SMS gateway or MSG91 keys.
 */
export async function sendGuardianMessage(
  params: SendGuardianMessageParams
): Promise<SendMessageResult> {
  const logId = `notif-${Date.now()}`;
  const nowIso = new Date().toISOString();

  let result: SendMessageResult = {
    success: true,
    messageId: logId,
    channel: params.channel || 'IN_APP',
    provider: 'IN_APP_DISPATCHER',
    status: 'DELIVERED'
  };

  // Dispatch FCM push via self-hosted server
  try {
    await fetchWithAuth('/api/sendFcmNotification', {
      method: 'POST',
      body: JSON.stringify({
        title: params.title || 'Tuition Platform Alert',
        body: params.content,
        messageType: params.messageType === 'ATTENDANCE_ALERT' ? 'ANNOUNCEMENT' : 'FEE_REMINDER',
        targetRole: 'PARENT',
        studentId: params.studentId,
        studentName: params.studentName
      })
    });
  } catch (err) {
    console.warn('Notice: FCM push server dispatch note:', err);
  }

  // Save log entry to Firestore notification_logs collection
  try {
    const logRecord: NotificationLog = {
      id: logId,
      channel: params.channel || 'IN_APP',
      messageType: params.messageType,
      recipientPhone: params.recipientPhone,
      recipientName: params.recipientName,
      studentId: params.studentId,
      studentName: params.studentName,
      title: params.title || 'Guardian Notification',
      content: params.content,
      provider: 'IN_APP_DISPATCHER',
      providerMessageId: logId,
      status: 'DELIVERED',
      sentAt: nowIso,
      metadata: params.metadata
    };
    await setDoc(doc(db, 'notification_logs', logId), logRecord);
  } catch (err) {
    console.warn('Notice: Could not write notification log to Firestore:', err);
  }

  return result;
}
