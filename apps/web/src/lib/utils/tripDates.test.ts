import { describe, expect, it } from 'vitest'
import { makeMemberPlan, makeTrip, TRIP_END, TRIP_START } from '@/test/fixtures'
import {
  dayDate,
  dayLabel,
  formatMemberRange,
  memberPresentDayNumbers,
  memberPresentDays,
  parseDate,
  tripDayRange,
} from './tripDates'

describe('tripDayRange', () => {
  it('sin fechas devuelve todo null y 0 dias', () => {
    const { start, end, totalDays } = tripDayRange(makeTrip({ start_date: null, end_date: null }))
    expect(start).toBeNull()
    expect(end).toBeNull()
    expect(totalDays).toBe(0)
  })

  it('cuenta los dias inclusive', () => {
    const { totalDays } = tripDayRange(makeTrip())
    expect(totalDays).toBe(10)
  })

  it('un viaje de un solo dia cuenta como 1', () => {
    const { totalDays } = tripDayRange(makeTrip({ start_date: TRIP_START, end_date: TRIP_START }))
    expect(totalDays).toBe(1)
  })
})

describe('memberPresentDays', () => {
  const trip = makeTrip()

  it('devuelve null si al miembro le faltan fechas', () => {
    expect(memberPresentDays(makeMemberPlan(), trip)).toBeNull()
    expect(memberPresentDays(makeMemberPlan({ arrival_date: TRIP_START }), trip)).toBeNull()
    expect(memberPresentDays(makeMemberPlan({ departure_date: TRIP_END }), trip)).toBeNull()
  })

  it('cuenta los dias presentes completos', () => {
    const days = memberPresentDays(
      makeMemberPlan({ arrival_date: TRIP_START, departure_date: TRIP_END }),
      trip,
    )
    expect(days).toBe(10)
  })

  it('recorta a las fechas del viaje', () => {
    const days = memberPresentDays(
      makeMemberPlan({ arrival_date: '2026-12-20', departure_date: '2027-01-10' }),
      trip,
    )
    expect(days).toBe(10)
  })

  it('devuelve 0 si el miembro no se cruza con el viaje', () => {
    const antes = memberPresentDays(
      makeMemberPlan({ arrival_date: '2026-12-01', departure_date: '2026-12-20' }),
      trip,
    )
    const despues = memberPresentDays(
      makeMemberPlan({ arrival_date: '2027-02-01', departure_date: '2027-02-05' }),
      trip,
    )
    expect(antes).toBe(0)
    expect(despues).toBe(0)
  })
})

describe('memberPresentDayNumbers', () => {
  it('lista los numeros de dia en los que esta presente', () => {
    const trip = makeTrip()
    const beto = makeMemberPlan({ arrival_date: '2026-12-28', departure_date: TRIP_END })
    expect(memberPresentDayNumbers(beto, trip)).toEqual([3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('devuelve vacio si faltan fechas o el viaje', () => {
    expect(memberPresentDayNumbers(makeMemberPlan(), makeTrip())).toEqual([])
    expect(
      memberPresentDayNumbers(
        makeMemberPlan({ arrival_date: TRIP_START, departure_date: TRIP_END }),
        makeTrip({ start_date: null, end_date: null }),
      ),
    ).toEqual([])
  })
})

describe('dayDate / dayLabel', () => {
  const trip = makeTrip()

  it('el dia 1 es el inicio del viaje', () => {
    expect(dayDate(trip, 1)?.getTime()).toBe(parseDate(TRIP_START).getTime())
  })

  it('los dias siguientes avanzan de a uno', () => {
    expect(dayDate(trip, 3)?.getTime()).toBe(parseDate('2026-12-28').getTime())
  })

  it('sin fecha de inicio, dayDate es null', () => {
    expect(dayDate(makeTrip({ start_date: null }), 1)).toBeNull()
  })

  it('dayLabel cae a "Día N" sin fecha', () => {
    expect(dayLabel(makeTrip({ start_date: null }), 2)).toBe('Día 2')
  })

  it('dayLabel incluye el numero y la fecha', () => {
    const label = dayLabel(trip, 1)
    expect(label).toContain('Día 1')
    expect(label).toContain('dic')
  })
})

describe('formatMemberRange', () => {
  it('vacío si faltan fechas', () => {
    expect(formatMemberRange(null, null)).toBe('')
    expect(formatMemberRange('2026-12-28', null)).toBe('')
  })

  it('formatea el rango con flecha', () => {
    expect(formatMemberRange('2026-12-28', '2027-01-04')).toBe('28 dic → 4 ene')
  })
})
