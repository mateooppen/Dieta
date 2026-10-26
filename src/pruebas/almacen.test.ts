import { describe, expect, it, vi } from 'vitest'
import { Almacen, CLAVE_CACHE, cargarDieta, type Deposito } from '../datos/almacen.ts'
import { crearDietaInicial } from '../logica/dieta.ts'

function depositoEnMemoria(inicial: Record<string, string> = {}): Deposito & { datos: Record<string, string> } {
  const datos = { ...inicial }
  return {
    datos,
    getItem: (k) => datos[k] ?? null,
    setItem: (k, v) => {
      datos[k] = v
    },
  }
}

describe('cargar la dieta desde la caché', () => {
  it('sin caché, parte de las piezas base', () => {
    expect(cargarDieta(null).piezas).toHaveLength(96)
    expect(cargarDieta(depositoEnMemoria()).piezas).toHaveLength(96)
  })

  it('con caché válida, la usa y suma las piezas base que falten', () => {
    const d = crearDietaInicial()
    d.piezas[0].carbohidratos = 77
    d.piezas = d.piezas.slice(0, 90)
    const cargada = cargarDieta(depositoEnMemoria({ [CLAVE_CACHE]: JSON.stringify(d) }))
    expect(cargada.piezas).toHaveLength(96)
    expect(cargada.piezas[0].carbohidratos).toBe(77)
  })

  it('con caché rota, parte de las piezas base', () => {
    const cargada = cargarDieta(depositoEnMemoria({ [CLAVE_CACHE]: '{rota' }))
    expect(cargada.piezas).toHaveLength(96)
    expect(cargada.historial).toEqual([])
  })
})

describe('almacén', () => {
  it('avisa a los oyentes y guarda con retardo', () => {
    vi.useFakeTimers()
    const deposito = depositoEnMemoria()
    const almacen = new Almacen(deposito)
    const oyente = vi.fn()
    almacen.suscribir(oyente)
    almacen.actualizar((d) => ({ ...d, ajustes: { ...d.ajustes, tema: 'oscuro' } }))
    expect(oyente).toHaveBeenCalledTimes(1)
    expect(almacen.obtener().ajustes.tema).toBe('oscuro')
    expect(deposito.datos[CLAVE_CACHE]).toBeUndefined()
    vi.advanceTimersByTime(400)
    expect(JSON.parse(deposito.datos[CLAVE_CACHE]).ajustes.tema).toBe('oscuro')
    vi.useRealTimers()
  })

  it('agrupa varios cambios seguidos en un solo guardado', () => {
    vi.useFakeTimers()
    const deposito = depositoEnMemoria()
    const setItem = vi.spyOn(deposito, 'setItem')
    const almacen = new Almacen(deposito)
    almacen.actualizar((d) => ({ ...d, ajustes: { ...d.ajustes, tema: 'claro' } }))
    almacen.actualizar((d) => ({ ...d, ajustes: { ...d.ajustes, tema: 'oscuro' } }))
    vi.advanceTimersByTime(400)
    expect(setItem).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('dejar de escuchar funciona', () => {
    const almacen = new Almacen(null)
    const oyente = vi.fn()
    const dejar = almacen.suscribir(oyente)
    dejar()
    almacen.actualizar((d) => d)
    expect(oyente).not.toHaveBeenCalled()
  })
})
