import { describe, expect, it } from 'vitest'
import { asUuid, clampParam, isUuid } from './validate'

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000'

describe('isUuid', () => {
  it('acepta un UUID valido', () => {
    expect(isUuid(VALID_UUID)).toBe(true)
  })

  it('acepta mayusculas (case-insensitive)', () => {
    expect(isUuid(VALID_UUID.toUpperCase())).toBe(true)
  })

  it('rechaza cualquier cosa que no sea un UUID string', () => {
    for (const value of ['', 'abc', '123', null, undefined, 42, {}, 't_brasil']) {
      expect(isUuid(value)).toBe(false)
    }
  })
})

describe('asUuid', () => {
  it('devuelve el id si es UUID', () => {
    expect(asUuid(VALID_UUID)).toBe(VALID_UUID)
  })

  it('devuelve null si no lo es', () => {
    expect(asUuid('no-es-uuid')).toBeNull()
    expect(asUuid(undefined)).toBeNull()
  })
})

describe('clampParam', () => {
  it('recorta espacios y devuelve el valor', () => {
    expect(clampParam('  ideas  ', 20, 'fallback')).toBe('ideas')
  })

  it('cae al fallback si viene vacio, null o undefined', () => {
    expect(clampParam('', 20, 'fallback')).toBe('fallback')
    expect(clampParam('   ', 20, 'fallback')).toBe('fallback')
    expect(clampParam(null, 20, 'fallback')).toBe('fallback')
    expect(clampParam(undefined as unknown as string | null, 20, 'fallback')).toBe('fallback')
  })

  it('cae al fallback si supera el maximo', () => {
    expect(clampParam('123456', 5, 'fallback')).toBe('fallback')
    expect(clampParam('12345', 5, 'fallback')).toBe('12345')
  })
})
