import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Drive y Google simulados: las pruebas no salen a internet.
const drive = vi.hoisted(() => ({
  buscarArchivo: vi.fn(),
  leerArchivo: vi.fn(),
  crearArchivo: vi.fn(),
  actualizarArchivo: vi.fn(),
}))
const google = vi.hoisted(() => ({ pedirToken: vi.fn() }))

vi.mock('../datos/drive.ts', async (original) => ({ ...(await original<typeof import('../datos/drive.ts')>()), ...drive }))
vi.mock('../datos/google.ts', async (original) => ({ ...(await original<typeof import('../datos/google.ts')>()), ...google }))

import { Almacen } from '../datos/almacen.ts'
import { ErrorDrive } from '../datos/drive.ts'
import { CLAVE_TOKEN } from '../datos/google.ts'
import { CLAVE_SIN_SUBIR, Sincronizador } from '../datos/sincronizacion.ts'
import { crearDietaInicial } from '../logica/dieta.ts'
import type { Dieta, EntradaHistorial } from '../logica/tipos.ts'

const memoria = new Map<string, string>()
const almacenamiento = {
  getItem: (k: string) => memoria.get(k) ?? null,
  setItem: (k: string, v: string) => void memoria.set(k, v),
  removeItem: (k: string) => void memoria.delete(k),
}

const comida: EntradaHistorial = { fecha: '2026-10-27T13:00', momento: 'almuerzo', piezas: [], total: 0, origen: 'otra-comida' }
const conComida = (d: Dieta): Dieta => ({ ...d, historial: [...d.historial, comida] })
const dietaDeDrive = JSON.stringify(crearDietaInicial())
const subido = (): Dieta => JSON.parse(drive.actualizarArchivo.mock.calls.at(-1)![2] as string) as Dieta

function tokenValido() {
  memoria.set(CLAVE_TOKEN, JSON.stringify({ token: 't', vence: Date.now() + 3_600_000 }))
}

beforeEach(() => {
  vi.useFakeTimers()
  memoria.clear()
  vi.stubGlobal('localStorage', almacenamiento)
  vi.stubGlobal('navigator', { onLine: true })
  for (const f of Object.values(drive)) f.mockReset()
  google.pedirToken.mockReset()
  drive.buscarArchivo.mockResolvedValue('archivo')
  drive.leerArchivo.mockResolvedValue(dietaDeDrive)
  drive.actualizarArchivo.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('sincronización con Drive', () => {
  it('al abrir, lee Drive y lo deja como verdad', async () => {
    tokenValido()
    const almacen = new Almacen(null)
    const s = new Sincronizador(almacen)
    await s.iniciar()
    expect(drive.leerArchivo).toHaveBeenCalled()
    expect(s.obtener().estado).toBe('al-dia')
  })

  it('con la sesión vencida, lo anotado se sube al volver a entrar en vez de pisarse con Drive', async () => {
    memoria.set(CLAVE_TOKEN, JSON.stringify({ token: 'viejo', vence: 0 }))
    google.pedirToken.mockRejectedValueOnce(new Error('hace falta tocar'))
    const almacen = new Almacen(null)
    const s = new Sincronizador(almacen)
    await s.iniciar()
    expect(s.obtener().estado).toBe('sesion-vencida')

    almacen.actualizar(conComida)
    expect(memoria.get(CLAVE_SIN_SUBIR)).toBe('1')

    google.pedirToken.mockResolvedValueOnce({ token: 'nuevo', vence: Date.now() + 3_600_000 })
    expect(await s.entrar()).toBeNull()
    expect(drive.leerArchivo).not.toHaveBeenCalled()
    expect(subido().historial).toContainEqual(comida)
    expect(almacen.obtener().historial).toContainEqual(comida)
    expect(memoria.has(CLAVE_SIN_SUBIR)).toBe(false)
  })

  it('un 401 deja la sesión marcada como vencida (no la olvida), así lo anotado después queda pendiente', async () => {
    tokenValido()
    const almacen = new Almacen(null)
    const s = new Sincronizador(almacen)
    await s.iniciar()
    drive.actualizarArchivo.mockRejectedValueOnce(new ErrorDrive('vencido', 401))
    almacen.actualizar(conComida)
    await vi.advanceTimersByTimeAsync(2500)
    expect(s.obtener().estado).toBe('sesion-vencida')
    expect(memoria.get(CLAVE_TOKEN)).toBeDefined()
    almacen.actualizar((d) => ({ ...d, historial: [...d.historial, { ...comida, fecha: '2026-10-27T21:00' }] }))
    expect(memoria.get(CLAVE_SIN_SUBIR)).toBe('1')
  })

  it('lo que se anota mientras se lee Drive al abrir no se pierde', async () => {
    tokenValido()
    let entregar: (texto: string) => void = () => {}
    drive.leerArchivo.mockReturnValueOnce(new Promise<string>((r) => (entregar = r)))
    const almacen = new Almacen(null)
    const s = new Sincronizador(almacen)
    const apertura = s.iniciar()
    await vi.advanceTimersByTimeAsync(0)
    almacen.actualizar(conComida)
    entregar(dietaDeDrive)
    await apertura
    expect(almacen.obtener().historial).toContainEqual(comida)
    expect(subido().historial).toContainEqual(comida)
  })

  it('con Drive caído espera 30 s para reintentar, no insiste cada 2 s', async () => {
    tokenValido()
    const almacen = new Almacen(null)
    const s = new Sincronizador(almacen)
    await s.iniciar()
    drive.actualizarArchivo.mockRejectedValue(new ErrorDrive('caído', 503))
    almacen.actualizar(conComida)
    await vi.advanceTimersByTimeAsync(2500)
    expect(drive.actualizarArchivo).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(20_000)
    expect(drive.actualizarArchivo).toHaveBeenCalledTimes(1)
    drive.actualizarArchivo.mockResolvedValue(undefined)
    await vi.advanceTimersByTimeAsync(15_000)
    expect(drive.actualizarArchivo).toHaveBeenCalledTimes(2)
    expect(s.obtener().estado).toBe('al-dia')
  })

  it('si la lectura al abrir falla, nunca sube lo del teléfono sin haber leído', async () => {
    tokenValido()
    drive.buscarArchivo.mockRejectedValueOnce(new ErrorDrive('caído', 503))
    const almacen = new Almacen(null)
    const s = new Sincronizador(almacen)
    await s.iniciar()
    expect(s.obtener().estado).toBe('error')
    await vi.advanceTimersByTimeAsync(31_000)
    expect(drive.leerArchivo).toHaveBeenCalled()
    expect(drive.actualizarArchivo).not.toHaveBeenCalled()
  })
})
