const priceFmts = new Map<string, Intl.NumberFormat>()
const dateFmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' })

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