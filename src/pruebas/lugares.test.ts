import { describe, expect, it } from 'vitest'
import { MOMENTOS, PIEZAS_BASE, momentoPorId } from '../datos/piezas.ts'
import { conPieza, lugaresVacios, piezasValidasParaLugar, platoVacio, rolPrincipal } from '../logica/lugares.ts'
import { ALMUERZO, pieza } from './ayuda.ts'

describe('lugares del plato por momento', () => {
  it('almuerzo y cena: principal obligatorio y tres opcionales', () => {
    for (const m of ['almuerzo', 'cena'] as const) {
      expect(lugaresVacios(m).map((l) => [l.rol, l.obligatorio])).toEqual([
        ['principal', true],
        ['acompanamiento', false],
        ['verdura', false],
        ['postre', false],
      ])
    }
  })

  it('desayuno y merienda: bebida y algo para comer obligatorios; leche y acompañamiento opcionales', () => {
    expect(lugaresVacios('desayuno').map((l) => [l.rol, l.obligatorio])).toEqual([
      ['bebida', true],
      ['conBebida', false],
      ['solido', true],
      ['segundo', false],
    ])
  })

  it('colación: un solo lugar', () => {
    expect(lugaresVacios('colacion')).toEqual([{ rol: 'colacion', obligatorio: true, pieza: null }])
  })

  it('el rol principal de cada momento', () => {
    expect(rolPrincipal('almuerzo')).toBe('principal')
    expect(rolPrincipal('desayuno')).toBe('solido')
    expect(rolPrincipal('colacion')).toBe('colacion')
  })
})

describe('piezas válidas para un lugar', () => {
  const principal = pieza({ tipo: 'principal', carbohidratos: 15 })
  const conCarbos = pieza({ tipo: 'principal', carbohidratos: 45, traeCarbohidratos: true })
  const arroz = pieza({ tipo: 'acompanamiento', carbohidratos: 42 })
  const zapallo = pieza({ tipo: 'acompanamiento', carbohidratos: 15 })
  const ensalada = pieza({ tipo: 'acompanamiento', carbohidratos: 5 })
  const brocoli = pieza({ tipo: 'acompanamiento', carbohidratos: 10 })
  const manzana = pieza({ tipo: 'fruta', carbohidratos: 15 })
  const flan = pieza({ tipo: 'extra', carbohidratos: 20 })
  const alfajor = pieza({ tipo: 'extra', carbohidratos: 30, momentos: ['merienda'] })
  const agua = pieza({ tipo: 'bebida', carbohidratos: 0 })
  const tostada = pieza({ tipo: 'desayuno_merienda', carbohidratos: 13, momentos: ['desayuno', 'merienda', 'colacion'] })
  const todas = [principal, conCarbos, arroz, zapallo, ensalada, brocoli, manzana, flan, alfajor, agua, tostada]

  it('principal: solo piezas de tipo principal', () => {
    expect(piezasValidasParaLugar(todas, 'principal', ALMUERZO)).toEqual([principal, conCarbos])
  })

  it('acompañamiento: acompañamientos con más de 10 g', () => {
    expect(piezasValidasParaLugar(todas, 'acompanamiento', ALMUERZO, conPieza(platoVacio('almuerzo'), 'principal', principal))).toEqual([arroz, zapallo])
  })

  it('acompañamiento vacío si el principal trae carbohidratos', () => {
    expect(piezasValidasParaLugar(todas, 'acompanamiento', ALMUERZO, conPieza(platoVacio('almuerzo'), 'principal', conCarbos))).toEqual([])
  })

  it('verdura: acompañamientos de 10 g o menos', () => {
    expect(piezasValidasParaLugar(todas, 'verdura', ALMUERZO)).toEqual([ensalada, brocoli])
  })

  it('postre: frutas y extras del momento', () => {
    expect(piezasValidasParaLugar(todas, 'postre', ALMUERZO)).toEqual([manzana, flan])
  })

  it('desayuno: bebida, y piezas de desayuno/merienda o fruta', () => {
    const desayuno = momentoPorId('desayuno')
    expect(piezasValidasParaLugar(todas, 'bebida', desayuno)).toEqual([agua])
    expect(piezasValidasParaLugar(todas, 'solido', desayuno)).toEqual([manzana, tostada])
    // Con una fruta para comer, se acompaña con algo que se come solo; sin nada para comer, no hay acompañamiento.
    expect(piezasValidasParaLugar(todas, 'segundo', desayuno, conPieza(platoVacio('desayuno'), 'solido', manzana))).toEqual([tostada])
    expect(piezasValidasParaLugar(todas, 'segundo', desayuno)).toEqual([])
  })

  it('colación: fruta, desayuno/merienda o extra dentro del rango 10-15', () => {
    const colacion = momentoPorId('colacion')
    expect(piezasValidasParaLugar(todas, 'colacion', colacion)).toEqual([manzana, tostada])
  })

  it('solo piezas cuyos momentos incluyen el actual', () => {
    expect(piezasValidasParaLugar(todas, 'postre', momentoPorId('merienda'))).toContain(alfajor)
    expect(piezasValidasParaLugar(todas, 'postre', momentoPorId('cena'))).not.toContain(alfajor)
  })

  it('con las piezas reales, todo lugar obligatorio tiene candidatas en cada momento', () => {
    for (const m of MOMENTOS) {
      for (const l of lugaresVacios(m.id)) {
        if (l.obligatorio) expect(piezasValidasParaLugar(PIEZAS_BASE, l.rol, m).length).toBeGreaterThan(0)
      }
    }
  })
})

describe('cambiar una pieza del plato', () => {
  it('devuelve un plato nuevo sin tocar el original', () => {
    const vacio = platoVacio('almuerzo')
    const p = pieza({ tipo: 'principal', carbohidratos: 15 })
    const nuevo = conPieza(vacio, 'principal', p)
    expect(nuevo.lugares[0].pieza).toBe(p)
    expect(vacio.lugares[0].pieza).toBeNull()
  })

  it('si el principal nuevo trae carbohidratos, vacía el acompañamiento', () => {
    let plato = platoVacio('cena')
    plato = conPieza(plato, 'acompanamiento', pieza({ tipo: 'acompanamiento', carbohidratos: 40 }))
    plato = conPieza(plato, 'principal', pieza({ tipo: 'principal', carbohidratos: 45, traeCarbohidratos: true }))
    expect(plato.lugares.find((l) => l.rol === 'acompanamiento')!.pieza).toBeNull()
  })
})
