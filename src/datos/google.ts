/**
 * Login con Google Identity Services: pide al usuario permiso para usar la carpeta privada
 * de la app en su Drive y devuelve un token (una llave temporal, dura una hora).
 * El id de cliente es público por diseño; el mismo que usa la app Registro-financiero.
 */

export const CLIENT_ID = '926576243590-0ffu3hgsn4qmsdua6bekbb0s7443j2cn.apps.googleusercontent.com'
export const ALCANCE = 'https://www.googleapis.com/auth/drive.appdata'
export const CLAVE_TOKEN = 'dieta.token'

export interface TokenGuardado {
  token: string
  /** Momento de vencimiento, en milisegundos desde 1970. */
  vence: number
}

/** Margen antes del vencimiento a partir del cual el token se considera vencido. */
const MARGEN_MS = 60_000

/** Devuelve el token si todavía sirve, o null. Función pura para poder probarla. */
export function tokenVigente(guardado: TokenGuardado | null, ahora: number): string | null {
  if (!guardado || typeof guardado.token !== 'string' || typeof guardado.vence !== 'number') return null
  return ahora < guardado.vence - MARGEN_MS ? guardado.token : null
}

export function leerTokenGuardado(): TokenGuardado | null {
  try {
    const texto = localStorage.getItem(CLAVE_TOKEN)
    return texto ? (JSON.parse(texto) as TokenGuardado) : null
  } catch {
    return null
  }
}

export function guardarToken(token: string, duracionSegundos: number): TokenGuardado {
  const guardado = { token, vence: Date.now() + duracionSegundos * 1000 }
  try {
    localStorage.setItem(CLAVE_TOKEN, JSON.stringify(guardado))
  } catch {
    // Sin espacio: la sesión dura lo que dure la pestaña.
  }
  return guardado
}

export function borrarToken(): void {
  try {
    localStorage.removeItem(CLAVE_TOKEN)
  } catch {
    // Nada que hacer.
  }
}

/* Tipos mínimos de la librería de Google que se carga en tiempo de ejecución. */
interface RespuestaToken {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}
interface ClienteToken {
  requestAccessToken(opciones?: { prompt?: string }): void
}
interface GoogleGlobal {
  accounts: {
    oauth2: {
      initTokenClient(config: {
        client_id: string
        scope: string
        callback: (r: RespuestaToken) => void
        error_callback?: (e: { type?: string; message?: string }) => void
      }): ClienteToken
      revoke(token: string, hecho?: () => void): void
      hasGrantedAllScopes?(respuesta: RespuestaToken, ...alcances: string[]): boolean
    }
  }
}

function google(): GoogleGlobal | undefined {
  return (globalThis as { google?: GoogleGlobal }).google
}

/** True si la librería de Google ya está lista, así el toque abre la ventana sin demora. */
export function googleListo(): boolean {
  return Boolean(google()?.accounts?.oauth2)
}

/** Traduce los problemas que informa Google a una frase clara. Función pura para poder probarla. */
export function mensajeErrorGoogle(tipo: string | undefined): string {
  switch (tipo) {
    case 'popup_closed':
      return 'Se cerró la ventana de Google antes de terminar. Tocá "Entrar con Google" de nuevo.'
    case 'popup_failed_to_open':
      return 'El teléfono no dejó abrir la ventana de Google. Revisá que el navegador permita ventanas emergentes y probá de nuevo.'
    case 'access_denied':
      return 'No diste permiso a la app. Sin ese permiso los datos quedan solo en este teléfono.'
    case 'sin_permiso_drive':
      return 'Entraste, pero sin marcar el permiso de Drive. Tocá "Entrar con Google" de nuevo y marcá la casilla de Drive.'
    default:
      return tipo ? `No se pudo entrar con Google (${tipo}).` : 'No se pudo entrar con Google.'
  }
}

let cargaPendiente: Promise<void> | null = null

/** Carga la librería de Google una sola vez. */
export function cargarGoogle(): Promise<void> {
  if (google()) return Promise.resolve()
  if (cargaPendiente) return cargaPendiente
  cargaPendiente = new Promise((resolver, rechazar) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolver()
    script.onerror = () => {
      cargaPendiente = null
      rechazar(new Error('No se pudo cargar la librería de Google. ¿Hay internet?'))
    }
    document.head.appendChild(script)
  })
  return cargaPendiente
}

/**
 * Abre la ventana de Google. Tiene que llamarse en el mismo instante del toque (sin esperas antes),
 * porque si no el teléfono la trata como ventana no pedida y la cierra.
 */
function solicitar(g: GoogleGlobal, silencioso: boolean): Promise<TokenGuardado> {
  return new Promise((resolver, rechazar) => {
    const cliente = g.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: ALCANCE,
      callback: (r) => {
        if (!r.access_token || !r.expires_in) {
          rechazar(new Error(r.error ? mensajeErrorGoogle(r.error) : 'Google no devolvió un permiso.'))
          return
        }
        // Google deja desmarcar el permiso de Drive en la ventana: sin él, la app no puede guardar.
        const verificar = g.accounts.oauth2.hasGrantedAllScopes
        if (verificar && !verificar(r, ALCANCE)) {
          rechazar(new Error(mensajeErrorGoogle('sin_permiso_drive')))
          return
        }
        resolver(guardarToken(r.access_token, r.expires_in))
      },
      error_callback: (e) => rechazar(new Error(mensajeErrorGoogle(e.type))),
    })
    cliente.requestAccessToken({ prompt: silencioso ? '' : 'select_account' })
  })
}

/**
 * Pide un token. Con `silencioso` intenta renovarlo sin molestar; si Google necesita que el usuario
 * toque algo, falla y hay que volver a llamar sin `silencioso` desde un toque del usuario.
 */
export function pedirToken(silencioso: boolean): Promise<TokenGuardado> {
  const g = google()
  // Camino normal: la librería ya está, la ventana se abre en el mismo toque.
  if (g?.accounts?.oauth2) return solicitar(g, silencioso)
  return cargarGoogle().then(() => {
    const cargada = google()
    if (!cargada) throw new Error('La librería de Google no está disponible.')
    return solicitar(cargada, silencioso)
  })
}

/** Cierra la sesión: revoca el permiso y olvida el token. */
export async function cerrarSesionGoogle(): Promise<void> {
  const guardado = leerTokenGuardado()
  borrarToken()
  const g = google()
  if (guardado?.token && g) {
    await new Promise<void>((resolver) => g.accounts.oauth2.revoke(guardado.token, resolver))
  }
}
