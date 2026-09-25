const priceFmts = new Map<string, Intl.NumberFormat>()
const dateFmt = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })
const dayMonthYearFmt = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
const monthYearFmt = new Intl.DateTimeFormat('es-AR', { month: 'short', year: 'numeric' })

function parseDay(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "5 → 8 ene 2027", "20 ene → 8 feb 2027", "8 ene 2027". Siempre con año. */
export function formatTripRange(start: string | null | undefined, end: string | null | undefined): string {
  const s = parseDay(start)
  const e = parseDay(end)
  if (!s && !e) return 'Fechas por definir'
  if (s && e) {
    if (s.getTime() === e.getTime()) return dayMonthYearFmt.format(s)
    const sameMonth = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()
    if (sameMonth) return `${s.getDate()} → ${e.getDate()} ${monthYearFmt.format(e)}`
    return `${dateFmt.format(s)} → ${dayMonthYearFmt.format(e)}`
  }
  return dayMonthYearFmt.format((s ?? e) as Date)
}

export function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return dateFmt.format(d)
}

function fmt(currency: string): Intl.NumberFormat {
  let f = priceFmts.get(currency)
  if (!f) {
    f = new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 })
    priceFmts.set(currency, f)
  }
  return f
}

export function formatPrice(price: number | null | undefined, currency?: string | null): string {
  if (price == null || currency == null) return ''
  try {
    return fmt(currency).format(price)
  } catch {
    return `${price} ${currency}`
  }
}

export function priceLabel(price: number | null | undefined, currency?: string | null): string {
  if (price == null) return 'A definir'
  return formatPrice(price, currency)
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'recién'
  const hrs = Math.floor(min / 60)
  if (hrs < 1) return `hace ${min} min`
  const days = Math.floor(hrs / 24)
  if (days < 1) return `hace ${hrs} h`
  const weeks = Math.floor(days / 7)
  if (weeks < 1) return `hace ${days} d`
  return `hace ${weeks} sem`
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return `${n} ${n === 1 ? singular : (plural ?? singular + 's')}`
}

export function memberShare(total: number | null, memberCount: number): number | null {
  if (total == null || memberCount <= 0) return null
  return total / memberCount
}