import { describe, expect, it } from 'vitest'
import { PIEZAS_BASE } from '../datos/piezas.ts'
import { agregarPiezasNuevas, crearDietaInicial, importarDieta } from '../logica/dieta.ts'
import { pieza } from './ayuda.ts'

describe('dieta inicial', () => {
  it('nace de las 96 piezas base, sin historial y con ajustes por defecto', () => {
    const d = crearDietaInicial()
    expect(d.version).toBe(1)
    expect(d.piezas).toHaveLength(96)
    expect(d.historial).toEqual([])
    expect(d.ajustes).toEqual({ tema: 'sistema', claveIA: '' })
  })

  it('las piezas son copias: editar la dieta no toca la tabla base', () => {
    const d = crearDietaInicial()
    d.piezas[0].carbohidratos = 999
    d.piezas[0].momentos.push('colacion')
    expect(PIEZAS_BASE[0].carbohidratos).not.toBe(999)
    expect(PIEZAS_BASE[0].momentos).not.toContain('colacion')
  })
})

describe('agregar piezas nuevas de una versión nueva de la app', () => {
  it('agrega las que faltan por id sin tocar las existentes', () => {
    const d = crearDietaInicial()
    d.piezas[0].carbohidratos = 99
    const sinUna = { ...d, piezas: d.piezas.slice(0, 95) }
    const { dieta, agregadas } = agregarPiezasNuevas(sinUna)
    expect(agregadas).toBe(1)
    expect(dieta.piezas).toHaveLength(96)
    expect(dieta.piezas[0].carbohidratos).toBe(99)
    expect(dieta.piezas[95].id).toBe(PIEZAS_BASE[95].id)
  })

  it('si no falta ninguna, devuelve la misma dieta', () => {
    const d = crearDietaInicial()
    expect(agregarPiezasNuevas(d)).toEqual({ dieta: d, agregadas: 0 })
  })

  it('no resucita una pieza base que el usuario eliminó', () => {
    const d = crearDietaInicial()
    const sinCerveza = { ...d, piezas: d.piezas.filter((p) => p.id !== 'cerveza'), piezasBaseEliminadas: ['cerveza'] }
    const { dieta, agregadas } = agregarPiezasNuevas(sinCerveza)
    expect(agregadas).toBe(0)
    expect(dieta.piezas.some((p) => p.id === 'cerveza')).toBe(false)
    const r = importarDieta(JSON.stringify(sinCerveza))
    expect(r.ok && r.dieta.piezasBaseEliminadas).toEqual(['cerveza'])
    expect(importarDieta({ piezas: [] }).ok && (importarDieta({ piezas: [] }) as { ok: true; dieta: { piezasBaseEliminadas: string[] } }).dieta.piezasBaseEliminadas).toEqual([])
  })

  it('no reemplaza una pieza que el usuario eliminó y después creó con otro id', () => {
    const d = crearDietaInicial()
    const propia = pieza({ tipo: 'extra', carbohidratos: 12, id: 'mi-pieza', validada: false })
    const { dieta } = agregarPiezasNuevas({ ...d, piezas: [...d.piezas, propia] })
    expect(dieta.piezas.find((p) => p.id === 'mi-pieza')).toEqual(propia)
  })
})

describe('importar dieta.json', () => {
  it('acepta un respaldo exportado por la app (ida y vuelta)', () => {
    const d = crearDietaInicial()
    d.historial.push({
      fecha: '2026-10-26T14:10:00',
      momento: 'almuerzo',
      piezas: [{ id: d.piezas[0].id, nombre: d.piezas[0].nombre, carbohidratos: 15 }],
      total: 15,
      origen: 'propuesta',
    })
    d.ajustes = { tema: 'oscuro', claveIA: 'sk-prueba' }
    const r = importarDieta(JSON.stringify(d))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.dieta).toEqual(d)
  })

  it('completa valores faltantes con defaults seguros', () => {
    const r = importarDieta({
      piezas: [{ id: 'x', nombre: 'Algo', tipo: 'extra', carbohidratos: 10, momentos: ['colacion'] }],
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.dieta.piezas[0]).toMatchObject({ validada: false, nota: '', porcion: '', origen: 'importada', mealPrep: false })
      expect(r.dieta.historial).toEqual([])
      expect(r.dieta.ajustes).toEqual({ tema: 'sistema', claveIA: '' })
    }
  })

  it('rechaza texto que no es JSON', () => {
    expect(importarDieta('{esto no es json')).toEqual({ ok: false, error: 'El archivo no es un JSON válido.' })
  })

  it('rechaza un archivo sin piezas', () => {
    expect(importarDieta({ hola: 1 }).ok).toBe(false)
    expect(importarDieta([]).ok).toBe(false)
    expect(importarDieta(null).ok).toBe(false)
  })

  it('rechaza piezas inválidas con un mensaje claro', () => {
    const base = { id: 'x', nombre: 'Algo', tipo: 'extra', carbohidratos: 10, momentos: ['colacion'] }
    expect(importarDieta({ piezas: [{ ...base, id: '' }] })).toEqual({ ok: false, error: 'La pieza 1 no tiene id.' })
    expect(importarDieta({ piezas: [{ ...base, tipo: 'sopa' }] }).ok).toBe(false)
    expect(importarDieta({ piezas: [{ ...base, carbohidratos: 10.5 }] }).ok).toBe(false)
    expect(importarDieta({ piezas: [{ ...base, carbohidratos: -1 }] }).ok).toBe(false)
    expect(importarDieta({ piezas: [{ ...base, momentos: ['brunch'] }] }).ok).toBe(false)
    expect(importarDieta({ piezas: [base, base] })).toEqual({ ok: false, error: 'Hay dos piezas con el id "x".' })
  })

  it('rechaza entradas de historial inválidas', () => {
    const piezas = [{ id: 'x', nombre: 'Algo', tipo: 'extra', carbohidratos: 10, momentos: ['colacion'] }]
    expect(importarDieta({ piezas, historial: [{ fecha: 1 }] }).ok).toBe(false)
    expect(importarDieta({ piezas, historial: [{ fecha: '2026-10-26', momento: 'brunch', piezas: [] }] }).ok).toBe(false)
    expect(importarDieta({ piezas, historial: [{ fecha: '2026-10-26', momento: 'cena', piezas: [{ id: 1 }] }] }).ok).toBe(false)
  })

  it('calcula el total del historial si falta y normaliza el origen', () => {
    const r = importarDieta({
      piezas: [],
      historial: [{ fecha: '2026-10-26', momento: 'cena', piezas: [{ id: 'a', nombre: 'A', carbohidratos: 20 }, { id: 'b', nombre: 'B', carbohidratos: 25 }] }],
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.dieta.historial[0]).toMatchObject({ total: 45, origen: 'propuesta' })
  })
})
