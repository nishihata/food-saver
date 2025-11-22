/**
 * Service Workerを登録し、プッシュ通知のサブスクリプションを管理
 */

/**
 * Service Workerを登録
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker is not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

/**
 * プッシュ通知の許可をリクエスト
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('Notifications are not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * プッシュサブスクリプションを作成
 */
export const subscribeToPush = async (): Promise<PushSubscription | null> => {
  try {
    const registration = await navigator.serviceWorker.ready;

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error('VAPID public key is not set');
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    console.log('Push subscription created:', subscription);
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
};

/**
 * サブスクリプションをサーバーに保存
 */
export const saveSubscription = async (subscription: PushSubscription, userId: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscription, userId }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to save subscription:', error);
    return false;
  }
};

/**
 * プッシュ通知のセットアップ（全体の流れ）
 */
export const setupPushNotifications = async (): Promise<boolean> => {
  try {
    // Supabaseクライアントをインポート
    const { supabase } = await import('@/lib/supabase');

    // ユーザーIDを取得
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error('No user session');
      return false;
    }
    const userId = session.user.id;

    // 1. Service Workerを登録
    const registration = await registerServiceWorker();
    if (!registration) return false;

    // 2. 通知許可をリクエスト
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    // 3. プッシュサブスクリプションを作成
    const subscription = await subscribeToPush();
    if (!subscription) return false;

    // 4. サブスクリプションをサーバーに保存
    const saved = await saveSubscription(subscription, userId);
    if (!saved) {
      console.error('Failed to save subscription to server');
      return false;
    }

    console.log('Push notifications setup complete');
    return true;
  } catch (error) {
    console.error('Failed to setup push notifications:', error);
    return false;
  }
};

/**
 * Base64文字列をUint8Arrayに変換（VAPID公開鍵用）
 */
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as BufferSource;
}
