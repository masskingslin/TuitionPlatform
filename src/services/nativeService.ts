import { App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { isNative } from '../platform';

/**
 * Initializes native Android app event listeners (e.g. hardware back button).
 * Navigates back in browser history if possible, or exits app on home screen.
 */
export function initNativeAppListeners(): void {
  if (!isNative()) return;

  try {
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack && window.history.length > 1) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch (err) {
    console.warn('Could not register native backButton listener:', err);
  }
}

/**
 * Requests native push notification permissions (Android 13+ POST_NOTIFICATIONS),
 * registers the device for FCM, and saves the token to the user profile in Firestore.
 */
export async function setupNativePushNotifications(userId?: string): Promise<string | null> {
  if (!isNative()) return null;

  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('Native push notification permission was not granted.');
      return null;
    }

    await PushNotifications.register();

    return new Promise<string | null>((resolve) => {
      PushNotifications.addListener('registration', async (token) => {
        if (token?.value) {
          sessionStorage.setItem('tuition_fcm_token', token.value);
          if (userId) {
            try {
              await updateDoc(doc(db, 'user_profiles', userId), {
                fcmTokens: arrayUnion(token.value),
                fcmToken: token.value,
                updatedAt: new Date().toISOString()
              });
            } catch (err) {
              console.warn('Could not save native FCM token to profile:', err);
            }
          }
        }
        resolve(token?.value || null);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.warn('Native Push Registration Error:', error);
        resolve(null);
      });
    });
  } catch (err) {
    console.warn('Failed to setup native push notifications:', err);
    return null;
  }
}
