import { describe, expect, it } from 'vitest'
import { MOMENTOS, PIEZAS_BASE, momentoPorId } from '../datos/piezas.ts'
import { estadoDelTotal, totalDelPlato } from '../logica/calculo.ts'
import { piezaDelRol } from '../logica/lugares.ts'
import { idsRecientes, proponerPlato } from '../logica/propuesta.ts'
import type { EntradaHistorial } from '../logica/tipos.ts'
import { ALMUERZO, azarFijo, pieza } from './ayuda.ts'

describe('proponer un plato', () => {
  it('con las piezas reales, propone en rango para cada momento (100 semillas)', () => {
    for (const m of MOMENTOS) {
      for (let semilla = 1; semilla <= 100; semilla++) {
        const p = proponerPlato(PIEZAS_BASE, m, [], azarFijo(semilla))
        expect(p, `${m.id} semilla ${semilla}`).not.toBeNull()
        expect(p!.estado, `${m.id} semilla ${semilla}: ${p!.total} g`).toBe('ok')
        expect(p!.total).toBe(totalDelPlato(p!.plato))
      }
    }
  })

  it('el plato propuesto respeta el momento y los lugares obligatorios', () => {
    const cena = momentoPorId('cena')
    const p = proponerPlato(PIEZAS_BASE, cena, [], azarFijo(7))!
    expect(p.plato.momento).toBe('cena')
    for (const l of p.plato.lugares) {
      if (l.obligatorio) expect(l.pieza).not.toBeNull()
      if (l.pieza) expect(l.pieza.momentos).toContain('cena')
    }
    const principal = piezaDelRol(p.plato, 'principal')!
    if (principal.traeCarbohidratos) expect(piezaDelRol(p.plato, 'acompanamiento')).toBeNull()
  })

  it('no repite la misma pieza en dos lugares', () => {
    const desayuno = momentoPorId('desayuno')
    for (let semilla = 1; semilla <= 50; semilla++) {
      const p = proponerPlato(PIEZAS_BASE, desayuno, [], azarFijo(semilla))!
      const ids = p.plato.lugares.filter((l) => l.pieza).map((l) => l.pieza!.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('si ninguna combinación entra en rango, devuelve la más cercana con su estado', () => {
    const unica = pieza({ tipo: 'principal', carbohidratos: 15 })
    const p = proponerPlato([unica], ALMUERZO, [], azarFijo(1))!
    expect(p.total).toBe(15)
    expect(p.estado).toBe('under')
    expect(estadoDelTotal(p.total, ALMUERZO)).toBe('under')
  })

  it('devuelve null si no hay piezas para un lugar obligatorio', () => {
    expect(proponerPlato([pieza({ tipo: 'fruta', carbohidratos: 15 })], ALMUERZO, [], azarFijo(1))).toBeNull()
  })

  it('evita el principal de las últimas 3 entradas del historial para ese momento', () => {
    const a = pieza({ tipo: 'principal', carbohidratos: 55 })
    const b = pieza({ tipo: 'principal', carbohidratos: 55 })
    const c = pieza({ tipo: 'principal', carbohidratos: 55 })
    const entrada = (id: string, momento: EntradaHistorial['momento'] = 'almuerzo'): EntradaHistorial => ({
      fecha: '2026-10-26T14:00:00',
      momento,
      piezas: [{ id, nombre: id, carbohidratos: 55 }],
      total: 55,
      origen: 'propuesta',
    })
    const historial = [entrada(a.id), entrada(b.id), entrada(c.id, 'cena')]
    for (let semilla = 1; semilla <= 20; semilla++) {
      const p = proponerPlato([a, b, c], ALMUERZO, historial, azarFijo(semilla))!
      expect(piezaDelRol(p.plato, 'principal')!.id).toBe(c.id)
    }
  })

  it('si todos los principales son recientes, igual propone uno', () => {
    const a = pieza({ tipo: 'principal', carbohidratos: 55 })
    const historial: EntradaHistorial[] = [
      { fecha: '2026-10-26', momento: 'almuerzo', piezas: [{ id: a.id, nombre: a.nombre, carbohidratos: 55 }], total: 55, origen: 'propuesta' },
    ]
    expect(proponerPlato([a], ALMUERZO, historial, azarFijo(3))!.total).toBe(55)
  })

  it('idsRecientes toma solo las últimas 3 entradas del momento', () => {
    const entrada = (id: string, momento: EntradaHistorial['momento']): EntradaHistorial => ({
      fecha: '2026-10-26',
      momento,
      piezas: [{ id, nombre: id, carbohidratos: 10 }],
      total: 10,
      origen: 'propuesta',
    })
    const h = [entrada('x1', 'cena'), entrada('x2', 'cena'), entrada('x3', 'cena'), entrada('x4', 'cena'), entrada('y', 'almuerzo')]
    expect([...idsRecientes(h, 'cena')].sort()).toEqual(['x2', 'x3', 'x4'])
    expect([...idsRecientes(h, 'almuerzo')]).toEqual(['y'])
    expect(idsRecientes(h, 'merienda').size).toBe(0)
  })

  it('es repetible con la misma semilla y varía con otra', () => {
    const uno = proponerPlato(PIEZAS_BASE, ALMUERZO, [], azarFijo(42))!
    const dos = proponerPlato(PIEZAS_BASE, ALMUERZO, [], azarFijo(42))!
    expect(dos.plato).toEqual(uno.plato)
    const distintos = new Set<string>()
    for (let s = 1; s <= 20; s++) distintos.add(piezaDelRol(proponerPlato(PIEZAS_BASE, ALMUERZO, [], azarFijo(s))!.plato, 'principal')!.id)
    expect(distintos.size).toBeGreaterThan(3)
  })
})
