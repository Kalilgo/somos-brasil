import { afterEach, describe, expect, it, vi } from 'vitest'
import { FIXED_NOW } from '@/test/fixtures'
import {
  formatPrice,
  formatShortDate,
  formatTripRange,
  memberShare,
  pluralize,
  priceLabel,
  timeAgo,
} from './format'

describe('formatTripRange', () => {
  it('avisa cuando no hay fechas', () => {
    expect(formatTripRange(null, null)).toBe('Fechas por definir')
  })

  it('formatea un rango dentro del mismo mes', () => {
    const out = formatTripRange('2026-12-26', '2026-12-28')
    expect(out).toBe('26 → 28 dic 2026')
  })

  it('formatea un rango que cruza de mes', () => {
    const out = formatTripRange('2026-12-26', '2027-01-04')
    expect(out).toContain('26 dic')
    expect(out).toContain('4')
    expect(out).toContain('ene')
    expect(out).toContain('2027')
    expect(out).toContain('→')
  })

  it('cuando start y end son el mismo dia, muestra uno solo', () => {
    const out = formatTripRange('2026-12-26', '2026-12-26')
    expect(out).toContain('26')
    expect(out).toContain('dic')
    expect(out).toContain('2026')
    expect(out).not.toContain('→')
  })

  it('con una sola fecha, la muestra igual', () => {
    expect(formatTripRange('2026-12-26', null)).toMatch(/26.*dic.*2026/)
    expect(formatTripRange(null, '2027-01-04')).toMatch(/4.*ene.*2027/)
  })
})

describe('formatShortDate', () => {
  it('formatea una fecha ISO a dia y mes', () => {
    expect(formatShortDate('2026-12-26')).toBe('26 dic')
  })

  it('devuelve el string original si la fecha es invalida', () => {
    expect(formatShortDate('no-es-fecha')).toBe('no-es-fecha')
  })
})

describe('formatPrice / priceLabel', () => {
  it('formatea un precio con su moneda', () => {
    expect(formatPrice(100, 'USD')).toMatch(/100/)
  })

  it('sin precio o sin moneda devuelve vacio', () => {
    expect(formatPrice(null, 'USD')).toBe('')
    expect(formatPrice(100, null)).toBe('')
    expect(formatPrice(undefined, undefined)).toBe('')
  })

  it('priceLabel distingue "A definir" de un precio real', () => {
    expect(priceLabel(null, 'USD')).toBe('A definir')
    expect(priceLabel(100, 'USD')).toMatch(/100/)
  })
})

describe('timeAgo', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('describe los distintos tramos', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(FIXED_NOW))
    const now = Date.now()
    const at = (msAgo: number) => new Date(now - msAgo).toISOString()

    expect(timeAgo(at(30_000))).toBe('recién')
    expect(timeAgo(at(5 * 60_000))).toBe('hace 5 min')
    expect(timeAgo(at(3 * 3_600_000))).toBe('hace 3 h')
    expect(timeAgo(at(2 * 86_400_000))).toBe('hace 2 d')
    expect(timeAgo(at(14 * 86_400_000))).toBe('hace 2 sem')
  })
})

describe('pluralize', () => {
  it('singular con 1 y plural con el resto', () => {
    expect(pluralize(1, 'idea')).toBe('1 idea')
    expect(pluralize(0, 'idea')).toBe('0 ideas')
    expect(pluralize(3, 'idea')).toBe('3 ideas')
  })

  it('acepta un plural irregular', () => {
    expect(pluralize(2, 'día', 'días')).toBe('2 días')
  })
})

describe('memberShare', () => {
  it('divide el total entre los miembros', () => {
    expect(memberShare(100, 4)).toBe(25)
  })

  it('devuelve null si no hay total o no hay miembros', () => {
    expect(memberShare(null, 4)).toBeNull()
    expect(memberShare(100, 0)).toBeNull()
    expect(memberShare(100, -1)).toBeNull()
  })
})
