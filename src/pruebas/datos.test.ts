import { describe, expect, it } from 'vitest'
import { MOMENTOS, PIEZAS_BASE, TIPOS, momentoPorId } from '../datos/piezas.ts'

describe('carga de piezas.json', () => {
  it('trae las 96 piezas con validada: true y fecha de creación', () => {
    expect(PIEZAS_BASE).toHaveLength(96)
    for (const p of PIEZAS_BASE) {
      expect(p.validada).toBe(true)
      expect(p.creadaEl).toBe('2026-10-25')
      expect(typeof p.nota).toBe('string')
    }
  })

  it('tiene ids únicos', () => {
    expect(new Set(PIEZAS_BASE.map((p) => p.id)).size).toBe(96)
  })

  it('trae los 5 momentos con su rango y los 6 tipos', () => {
    expect(MOMENTOS.map((m) => m.id)).toEqual(['desayuno', 'almuerzo', 'merienda', 'cena', 'colacion'])
    expect(momentoPorId('almuerzo')).toMatchObject({ carbMin: 50, carbMax: 60 })
    expect(TIPOS).toHaveLength(6)
  })

  it('falla con un momento desconocido', () => {
    expect(() => momentoPorId('brunch' as never)).toThrow()
  })
})
