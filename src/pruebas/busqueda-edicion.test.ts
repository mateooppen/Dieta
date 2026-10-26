import { describe, expect, it } from 'vitest'
import { PIEZAS_BASE } from '../datos/piezas.ts'
import { buscarPiezas, filtrarPiezas, normalizar, resumenPiezas } from '../logica/busqueda.ts'
import { barraRango } from '../logica/calculo.ts'
import { crearDietaInicial } from '../logica/dieta.ts'
import {
  agregarPieza,
  alternarMomento,
  borradorDesdePieza,
  borradorVacio,
  crearPieza,
  editarPieza,
  eliminarPieza,
  generarId,
  validarBorrador,
} from '../logica/edicion.ts'
import { entradaDesdePiezas } from '../logica/historial.ts'
import { ALMUERZO, pieza } from './ayuda.ts'

describe('búsqueda', () => {
  it('normaliza acentos y mayúsculas', () => {
    expect(normalizar('  Sándwich de Jamón ')).toBe('sandwich de jamon')
  })

  it('encuentra por parte del nombre sin importar acentos', () => {
    const r = buscarPiezas(PIEZAS_BASE, 'sandwich')
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((p) => normalizar(p.nombre).includes('sandwich'))).toBe(true)
  })

  it('con texto vacío no devuelve nada, excluye ids y limita la cantidad', () => {
    expect(buscarPiezas(PIEZAS_BASE, '   ')).toEqual([])
    const todas = buscarPiezas(PIEZAS_BASE, 'a', new Set(), 1000)
    const sinPrimera = buscarPiezas(PIEZAS_BASE, 'a', new Set([todas[0].id]), 1000)
    expect(sinPrimera).toHaveLength(todas.length - 1)
    expect(buscarPiezas(PIEZAS_BASE, 'a', new Set(), 3)).toHaveLength(3)
  })

  it('filtra por tipo, por sin validar y por texto', () => {
    const propia = pieza({ tipo: 'extra', carbohidratos: 9, nombre: 'Turrón', validada: false })
    const lista = [...PIEZAS_BASE, propia]
    expect(filtrarPiezas(lista, 'todas', '')).toHaveLength(97)
    expect(filtrarPiezas(lista, 'fruta', '').every((p) => p.tipo === 'fruta')).toBe(true)
    expect(filtrarPiezas(lista, 'sin-validar', '')).toEqual([propia])
    expect(filtrarPiezas(lista, 'extra', 'turr')).toEqual([propia])
    expect(filtrarPiezas(lista, 'fruta', 'turr')).toEqual([])
  })

  it('resumen', () => {
    expect(resumenPiezas(PIEZAS_BASE)).toBe('96 piezas · 0 sin validar')
    expect(resumenPiezas([pieza({ tipo: 'extra', carbohidratos: 1, validada: false })])).toBe('1 pieza · 1 sin validar')
  })
})

describe('barra de rango', () => {
  it('la escala llega al 130 % del máximo', () => {
    const b = barraRango(55, ALMUERZO) // escala 78
    expect(b).toEqual({ relleno: 71, zonaInicio: 64, zonaAncho: 13 })
    expect(barraRango(0, ALMUERZO).relleno).toBe(0)
    expect(barraRango(200, ALMUERZO).relleno).toBe(100)
  })
})

describe('edición de piezas', () => {
  it('borrador vacío no pasa la validación; completo sí', () => {
    expect(validarBorrador(borradorVacio())).toBe('Falta el nombre.')
    const b = { ...borradorVacio(), nombre: 'Tarta de choclo', momentos: ['almuerzo' as const] }
    expect(validarBorrador(b)).toBeNull()
    expect(validarBorrador({ ...b, carbohidratos: 2.5 })).toMatch(/entero/)
    expect(validarBorrador({ ...b, carbohidratos: -1 })).toMatch(/entero/)
    expect(validarBorrador({ ...b, momentos: [] })).toBe('Elegí al menos un momento.')
  })

  it('genera ids legibles y únicos', () => {
    expect(generarId('Tarta de choclo', new Set())).toBe('tarta-de-choclo')
    expect(generarId('  ¡Ñoquis con salsa!  ', new Set())).toBe('noquis-con-salsa')
    expect(generarId('Tarta', new Set(['tarta']))).toBe('tarta-2')
    expect(generarId('Tarta', new Set(['tarta', 'tarta-2']))).toBe('tarta-3')
    expect(generarId('???', new Set())).toBe('pieza')
  })

  it('crear, editar y eliminar sin tocar las demás', () => {
    const d = crearDietaInicial()
    const b = { ...borradorVacio(), nombre: ' Tarta de choclo ', porcion: '1 porción', carbohidratos: 25, momentos: ['almuerzo' as const, 'cena' as const] }
    const nueva = crearPieza(b, d.piezas, '2026-10-26')
    expect(nueva).toMatchObject({ id: 'tarta-de-choclo', nombre: 'Tarta de choclo', validada: false, origen: 'manual', creadaEl: '2026-10-26' })

    const conNueva = agregarPieza(d, nueva)
    expect(conNueva.piezas).toHaveLength(97)
    expect(d.piezas).toHaveLength(96)

    const editada = editarPieza(conNueva, nueva.id, { ...borradorDesdePieza(nueva), carbohidratos: 30, validada: true })
    const p = editada.piezas.find((x) => x.id === nueva.id)!
    expect(p).toMatchObject({ carbohidratos: 30, validada: true, id: 'tarta-de-choclo', creadaEl: '2026-10-26' })
    expect(editada.piezas.filter((x) => x.id !== nueva.id)).toEqual(conNueva.piezas.filter((x) => x.id !== nueva.id))

    const sinNueva = eliminarPieza(editada, nueva.id)
    expect(sinNueva.piezas).toHaveLength(96)
  })

  it('el borrador de una pieza no comparte la lista de momentos', () => {
    const b = borradorDesdePieza(PIEZAS_BASE[0])
    b.momentos.push('colacion')
    expect(PIEZAS_BASE[0].momentos).not.toContain('colacion')
  })

  it('alternar momento agrega o quita', () => {
    expect(alternarMomento(['cena'], 'almuerzo')).toEqual(['cena', 'almuerzo'])
    expect(alternarMomento(['cena', 'almuerzo'], 'cena')).toEqual(['almuerzo'])
  })
})

describe('historial desde Otra comida', () => {
  it('suma las piezas elegidas con origen otra-comida', () => {
    const a = pieza({ tipo: 'extra', carbohidratos: 20, id: 'a', nombre: 'A' })
    const b = pieza({ tipo: 'fruta', carbohidratos: 15, id: 'b', nombre: 'B' })
    expect(entradaDesdePiezas([a, b], 'merienda', '2026-10-26T17:00', 'otra-comida')).toEqual({
      fecha: '2026-10-26T17:00',
      momento: 'merienda',
      piezas: [
        { id: 'a', nombre: 'A', carbohidratos: 20 },
        { id: 'b', nombre: 'B', carbohidratos: 15 },
      ],
      total: 35,
      origen: 'otra-comida',
    })
  })
})
