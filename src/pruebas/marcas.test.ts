import { describe, expect, it } from 'vitest'
import { SIN_PREPARACION, badgesDePieza, paraTenerAMano, textoCarbohidratos } from '../logica/marcas.ts'
import { pieza } from './ayuda.ts'

describe('badges', () => {
  it('Fibra, Grasa y Meal prep con la palabra completa', () => {
    const p = pieza({ tipo: 'principal', carbohidratos: 10, altaFibra: true, altaGrasa: true, mealPrep: true })
    expect(badgesDePieza(p).map((b) => b.texto)).toEqual(['Fibra', 'Grasa', 'Meal prep'])
  })

  it('Sin validar en ámbar', () => {
    const p = pieza({ tipo: 'extra', carbohidratos: 10, validada: false })
    expect(badgesDePieza(p)).toEqual([{ texto: 'Sin validar', tono: 'ambar' }])
  })

  it('sin marcas, sin badges', () => {
    expect(badgesDePieza(pieza({ tipo: 'fruta', carbohidratos: 10 }))).toEqual([])
  })
})

describe('para tener a mano', () => {
  it('une las notas de las piezas que las tienen', () => {
    const a = pieza({ tipo: 'principal', carbohidratos: 10, nota: 'Milanesas hechas y congeladas.' })
    const b = pieza({ tipo: 'acompanamiento', carbohidratos: 40, nota: '' })
    const c = pieza({ tipo: 'acompanamiento', carbohidratos: 5, nota: '  Verduras cortadas.  ' })
    expect(paraTenerAMano([a, null, b, c])).toBe('Milanesas hechas y congeladas. Verduras cortadas.')
  })

  it('sin notas, el texto por defecto', () => {
    expect(paraTenerAMano([pieza({ tipo: 'fruta', carbohidratos: 10 }), null])).toBe(SIN_PREPARACION)
    expect(SIN_PREPARACION).toBe('Nada que preparar de antes.')
  })
})

describe('texto de carbohidratos', () => {
  it('número y unidad', () => {
    expect(textoCarbohidratos(52)).toBe('52 g')
    expect(textoCarbohidratos(0)).toBe('0 g')
  })
})
