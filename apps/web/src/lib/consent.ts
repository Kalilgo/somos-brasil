import { STORAGE_KEYS } from '@/lib/utils/constants'

export interface ConsentRecord {
  version: 1
  acceptedAt: string
  choice: 'accepted' | 'dismissed'
}

const CONSENT_VERSION = 1 as const

export function hasConsent(): boolean {
  if (typeof localStorage === 'undefined') return false
  const raw = localStorage.getItem(STORAGE_KEYS.consent)
  if (!raw) return false
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>
    return parsed.version === CONSENT_VERSION && parsed.choice === 'accepted'
  } catch {
    return false
  }
}

export function acceptConsent(): void {
  if (typeof localStorage === 'undefined') return
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
    choice: 'accepted',
  }
  localStorage.setItem(STORAGE_KEYS.consent, JSON.stringify(record))
}