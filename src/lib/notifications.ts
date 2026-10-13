// Browser Notification Utilities for Consistency Dashboard

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isNotificationSupported()) return "unsupported";
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("Failed to request notification permission:", error);
    return Notification.permission;
  }
}

// Convert VAPID base64 key to Uint8Array for pushManager
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Subscribe browser to backend Web Push via Service Worker
export async function subscribeUserToPush(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BBQhKR3zhZ9wuyf4nM5ewH4QofmXrCkhHQ5f-7ke7_TTOL7TtS4QCm20aCyGllt6c588GXqBdkyj1PpkKWCI3No";

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
      });
    }

    const subJson = subscription.toJSON();

    if (!subJson.endpoint || !subJson.keys) return false;

    // Avoid redundant network & database calls if this subscription was already synced in this session
    const sessionKey = `push_synced_${subJson.endpoint}`;
    if (sessionStorage.getItem(sessionKey)) {
      return true;
    }

    // Persist subscription in PostgreSQL backend
    const res = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      }),
    });

    if (res.ok) {
      sessionStorage.setItem(sessionKey, "true");
    }

    return res.ok;
  } catch (error) {
    console.error("Failed to register push subscription:", error);
    return false;
  }
}

// Unsubscribe browser from push notifications
export async function unsubscribeUserFromPush(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      sessionStorage.removeItem(`push_synced_${subscription.endpoint}`);
      await fetch(`/api/notifications/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
        method: "DELETE",
      }).catch(() => {});
      await subscription.unsubscribe();
    }

    return true;
  } catch (error) {
    console.error("Failed to unsubscribe push:", error);
    return false;
  }
}

// Gentle pleasant chime via Web Audio API
export function playNotificationSound(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.55);
  } catch {
    // Gracefully ignore audio errors (e.g. autoplay limitations)
  }
}

export interface NativeNotificationOptions extends NotificationOptions {
  playSound?: boolean;
}

export async function sendNativeNotification(
  title: string,
  options?: NativeNotificationOptions
): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;

  try {
    if (options?.playSound !== false) {
      playNotificationSound();
    }

    // Try Service Worker registration first for background reliability
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            ...options,
          });
          return true;
        }
      } catch {
        // Fallback to standard Notification
      }
    }

    // Standard HTML5 Notification API fallback
    const notif = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });

    notif.onclick = () => {
      window.focus();
      try {
        notif.close();
      } catch {}
    };

    return true;
  } catch (err) {
    console.error("Error creating browser notification:", err);
    return false;
  }
}
