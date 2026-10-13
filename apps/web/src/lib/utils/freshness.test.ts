import { afterEach, describe, expect, it, vi } from 'vitest'
import { DATA_TTL_MS } from './constants'
import { isStale } from './freshness'

describe('isStale', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('sin cargar todavia (loadedAt 0) siempre es viejo', () => {
    expect(isStale(0)).toBe(true)
  })

  it('recien cargado no es viejo', () => {
    expect(isStale(Date.now())).toBe(false)
  })

  it('pasado el TTL es viejo', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2027-01-01T12:00:00.000Z'))
    const loadedAt = Date.now() - DATA_TTL_MS - 1
    expect(isStale(loadedAt)).toBe(true)
  })

  it('justo antes del TTL no es viejo', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2027-01-01T12:00:00.000Z'))
    const loadedAt = Date.now() - DATA_TTL_MS + 1
    expect(isStale(loadedAt)).toBe(false)
  })

  it('respeta un ttl custom', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2027-01-01T12:00:00.000Z'))
    expect(isStale(Date.now() - 500, 1000)).toBe(false)
    expect(isStale(Date.now() - 1500, 1000)).toBe(true)
  })
})
