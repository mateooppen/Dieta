/** Lectura y escritura de dieta.json en la carpeta privada de la app (appDataFolder) en Google Drive. */

export const NOMBRE_ARCHIVO = 'dieta.json'

const API = 'https://www.googleapis.com/drive/v3/files'
const SUBIDA = 'https://www.googleapis.com/upload/drive/v3/files'

export class ErrorDrive extends Error {
  estado: number
  constructor(mensaje: string, estado: number) {
    super(mensaje)
    this.estado = estado
  }
  /** 401: el token venció o fue revocado; hay que volver a entrar. */
  get sesionVencida(): boolean {
    return this.estado === 401
  }
  /** 429 y 5xx se arreglan reintentando más tarde. */
  get temporal(): boolean {
    return this.estado === 429 || this.estado >= 500
  }
}

async function pedir(token: string, url: string, opciones: RequestInit = {}): Promise<Response> {
  const respuesta = await fetch(url, {
    ...opciones,
    headers: { ...(opciones.headers as Record<string, string>), Authorization: `Bearer ${token}` },
  })
  if (!respuesta.ok) {
    let detalle = ''
    try {
      const cuerpo = await respuesta.json()
      detalle = cuerpo?.error?.message ?? ''
    } catch {
      // Sin detalle.
    }
    throw new ErrorDrive(`Drive respondió ${respuesta.status}${detalle ? `: ${detalle}` : ''}`, respuesta.status)
  }
  return respuesta
}

/** Id del archivo dieta.json en la carpeta privada, o null si todavía no existe. */
export async function buscarArchivo(token: string): Promise<string | null> {
  const q = encodeURIComponent(`name='${NOMBRE_ARCHIVO}'`)
  const r = await pedir(token, `${API}?spaces=appDataFolder&q=${q}&fields=files(id)`)
  const datos = (await r.json()) as { files?: { id: string }[] }
  return datos.files?.[0]?.id ?? null
}

/** Contenido del archivo como texto. */
export async function leerArchivo(token: string, id: string): Promise<string> {
  const r = await pedir(token, `${API}/${id}?alt=media`)
  return r.text()
}

/** Crea dieta.json en la carpeta privada y devuelve su id. */
export async function crearArchivo(token: string, contenido: string): Promise<string> {
  const meta = { name: NOMBRE_ARCHIVO, parents: ['appDataFolder'] }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }))
  form.append('file', new Blob([contenido], { type: 'application/json' }))
  const r = await pedir(token, `${SUBIDA}?uploadType=multipart&fields=id`, { method: 'POST', body: form })
  const datos = (await r.json()) as { id: string }
  return datos.id
}

/** Reemplaza el contenido del archivo. */
export async function actualizarArchivo(token: string, id: string, contenido: string): Promise<void> {
  await pedir(token, `${SUBIDA}/${id}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: contenido,
  })
}
