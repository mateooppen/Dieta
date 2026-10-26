import { describe, expect, it } from 'vitest'
import { MOMENTOS, PIEZAS_BASE } from '../datos/piezas.ts'
import {
  armarConsulta,
  fechaCortaNota,
  interpretarRespuesta,
  piezaDesdeEstimacion,
  piezasParecidas,
  piezaTemporal,
  tipoParaMomento,
  type Estimacion,
} from '../logica/estimacion.ts'

const almuerzo = MOMENTOS.find((m) => m.id === 'almuerzo')!

const estimacion: Estimacion = {
  carbohidratos: 40,
  rangoMin: 34,
  rangoMax: 48,
  altaFibra: false,
  altaGrasa: true,
  porcion: '2 porciones',
  explicacion: 'Casi todo viene de la masa.',
  nombreSugerido: 'Tarta de jamón y queso',
}

describe('piezasParecidas', () => {
  it('encuentra piezas por palabras en común, sin importar acentos ni plurales', () => {
    const conArroz = PIEZAS_BASE.filter((p) => p.nombre.toLowerCase().includes('arroz'))
    expect(conArroz.length).toBeGreaterThan(0)
    const r = piezasParecidas(PIEZAS_BASE, 'un plato de ARROZ con pollo')
    expect(r.length).toBeGreaterThan(0)
    expect(r.length).toBeLessThanOrEqual(8)
    expect(r.some((p) => p.nombre.toLowerCase().includes('arroz'))).toBe(true)
  })
  it('sin palabras útiles no devuelve nada', () => {
    expect(piezasParecidas(PIEZAS_BASE, 'un con de')).toEqual([])
  })
})

describe('armarConsulta', () => {
  it('incluye descripción, momento, rango y referencias', () => {
    const ref = PIEZAS_BASE.slice(0, 2)
    const c = armarConsulta('  2 porciones de tarta  ', almuerzo, ref)
    expect(c).toContain('Comida: 2 porciones de tarta')
    expect(c).toContain(`${almuerzo.carbMin}–${almuerzo.carbMax} g`)
    expect(c).toContain(`${ref[0].nombre}`)
    expect(c).toContain(`${ref[0].carbohidratos} g`)
  })
  it('avisa cuando no hay referencias', () => {
    expect(armarConsulta('algo', almuerzo, [])).toContain('No hay piezas parecidas')
  })
})

describe('interpretarRespuesta', () => {
  it('lee el JSON aunque venga con texto o bloque de código alrededor', () => {
    const r = interpretarRespuesta('Acá va:\n```json\n' + JSON.stringify(estimacion) + '\n```')
    expect(r).toEqual({ ok: true, estimacion })
  })
  it('redondea, ordena el rango y lo estira para incluir el número', () => {
    const r = interpretarRespuesta(JSON.stringify({ ...estimacion, carbohidratos: 40.6, rangoMin: 50, rangoMax: 45 }))
    expect(r.ok && r.estimacion).toMatchObject({ carbohidratos: 41, rangoMin: 41, rangoMax: 50 })
  })
  it('sin rango usa el mismo número', () => {
    const r = interpretarRespuesta('{"carbohidratos": 20}')
    expect(r.ok && r.estimacion).toMatchObject({ carbohidratos: 20, rangoMin: 20, rangoMax: 20, altaGrasa: false, porcion: '' })
  })
  it('falla si no es JSON o no trae carbohidratos', () => {
    expect(interpretarRespuesta('no sé').ok).toBe(false)
    expect(interpretarRespuesta('{ roto').ok).toBe(false)
    expect(interpretarRespuesta('{"carbohidratos": "mucho"}').ok).toBe(false)
  })
})

describe('pieza nueva desde la estimación', () => {
  const ahora = new Date(2026, 9, 26, 13, 5)

  it('nace sin validar, con la nota de la fecha y el número corregido', () => {
    const p = piezaDesdeEstimacion(estimacion, 44, 'tarta', 'almuerzo', PIEZAS_BASE, ahora, '2026-10-26T13:05')
    expect(p).toMatchObject({
      nombre: 'Tarta de jamón y queso',
      porcion: '2 porciones',
      carbohidratos: 44,
      tipo: 'principal',
      traeCarbohidratos: true,
      momentos: ['almuerzo'],
      altaGrasa: true,
      validada: false,
      origen: 'ia',
      nota: 'Estimada con IA el 26/10/2026',
      creadaEl: '2026-10-26T13:05',
    })
    expect(PIEZAS_BASE.some((b) => b.id === p.id)).toBe(false)
  })
  it('sin nombre sugerido usa la descripción', () => {
    const p = piezaDesdeEstimacion({ ...estimacion, nombreSugerido: '' }, 40, 'Empanada de humita', 'cena', [], ahora, 'x')
    expect(p.nombre).toBe('Empanada de humita')
  })
  it('el tipo depende del momento', () => {
    expect(tipoParaMomento('cena')).toBe('principal')
    expect(tipoParaMomento('merienda')).toBe('desayuno_merienda')
    expect(tipoParaMomento('colacion')).toBe('extra')
  })
  it('la pieza temporal no queda validada ni con nota', () => {
    const t = piezaTemporal(estimacion, 38, 'tarta', 'almuerzo', 'id1')
    expect(t).toMatchObject({ id: 'temporal-id1', carbohidratos: 38, validada: false, nota: '' })
  })
  it('fecha de la nota en formato día/mes/año', () => {
    expect(fechaCortaNota(new Date(2026, 0, 5))).toBe('05/01/2026')
  })
})
