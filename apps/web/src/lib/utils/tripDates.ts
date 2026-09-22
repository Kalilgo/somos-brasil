import type { Trip } from '@/types/db'
import type { MemberPlan } from '@/lib/data/types'

const DAY_MS = 86_400_000

export function parseDate(d: string): Date {
  return new Date(`${d}T00:00:00`)
}

export function tripDayRange(trip: Trip): { start: Date | null; end: Date | null; totalDays: number } {
  if (!trip.start_date || !trip.end_date) return { start: null, end: null, totalDays: 0 }
  const start = parseDate(trip.start_date)
  const end = parseDate(trip.end_date)
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1)
  return { start, end, totalDays }
}

export function memberPresentDays(member: MemberPlan, trip: Trip): number | null {
  if (!member.arrival_date || !member.departure_date) return null
  const { start, end, totalDays } = tripDayRange(trip)
  if (!start || !end || totalDays === 0) return null
  const a = Math.max(start.getTime(), parseDate(member.arrival_date).getTime())
  const b = Math.min(end.getTime(), parseDate(member.departure_date).getTime())
  if (a > b) return 0
  return Math.round((b - a) / DAY_MS) + 1
}

export function memberPresentDayNumbers(member: MemberPlan, trip: Trip): number[] {
  const { start, totalDays } = tripDayRange(trip)
  if (!start || totalDays === 0 || !member.arrival_date || !member.departure_date) return []
  const arr = parseDate(member.arrival_date).getTime()
  const dep = parseDate(member.departure_date).getTime()
  const days: number[] = []
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(start)
    if (i > 1) d.setDate(d.getDate() + (i - 1))
    if (d.getTime() >= arr && d.getTime() <= dep) days.push(i)
  }
  return days
}

export function dayDate(trip: Trip, dayNumber: number): Date | null {
  if (!trip.start_date) return null
  const d = parseDate(trip.start_date)
  if (dayNumber > 1) d.setDate(d.getDate() + (dayNumber - 1))
  return d
}

export function dayLabel(trip: Trip, dayNumber: number): string {
  if (!trip.start_date) return `Día ${dayNumber}`
  const d = dayDate(trip, dayNumber)!
  return `Día ${dayNumber} · ${d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`
}

export function formatMemberRange(arrival: string | null, departure: string | null): string {
  if (!arrival || !departure) return ''
  const fmt = (d: string) =>
    parseDate(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  return `${fmt(arrival)} → ${fmt(departure)}`
}