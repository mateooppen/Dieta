import { useEffect, useState } from 'preact/hooks'
import { agregarPiezasNuevas, importarDieta } from '../logica/dieta.ts'
import type { Dieta } from '../logica/tipos.ts'
import { almacen, type Almacen } from './almacen.ts'
import { ErrorDrive, actualizarArchivo, buscarArchivo, crearArchivo, leerArchivo } from './drive.ts'
import { borrarToken, cerrarSesionGoogle, leerTokenGuardado, pedirToken, tokenVigente } from './google.ts'

/**
 * Mantiene dieta.json de Drive igual a lo que hay en el teléfono.
 * Drive es la fuente de verdad: al abrir se lee; después de cada cambio se escribe (agrupando).
 * Un solo usuario: el último que escribe gana.
 */

export type EstadoSync = 'sin-sesion' | 'sesion-vencida' | 'sincronizando' | 'al-dia' | 'sin-conexion' | 'error'

export interface SituacionSync {
  estado: EstadoSync
  /** Explicación corta para mostrar en Ajustes. */
  detalle: string
  /** Hora del último guardado en Drive que salió bien, como texto, o null. */
  ultimoGuardado: string | null
}

export const RETARDO_ESCRITURA_MS = 2000

/** Marca en el teléfono: hay cambios hechos acá (por ejemplo sin internet) que todavía no llegaron a Drive. */
export const CLAVE_SIN_SUBIR = 'dieta.sin-subir'

function marcarSinSubir(valor: boolean): void {
  try {
    if (valor) localStorage.setItem(CLAVE_SIN_SUBIR, '1')
    else localStorage.removeItem(CLAVE_SIN_SUBIR)
  } catch {
    // Sin almacenamiento: queda solo en memoria.
  }
}

function haySinSubir(): boolean {
  try {
    return localStorage.getItem(CLAVE_SIN_SUBIR) === '1'
  } catch {
    return false
  }
}

/**
 * Qué hacer con Drive al abrir la app (o al volver internet). Función pura para poder probarla.
 * Los cambios del teléfono que no llegaron a subirse son lo más nuevo: se suben en vez de leer Drive.
 */
export function accionAlAbrir(e: { haySesion: boolean; tokenVigente: boolean; enLinea: boolean; cambiosSinSubir: boolean }): 'nada' | 'sin-conexion' | 'renovar' | 'leer' | 'subir' {
  if (!e.haySesion) return 'nada'
  if (!e.enLinea) return 'sin-conexion'
  if (!e.tokenVigente) return 'renovar'
  return e.cambiosSinSubir ? 'subir' : 'leer'
}

/** Qué queda en el teléfono al abrir: lo de Drive, más las piezas base nuevas de esta versión. Null si Drive no tiene nada usable. */
export function dietaAlAbrir(textoDrive: string | null): Dieta | null {
  if (!textoDrive) return null
  const r = importarDieta(textoDrive)
  return r.ok ? agregarPiezasNuevas(r.dieta).dieta : null
}

export const TEXTO_ESTADO_SYNC: Record<EstadoSync, string> = {
  'sin-sesion': 'Sin cuenta: los datos quedan solo en este teléfono.',
  'sesion-vencida': 'La sesión venció. Entrá de nuevo para seguir guardando en Drive.',
  sincronizando: 'Guardando en Drive…',
  'al-dia': 'Guardado en Drive.',
  'sin-conexion': 'Sin internet: se guarda en Drive cuando vuelva.',
  error: 'No se pudo guardar en Drive.',
}

type Oyente = () => void

export class Sincronizador {
  private situacion: SituacionSync = { estado: 'sin-sesion', detalle: TEXTO_ESTADO_SYNC['sin-sesion'], ultimoGuardado: null }
  private oyentes = new Set<Oyente>()
  private idArchivo: string | null = null
  private temporizador: ReturnType<typeof setTimeout> | null = null
  private pendiente = false
  private escribiendo = false
  /** Mientras se aplica lo leído de Drive, los cambios del almacén no se vuelven a subir. */
  private aplicandoRemoto = false
  /** Si ya se habló con Drive desde que se abrió la app. */
  private conectado = false
  private almacen: Almacen

  constructor(almacen: Almacen) {
    this.almacen = almacen
    almacen.suscribir(() => {
      if (!this.aplicandoRemoto) this.programarEscritura()
    })
    if (typeof addEventListener !== 'undefined') {
      addEventListener('online', () => {
        // Si la app abrió sin internet, recién ahora se habla con Drive.
        if (!this.conectado) void this.iniciar()
        else if (this.pendiente) this.programarEscritura()
      })
    }
  }

  obtener(): SituacionSync {
    return this.situacion
  }

  suscribir(oyente: Oyente): () => void {
    this.oyentes.add(oyente)
    return () => this.oyentes.delete(oyente)
  }

  private fijar(estado: EstadoSync, detalle = TEXTO_ESTADO_SYNC[estado]): void {
    this.situacion = { ...this.situacion, estado, detalle }
    for (const o of this.oyentes) o()
  }

  private token(): string | null {
    return tokenVigente(leerTokenGuardado(), Date.now())
  }

