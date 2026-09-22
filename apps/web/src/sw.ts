/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (string | { url: string; revision: string | null })[]
}

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

interface PushPayload {
  title?: string
  body?: string
  url?: string
  tag?: string
}

self.addEventListener('push', (event) => {
  let payload: PushPayload | null = null
  try {
    payload = event.data ? (event.data.json() as PushPayload) : null
  } catch {
    payload = null
  }

  const options: NotificationOptions = {
    body: payload?.body ?? '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    data: { url: payload?.url ?? '/' },
  }
  if (payload?.tag) {
    options.tag = payload.tag
  }

  event.waitUntil(self.registration.showNotification(payload?.title ?? 'Somos Brasil 🇧🇷', options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string } | null)?.url ?? '/'
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of clients) {
        if ('navigate' in client) {
          await client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })(),
  )
})