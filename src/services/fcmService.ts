import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { app, db } from '../firebase';
import { NotificationLog } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

export interface FcmPushParams {
  title: string;
  body: string;
  messageType: 'HOMEWORK' | 'ANNOUNCEMENT' | 'FEE_REMINDER';
  targetRole?: 'STUDENT' | 'PARENT' | 'ALL';
  studentId?: string;
  studentName?: string;
  batchId?: string;
  batchTitle?: string;
  data?: Record<string, string>;
}

export interface FcmPushResult {
  success: boolean;
  messageId: string;
  status: 'DELIVERED' | 'SENT' | 'FAILED';
  error?: string;
}

/**
 * Initializes FCM messaging instance safely across browsers
 */
export async function getFcmMessagingInstance() {
  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return null;
  }
  try {
    return getMessaging(app);
  } catch (err) {
    console.warn('FCM getMessaging not initialized:', err);
    return null;
  }
}

/**
 * Requests browser push permission and retrieves FCM registration token.
 * Returns null if messaging is unavailable or permission denied.
 */
export async function requestFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    const messaging = await getFcmMessagingInstance();
    if (!messaging) {
      return null;
    }

    let registration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => undefined);
    }

    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: (firebaseConfig as any).vapidKey || undefined
    }).catch(() => null);

    if (token) {
      sessionStorage.setItem('tuition_fcm_token', token);
    }
    return token;
  } catch (err) {
    console.warn('Failed to retrieve FCM push token:', err);
    return null;
  }
}

/**
 * Listens for incoming FCM foreground push messages
 */
export async function listenToForegroundFcmMessages(
  onNotificationReceived: (payload: { title: string; body: string; data?: any }) => void
) {
  const messaging = await getFcmMessagingInstance();
  if (!messaging) return () => {};

  try {
    return onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || 'Tuition Platform';
      const body = payload.notification?.body || payload.data?.body || 'New alert received.';
      onNotificationReceived({ title, body, data: payload.data });
    });
  } catch (err) {
    console.warn('Could not attach FCM foreground message listener:', err);
    return () => {};
  }
}

/**
 * Dispatches an FCM push notification for homework, announcements, or fees
 */
export async function dispatchFcmPush(params: FcmPushParams): Promise<FcmPushResult> {
  const logId = `fcm-${Date.now()}`;
  const nowIso = new Date().toISOString();
  let result: FcmPushResult = {
    success: false,
    messageId: '',
    status: 'FAILED',
    error: 'FCM push not dispatched'
  };

  try {
    const response = await fetch('/api/sendFcmNotification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const data = await response.json();
      const payload = data.data || data;
      result = {
        success: payload.success ?? true,
        messageId: payload.messageId || `fcm_${Date.now()}`,
        status: payload.status || 'DELIVERED',
        error: payload.error
      };
    }
  } catch (networkErr) {
    console.warn('Call to /api/sendFcmNotification failed:', networkErr);
  }

  // Save FCM dispatch log in Firestore notification_logs collection
  try {
    const logDoc: NotificationLog = {
      id: logId,
      channel: 'FCM_PUSH',
      messageType: params.messageType,
      studentId: params.studentId,
      studentName: params.studentName,
      title: params.title,
      content: params.body,
      provider: 'FCM',
      providerMessageId: result.messageId || 'N/A',
      status: result.status,
      sentAt: nowIso,
      metadata: {
        targetRole: params.targetRole || 'ALL',
        batchId: params.batchId,
        batchTitle: params.batchTitle,
        ...(params.data || {})
      }
    };

    await setDoc(doc(db, 'notification_logs', logId), logDoc);
  } catch (firestoreErr) {
    console.error('Failed to log FCM push to Firestore:', firestoreErr);
  }

  return result;
}
