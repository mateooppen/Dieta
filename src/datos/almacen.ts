import { useEffect, useState } from 'preact/hooks'
import { agregarPiezasNuevas, crearDietaInicial, importarDieta } from '../logica/dieta.ts'
import type { Dieta } from '../logica/tipos.ts'

/**
 * Almacén de la dieta en memoria con copia en localStorage (caché para abrir rápido y sin conexión).
 * Drive se suma en la fase 5: este módulo queda como la única puerta de lectura y escritura.
 */

export const CLAVE_CACHE = 'dieta.json'
const RETARDO_GUARDADO_MS = 300

type Oyente = () => void

/** Interfaz mínima de almacenamiento, para poder probar sin navegador. */
export interface Deposito {
  getItem(clave: string): string | null
  setItem(clave: string, valor: string): void
}

function depositoDelNavegador(): Deposito | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/** Lee la dieta del depósito; si no hay o está rota, parte de las piezas base. Siempre suma piezas base nuevas. */
export function cargarDieta(deposito: Deposito | null): Dieta {
  const texto = deposito?.getItem(CLAVE_CACHE)
  if (texto) {
    const r = importarDieta(texto)
    if (r.ok) return agregarPiezasNuevas(r.dieta).dieta
  }
  return crearDietaInicial()
}

export class Almacen {
  private dieta: Dieta
  private oyentes = new Set<Oyente>()
  private temporizador: ReturnType<typeof setTimeout> | null = null
  private deposito: Deposito | null

  constructor(deposito: Deposito | null) {
    this.deposito = deposito
    this.dieta = cargarDieta(deposito)
  }

  obtener(): Dieta {
    return this.dieta
  }

  /** Reemplaza la dieta, avisa a las pantallas y programa el guardado. */
  actualizar(cambio: (actual: Dieta) => Dieta): void {
    this.dieta = cambio(this.dieta)
    for (const o of this.oyentes) o()
    this.programarGuardado()
  }

  suscribir(oyente: Oyente): () => void {
    this.oyentes.add(oyente)
    return () => this.oyentes.delete(oyente)
  }

  /** Guarda ya, sin esperar el retardo. */
  guardarAhora(): void {
    if (this.temporizador) clearTimeout(this.temporizador)
    this.temporizador = null
    try {
      this.deposito?.setItem(CLAVE_CACHE, JSON.stringify(this.dieta))
    } catch {
      // Sin espacio o sin permiso: la app sigue funcionando en memoria.
    }
  }

  private programarGuardado(): void {
    if (this.temporizador) clearTimeout(this.temporizador)
    this.temporizador = setTimeout(() => this.guardarAhora(), RETARDO_GUARDADO_MS)
  }
}

export const almacen = new Almacen(depositoDelNavegador())

/** Hook: la dieta actual y la función para cambiarla. Las pantallas se vuelven a dibujar con cada cambio. */
export function useDieta(): [Dieta, (cambio: (actual: Dieta) => Dieta) => void] {
  const [dieta, setDieta] = useState(almacen.obtener())
  useEffect(() => almacen.suscribir(() => setDieta(almacen.obtener())), [])
  return [dieta, (cambio) => almacen.actualizar(cambio)]
}
