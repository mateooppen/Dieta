import { describe, expect, it } from 'vitest'
import { TEXTO_ESTADO, distanciaAlRango, estadoDelTotal, totalDePiezas, totalDelPlato } from '../logica/calculo.ts'
import { conPieza, platoVacio } from '../logica/lugares.ts'
import { ALMUERZO, pieza } from './ayuda.ts'

describe('total del plato', () => {
  it('suma los carbohidratos de las piezas e ignora los lugares vacíos', () => {
    const a = pieza({ tipo: 'principal', carbohidratos: 15 })
    const b = pieza({ tipo: 'acompanamiento', carbohidratos: 42 })
    expect(totalDePiezas([a, null, b, undefined])).toBe(57)
    let plato = platoVacio('almuerzo')
    plato = conPieza(plato, 'principal', a)
    plato = conPieza(plato, 'acompanamiento', b)
    expect(totalDelPlato(plato)).toBe(57)
  })

  it('un plato vacío suma 0', () => {
    expect(totalDelPlato(platoVacio('cena'))).toBe(0)
  })
})

describe('estado respecto del rango', () => {
  it('ok dentro, incluidos los bordes', () => {
    expect(estadoDelTotal(50, ALMUERZO)).toBe('ok')
    expect(estadoDelTotal(55, ALMUERZO)).toBe('ok')
    expect(estadoDelTotal(60, ALMUERZO)).toBe('ok')
  })

  it('over por encima y under por debajo', () => {
    expect(estadoDelTotal(61, ALMUERZO)).toBe('over')
    expect(estadoDelTotal(49, ALMUERZO)).toBe('under')
  })

  it('distancia al rango', () => {
    expect(distanciaAlRango(55, ALMUERZO)).toBe(0)
    expect(distanciaAlRango(63, ALMUERZO)).toBe(3)
    expect(distanciaAlRango(40, ALMUERZO)).toBe(10)
  })

  it('cada estado tiene su palabra', () => {
    expect(TEXTO_ESTADO).toEqual({ ok: 'En rango', over: 'Por encima', under: 'Por debajo' })
  })
})
