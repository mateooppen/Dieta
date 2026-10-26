import { describe, expect, it } from 'vitest'
import datos from '../datos/piezas.json'

// Prueba mínima de la fase 1: confirma que Vitest corre y que la tabla inicial viaja con la app.
describe('tabla inicial de piezas', () => {
  it('trae las 96 piezas y los 5 momentos del día', () => {
    expect(datos.piezas).toHaveLength(96)
    expect(datos.momentos.map((m) => m.id)).toEqual(['desayuno', 'almuerzo', 'merienda', 'cena', 'colacion'])
  })
})