  /** Al abrir la app: si hay sesión, lee Drive y lo deja como verdad. Nunca lanza. */
  async iniciar(): Promise<void> {
    let token = this.token()
    const accion = accionAlAbrir({
      haySesion: leerTokenGuardado() !== null,
      tokenVigente: token !== null,
      enLinea: typeof navigator === 'undefined' || navigator.onLine !== false,
      cambiosSinSubir: haySinSubir(),
    })
    if (accion === 'nada') return
    if (accion === 'sin-conexion') {
      this.pendiente = haySinSubir()
      this.fijar('sin-conexion')
      return
    }
    if (accion === 'renovar') {
      // El token venció: intento renovarlo sin molestar.
      try {
        token = (await pedirToken(true)).token
      } catch {
        this.fijar(typeof navigator !== 'undefined' && navigator.onLine === false ? 'sin-conexion' : 'sesion-vencida')
        return
      }
    }
    this.conectado = true
    if (haySinSubir()) await this.escribir(token!)
    else await this.leerDeDrive(token!)
  }

  /** Desde un toque del usuario: pide permiso a Google y lee Drive. Devuelve el problema, o null si salió bien. */
  async entrar(): Promise<string | null> {
    try {
      const t = await pedirToken(false)
      this.conectado = true
      await this.leerDeDrive(t.token)
      return null
    } catch (e) {
      return e instanceof Error ? e.message : 'No se pudo entrar con Google.'
    }
  }

  async salir(): Promise<void> {
    if (this.temporizador) clearTimeout(this.temporizador)
    this.temporizador = null
    this.pendiente = false
    this.idArchivo = null
    this.conectado = false
    marcarSinSubir(false)
    await cerrarSesionGoogle()
    this.fijar('sin-sesion')
  }

  /** Sube ya lo que hay en el teléfono (por ejemplo después de importar un respaldo). */
  subirAhora(): Promise<void> {
    if (this.temporizador) clearTimeout(this.temporizador)
    this.temporizador = null
    return this.escribir()
  }

  private async leerDeDrive(token: string): Promise<void> {
    this.fijar('sincronizando', 'Leyendo Drive…')
    try {
      this.idArchivo = await buscarArchivo(token)
      if (this.idArchivo) {
        const remota = dietaAlAbrir(await leerArchivo(token, this.idArchivo))
        if (remota) {
          this.aplicandoRemoto = true
          try {
            this.almacen.actualizar(() => remota)
            this.almacen.guardarAhora()
          } finally {
            this.aplicandoRemoto = false
          }
          this.fijar('al-dia', 'Leído de Drive.')
          return
        }
      }
      // Drive no tiene nada (o está roto): lo que hay en el teléfono pasa a ser la verdad.
      await this.escribir(token)
    } catch (e) {
      this.manejarError(e)
    }
  }

  private programarEscritura(): void {
    this.pendiente = true
    if (!leerTokenGuardado()) return
    marcarSinSubir(true)
    if (this.temporizador) clearTimeout(this.temporizador)
    this.temporizador = setTimeout(() => void this.escribir(), RETARDO_ESCRITURA_MS)
  }

  private async escribir(tokenDado?: string): Promise<void> {
    if (this.escribiendo) {
      this.pendiente = true
      return
    }
    const token = tokenDado ?? this.token()
    if (!token) {
      if (leerTokenGuardado()) this.fijar('sesion-vencida')
      return
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.fijar('sin-conexion')
      return
    }
    this.escribiendo = true
    this.pendiente = false
    this.fijar('sincronizando')
    try {
      const contenido = JSON.stringify(this.almacen.obtener())
      if (this.idArchivo) {
        try {
          await actualizarArchivo(token, this.idArchivo, contenido)
        } catch (e) {
          if (e instanceof ErrorDrive && e.estado === 404) this.idArchivo = await crearArchivo(token, contenido)
          else throw e
        }
      } else {
        this.idArchivo = (await buscarArchivo(token)) ?? (await crearArchivo(token, contenido))
        if (this.idArchivo) await actualizarArchivo(token, this.idArchivo, contenido)
      }
      if (!this.pendiente) marcarSinSubir(false)
      this.situacion = { ...this.situacion, ultimoGuardado: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) }
      this.fijar('al-dia')
    } catch (e) {
      this.manejarError(e)
    } finally {
      this.escribiendo = false
      if (this.pendiente) this.programarEscritura()
    }
  }

  private manejarError(e: unknown): void {
    if (e instanceof ErrorDrive && e.sesionVencida) {
      borrarToken()
      this.fijar('sesion-vencida')
      return
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.pendiente = true
      this.fijar('sin-conexion')
      return
    }
    const mensaje = e instanceof Error ? e.message : String(e)
    if (e instanceof ErrorDrive && e.temporal) {
      this.pendiente = true
      this.temporizador = setTimeout(() => void this.escribir(), 30_000)
    }
    this.fijar('error', `${TEXTO_ESTADO_SYNC.error} ${mensaje}`)
  }
}

export const sincronizador = new Sincronizador(almacen)

/** Hook: la situación de la sincronización, actualizada en vivo. */
export function useSincronizacion(): SituacionSync {
  const [situacion, setSituacion] = useState(sincronizador.obtener())
  useEffect(() => sincronizador.suscribir(() => setSituacion(sincronizador.obtener())), [])
  return situacion
}
