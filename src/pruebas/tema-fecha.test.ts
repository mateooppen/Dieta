import { describe, expect, it } from 'vitest'
import { fechaISOLocal, fechaLarga } from '../logica/fecha.ts'
import { entradaDesdePlato } from '../logica/historial.ts'
import { conPieza, platoVacio } from '../logica/lugares.ts'
import { aplicarTema, temaAlternado, temaEfectivo } from '../logica/tema.ts'
import { pieza } from './ayuda.ts'

describe('tema', () => {
  it('efectivo: sistema sigue al teléfono, claro y oscuro mandan', () => {
    expect(temaEfectivo('sistema', true)).toBe('oscuro')
    expect(temaEfectivo('sistema', false)).toBe('claro')
    expect(temaEfectivo('claro', true)).toBe('claro')
    expect(temaEfectivo('oscuro', false)).toBe('oscuro')
  })

  it('el interruptor pasa al opuesto del que se ve', () => {
    expect(temaAlternado('sistema', true)).toBe('claro')
    expect(temaAlternado('sistema', false)).toBe('oscuro')
    expect(temaAlternado('claro', false)).toBe('oscuro')
  })

  it('aplicar: data-theme fijo o nada', () => {
    const atributos: Record<string, string> = {}
    const raiz = {
      setAttribute: (n: string, v: string) => {
        atributos[n] = v
      },
      removeAttribute: (n: string) => {
        delete atributos[n]
      },
    }
    aplicarTema('oscuro', raiz)
    expect(atributos['data-theme']).toBe('dark')
    aplicarTema('claro', raiz)
    expect(atributos['data-theme']).toBe('light')
    aplicarTema('sistema', raiz)
    expect(atributos['data-theme']).toBeUndefined()
  })
})

describe('fechas', () => {
  it('fecha larga como se dice', () => {
    expect(fechaLarga(new Date(2026, 9, 24))).toBe('sábado 24 de octubre')
  })

  it('fecha ISO local con minutos', () => {
    expect(fechaISOLocal(new Date(2026, 0, 5, 9, 7))).toBe('2026-01-05T09:07')
  })
})

describe('entrada del historial', () => {
  it('guarda momento, piezas con sus carbohidratos, total y origen', () => {
    let plato = platoVacio('cena')
    plato = conPieza(plato, 'principal', pieza({ tipo: 'principal', carbohidratos: 15, id: 'mila', nombre: 'Milanesa' }))
    plato = conPieza(plato, 'verdura', pieza({ tipo: 'acompanamiento', carbohidratos: 5, id: 'hoja', nombre: 'Ensalada' }))
    expect(entradaDesdePlato(plato, '2026-10-26T21:30', 'propuesta')).toEqual({
      fecha: '2026-10-26T21:30',
      momento: 'cena',
      piezas: [
        { id: 'mila', nombre: 'Milanesa', carbohidratos: 15 },
        { id: 'hoja', nombre: 'Ensalada', carbohidratos: 5 },
      ],
      total: 20,
      origen: 'propuesta',
    })
  })
})
