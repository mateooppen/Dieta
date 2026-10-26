import type Anthropic from '@anthropic-ai/sdk'

/**
 * Acceso a la API de Anthropic directo desde el navegador con la clave del usuario.
 * La clave vive en dieta.json (Ajustes), nunca en el código.
 * La librería se carga recién cuando se usa, para que la app abra rápido.
 */

export const MODELO_IA = 'claude-haiku-5-5'

type ModuloAnthropic = typeof import('@anthropic-ai/sdk')

let modulo: Promise<ModuloAnthropic> | null = null

function cargarAnthropic(): Promise<ModuloAnthropic> {
  modulo ??= import('@anthropic-ai/sdk')
  return modulo
}

export async function clienteIA(clave: string): Promise<Anthropic> {
  const { default: Anthropic } = await cargarAnthropic()
  // dangerouslyAllowBrowser manda el header anthropic-dangerous-direct-browser-access: app de un solo usuario con su propia clave.
  return new Anthropic({ apiKey: clave, dangerouslyAllowBrowser: true, maxRetries: 1 })
}

/** Traduce un error de la API a una frase corta para mostrar. */
export async function mensajeDeErrorIA(e: unknown): Promise<string> {
  const { default: Anthropic } = await cargarAnthropic()
  if (e instanceof Anthropic.AuthenticationError) return 'La clave no es válida.'
  if (e instanceof Anthropic.PermissionDeniedError) return 'La clave no tiene permiso para usar la API.'
  if (e instanceof Anthropic.RateLimitError) return 'Demasiadas consultas seguidas. Probá en un rato.'
  // Con una clave inválida el navegador no deja leer la respuesta y la librería lo ve como un error de conexión.
  if (e instanceof Anthropic.APIConnectionError) {
    return typeof navigator !== 'undefined' && navigator.onLine === false ? 'No hay internet.' : 'La clave no es válida, o no hay conexión.'
  }
  if (e instanceof Anthropic.APIError) return `La API respondió con un error (${e.status ?? '?'}).`
  return e instanceof Error ? e.message : 'Error desconocido.'
}

/** "Probar" en Ajustes: pide la lista de modelos, que es la consulta más barata posible. */
export async function probarClave(clave: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (clave.trim() === '') return { ok: false, error: 'Pegá la clave primero.' }
  try {
    const cliente = await clienteIA(clave.trim())
    await cliente.models.list({ limit: 1 })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: await mensajeDeErrorIA(e) }
  }
}
