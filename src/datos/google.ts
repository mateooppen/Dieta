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
    }
  }
}

function google(): GoogleGlobal | undefined {
  return (globalThis as { google?: GoogleGlobal }).google
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
 * Pide un token. Con `silencioso` intenta renovarlo sin molestar; si Google necesita que el usuario
 * toque algo, falla y hay que volver a llamar sin `silencioso` desde un toque del usuario.
 */
export async function pedirToken(silencioso: boolean): Promise<TokenGuardado> {
  await cargarGoogle()
  const g = google()
  if (!g) throw new Error('La librería de Google no está disponible.')
  return new Promise((resolver, rechazar) => {
    const cliente = g.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: ALCANCE,
      callback: (r) => {
        if (r.access_token && r.expires_in) resolver(guardarToken(r.access_token, r.expires_in))
        else rechazar(new Error(r.error_description || r.error || 'Google no devolvió un permiso.'))
      },
      error_callback: (e) => rechazar(new Error(e.message || e.type || 'Se canceló el ingreso con Google.')),
    })
    cliente.requestAccessToken({ prompt: silencioso ? '' : 'select_account' })
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
