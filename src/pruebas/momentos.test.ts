import { describe, expect, it } from 'vitest'
import { momentoPorHora } from '../logica/momentos.ts'

const hora = (h: number, m = 0) => new Date(2026, 9, 26, h, m)

describe('momento preseleccionado por hora', () => {
  it('desayuno antes de las 11', () => {
    expect(momentoPorHora(hora(0))).toBe('desayuno')
    expect(momentoPorHora(hora(10, 59))).toBe('desayuno')
  })

  it('almuerzo de 11 a 16:29', () => {
    expect(momentoPorHora(hora(11))).toBe('almuerzo')
    expect(momentoPorHora(hora(16, 29))).toBe('almuerzo')
  })

  it('merienda de 16:30 a 19:59', () => {
    expect(momentoPorHora(hora(16, 30))).toBe('merienda')
    expect(momentoPorHora(hora(19, 59))).toBe('merienda')
  })

  it('cena desde las 20', () => {
    expect(momentoPorHora(hora(20))).toBe('cena')
    expect(momentoPorHora(hora(23, 59))).toBe('cena')
  })
})
