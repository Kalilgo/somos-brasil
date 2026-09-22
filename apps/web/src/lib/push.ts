import { isDemoMode, repo } from '@/lib/data'

// Pública y pensada para distribuirse; el secreto privado vive solo en Supabase.
const DEFAULT_VAPID_PUBLIC_KEY =
  'BP--VKJc9y7nB-vZvcLzts2m92rrJzJr7Zyqz1yV5h5lAPXRXKNszzdc88VLIZjQf-7MZMdZoZOJcY75AA80HUE'

function vapidPublicKey(): string {
  return (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ?? DEFAULT_VAPID_PUBLIC_KEY
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Url = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Url)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

export function pushSupported(): boolean {
  return (
    !isDemoMode &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    Boolean(navigator.serviceWorker.controller || true)
  )
}

export type PushUiState = 'unsupported' | 'enabled' | 'pending' | 'blocked'

export async function pushState(): Promise<PushUiState> {
  if (!pushSupported()) return 'unsupported'
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (subscription) return 'enabled'
  return Notification.permission === 'denied' ? 'blocked' : 'pending'
}

async function storeSubscription(registration: ServiceWorkerRegistration): Promise<void> {
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return
  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return
  await repo().savePushSubscription({
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  })
}

// Activa notificaciones: pide permiso, se suscribe con el VAPID público y
// guarda el endpoint en el server. Si ya había permiso, solo refresca el registro.
export async function enablePush(): Promise<PushUiState> {
  if (!pushSupported()) return 'unsupported'

  if (Notification.permission === 'default') {
    const granted = await Notification.requestPermission()
    if (granted !== 'granted') return granted === 'denied' ? 'blocked' : 'pending'
  }
  if (Notification.permission !== 'granted') return 'blocked'

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey()),
    })
  }
  await storeSubscription(registration)
  return 'enabled'
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (subscription) {
    await repo().deletePushSubscription(subscription.endpoint)
    await subscription.unsubscribe()
  }
}

// Mantiene el registro actualizado (si el permiso ya estaba concedido sin tocar al usuario).
export async function syncPushSubscription(): Promise<void> {
  if (!pushSupported()) return
  if (Notification.permission !== 'granted') return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return
  await storeSubscription(registration)
}