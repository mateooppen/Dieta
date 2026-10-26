import { describe, expect, it } from 'vitest'
import { alternativasParaLugar } from '../logica/alternativas.ts'
import { conPieza, platoVacio } from '../logica/lugares.ts'
import { ALMUERZO, pieza } from './ayuda.ts'

describe('alternativas para un lugar', () => {
  const mila = pieza({ tipo: 'principal', carbohidratos: 15, nombre: 'Milanesa' })
  const pollo = pieza({ tipo: 'principal', carbohidratos: 0, nombre: 'Pollo' })
  const tarta = pieza({ tipo: 'principal', carbohidratos: 20, nombre: 'Tarta' })
  const guiso = pieza({ tipo: 'principal', carbohidratos: 45, nombre: 'Guiso', traeCarbohidratos: true })
  const arroz = pieza({ tipo: 'acompanamiento', carbohidratos: 42, nombre: 'Arroz' })
  const papa = pieza({ tipo: 'acompanamiento', carbohidratos: 25, nombre: 'Papa' })
  const pure = pieza({ tipo: 'acompanamiento', carbohidratos: 35, nombre: 'Puré' })
  const hoja = pieza({ tipo: 'acompanamiento', carbohidratos: 3, nombre: 'Ensalada' })
  const todas = [mila, pollo, tarta, guiso, arroz, papa, pure, hoja]

  let plato = platoVacio('almuerzo')
  plato = conPieza(plato, 'principal', mila)
  plato = conPieza(plato, 'acompanamiento', arroz)
  plato = conPieza(plato, 'verdura', hoja)
  // total: 15 + 42 + 3 = 60

  it('excluye la actual, calcula el total nuevo y el estado, y ordena por cercanía', () => {
    const alts = alternativasParaLugar(plato, 'principal', todas, ALMUERZO)
    expect(alts.map((a) => a.nombre)).toEqual(['Tarta', 'Pollo', 'Guiso'])
    expect(alts[0]).toMatchObject({ totalNuevo: 65, estado: 'over' })
    expect(alts[1]).toMatchObject({ totalNuevo: 45, estado: 'under' })
  })

  it('un principal que trae carbohidratos descuenta el acompañamiento del total nuevo', () => {
    const alts = alternativasParaLugar(plato, 'principal', todas, ALMUERZO)
    expect(alts.find((a) => a.nombre === 'Guiso')).toMatchObject({ totalNuevo: 48, estado: 'under' })
  })

  it('en lugares opcionales la primera opción es "Sin <rol>" con su total', () => {
    const alts = alternativasParaLugar(plato, 'acompanamiento', todas, ALMUERZO)
    expect(alts[0]).toMatchObject({ pieza: null, nombre: 'Sin acompañamiento', totalNuevo: 18, estado: 'under' })
    expect(alts.slice(1).map((a) => a.nombre)).toEqual(['Puré', 'Papa'])
    expect(alts[1]).toMatchObject({ totalNuevo: 53, estado: 'ok' })
  })

  it('un lugar opcional vacío ofrece "Sin <rol>" primero y después las piezas', () => {
    const alts = alternativasParaLugar(plato, 'postre', [...todas, pieza({ tipo: 'fruta', carbohidratos: 10, nombre: 'Mandarina' })], ALMUERZO)
    expect(alts.map((a) => a.nombre)).toEqual(['Sin postre', 'Mandarina'])
    expect(alts[0].totalNuevo).toBe(60)
    expect(alts[1]).toMatchObject({ totalNuevo: 70, estado: 'over' })
  })

  it('el principal obligatorio no ofrece la opción vacía', () => {
    expect(alternativasParaLugar(plato, 'principal', todas, ALMUERZO).some((a) => a.pieza === null)).toBe(false)
  })

  it('sin acompañamientos posibles si el principal actual trae carbohidratos', () => {
    const conGuiso = conPieza(plato, 'principal', guiso)
    const alts = alternativasParaLugar(conGuiso, 'acompanamiento', todas, ALMUERZO)
    expect(alts.map((a) => a.nombre)).toEqual(['Sin acompañamiento'])
  })

  it('a igual distancia ordena por nombre', () => {
    const a = pieza({ tipo: 'principal', carbohidratos: 20, nombre: 'Zapallitos rellenos' })
    const b = pieza({ tipo: 'principal', carbohidratos: 10, nombre: 'Bife' })
    const alts = alternativasParaLugar(plato, 'principal', [mila, a, b], ALMUERZO)
    expect(alts.map((x) => x.nombre)).toEqual(['Bife', 'Zapallitos rellenos'])
  })
})
