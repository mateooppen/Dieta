import { normalizar } from './busqueda.ts'
import { crearPieza } from './edicion.ts'
import type { Momento, MomentoId, Pieza, TipoPieza } from './tipos.ts'

/**
 * Estimación de carbohidratos con IA: todo lo que no es la llamada en sí.
 * Funciones puras para poder probarlas sin internet.
 */

export interface Estimacion {
  carbohidratos: number
  rangoMin: number
  rangoMax: number
  altaFibra: boolean
  altaGrasa: boolean
  porcion: string
  explicacion: string
  nombreSugerido: string
}

/** Forma exacta que se le pide al modelo (JSON estricto). */
export const ESQUEMA_ESTIMACION = {
  type: 'object',
  properties: {
    carbohidratos: { type: 'integer', description: 'Gramos de carbohidratos de la porción descripta, sin restar la fibra.' },
    rangoMin: { type: 'integer', description: 'Límite bajo probable, en gramos.' },
    rangoMax: { type: 'integer', description: 'Límite alto probable, en gramos.' },
    altaFibra: { type: 'boolean' },
    altaGrasa: { type: 'boolean' },
    porcion: { type: 'string', description: 'Porción casera, corta. Ej: "2 porciones", "1 plato hondo".' },
    explicacion: { type: 'string', description: 'Una o dos oraciones en español rioplatense: de dónde salen los carbohidratos.' },
    nombreSugerido: { type: 'string', description: 'Nombre de la comida como se dice en la mesa, sin la cantidad.' },
  },
  required: ['carbohidratos', 'rangoMin', 'rangoMax', 'altaFibra', 'altaGrasa', 'porcion', 'explicacion', 'nombreSugerido'],
  additionalProperties: false,
} as const

const PALABRAS_VACIAS = new Set(['con', 'sin', 'del', 'las', 'los', 'una', 'uno', 'unos', 'unas', 'para', 'por', 'que', 'mas', 'porcion', 'porciones', 'plato', 'taza', 'vaso'])

function palabras(texto: string): string[] {
  return normalizar(texto)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 3 && !PALABRAS_VACIAS.has(p))
}

/** Raíz corta para que "tartas" y "tarta", o "fideos" y "fideo", se reconozcan. */
function raiz(p: string): string {
  return p.length > 4 ? p.replace(/(es|s)$/, '') : p
}

/** Las piezas con más palabras en común con la descripción, como referencia de escala para el modelo. */
export function piezasParecidas(piezas: Pieza[], descripcion: string, maximo = 8): Pieza[] {
  const buscadas = new Set(palabras(descripcion).map(raiz))
  if (buscadas.size === 0) return []
  return piezas
    .map((p, i) => ({ p, i, puntos: new Set(palabras(p.nombre).map(raiz).filter((w) => buscadas.has(w))).size }))
    .filter((x) => x.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos || a.i - b.i)
    .slice(0, maximo)
    .map((x) => x.p)
}

export const SISTEMA_ESTIMACION =
  'Sos un asistente que estima gramos de carbohidratos de comidas caseras argentinas para una persona que cuenta carbohidratos. ' +
  'Solo contás carbohidratos: nunca sugerís dosis de insulina ni das consejos médicos. ' +
  'Usá las piezas de referencia para mantener la misma escala de porciones. ' +
  'Si la descripción es ambigua, suponé la porción más común y abrí el rango. ' +
  'Marcá altaGrasa si la grasa puede demorar la subida de glucosa (frituras, quesos, masas con manteca), y altaFibra si tiene mucha fibra (legumbres, integrales, verduras en cantidad).'

/** El mensaje del usuario para el modelo: descripción, momento, rango y piezas parecidas. */
export function armarConsulta(descripcion: string, momento: Momento, parecidas: Pieza[]): string {
  const referencia =
    parecidas.length === 0
      ? 'No hay piezas parecidas en la lista.'
      : parecidas.map((p) => `- ${p.nombre} (${p.porcion || 'porción sin indicar'}): ${p.carbohidratos} g`).join('\n')
  return [
    `Comida: ${descripcion.trim()}`,
    `Momento del día: ${momento.nombre} (rango habitual ${momento.carbMin}–${momento.carbMax} g de carbohidratos).`,
    '',
    'Piezas parecidas de su lista, como referencia de escala:',
    referencia,
    '',
    'Respondé solo con el JSON pedido.',
  ].join('\n')
}

export type ResultadoInterpretacion = { ok: true; estimacion: Estimacion } | { ok: false; error: string }

function entero(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.round(n)) : null
}

function texto(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

/** Lee la respuesta del modelo. Tolera texto o ```json alrededor; exige los números. Ordena el rango si viene mal. */
export function interpretarRespuesta(respuesta: string): ResultadoInterpretacion {
  const inicio = respuesta.indexOf('{')
  const fin = respuesta.lastIndexOf('}')
  if (inicio < 0 || fin <= inicio) return { ok: false, error: 'La respuesta no trae JSON.' }
  let datos: Record<string, unknown>
  try {
    datos = JSON.parse(respuesta.slice(inicio, fin + 1)) as Record<string, unknown>
  } catch {
    return { ok: false, error: 'La respuesta no es JSON válido.' }
  }
  if (typeof datos !== 'object' || datos === null) return { ok: false, error: 'La respuesta no es un objeto.' }
  const carbohidratos = entero(datos.carbohidratos)
  if (carbohidratos === null) return { ok: false, error: 'La respuesta no trae los carbohidratos.' }
  const a = entero(datos.rangoMin) ?? carbohidratos
  const b = entero(datos.rangoMax) ?? carbohidratos
  return {
    ok: true,
    estimacion: {
      carbohidratos,
      rangoMin: Math.min(a, b, carbohidratos),
      rangoMax: Math.max(a, b, carbohidratos),
      altaFibra: datos.altaFibra === true,
      altaGrasa: datos.altaGrasa === true,
      porcion: texto(datos.porcion),
      explicacion: texto(datos.explicacion),
      nombreSugerido: texto(datos.nombreSugerido),
    },
  }
}

/** Tipo de la pieza nueva según el momento: comida entera al mediodía y a la noche, y así. */
export function tipoParaMomento(m: MomentoId): TipoPieza {
  if (m === 'almuerzo' || m === 'cena') return 'principal'
  if (m === 'colacion') return 'extra'
  return 'desayuno_merienda'
}

/** "26/10/2026" */
export function fechaCortaNota(fecha: Date): string {
  const d = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  return `${d(fecha.getDate())}/${d(fecha.getMonth() + 1)}/${fecha.getFullYear()}`
}

/**
 * La pieza que nace de una estimación: sin validar, con la nota de la fecha,
 * para el momento en que se estimó. Si es la comida entera del almuerzo o la cena, ya trae sus carbohidratos.
 */
export function piezaDesdeEstimacion(
  est: Estimacion,
  carbohidratos: number,
  descripcion: string,
  momento: MomentoId,
  existentes: Pieza[],
  ahora: Date,
  creadaEl: string,
): Pieza {
  const tipo = tipoParaMomento(momento)
  return crearPieza(
    {
      nombre: est.nombreSugerido || descripcion.trim().slice(0, 60) || 'Comida estimada',
      porcion: est.porcion,
      carbohidratos: Math.max(0, Math.round(carbohidratos)),
      tipo,
      momentos: [momento],
      mealPrep: false,
      traeCarbohidratos: tipo === 'principal',
      uso: 'sola',
      altaFibra: est.altaFibra,
      altaGrasa: est.altaGrasa,
      nota: `Estimada con IA el ${fechaCortaNota(ahora)}`,
      validada: false,
    },
    existentes,
    creadaEl,
    'ia',
  )
}

/** Pieza de un solo uso para sumar a "lo que voy a comer" sin guardarla en la lista. */
export function piezaTemporal(est: Estimacion, carbohidratos: number, descripcion: string, momento: MomentoId, creadaEl: string): Pieza {
  return {
    id: `temporal-${creadaEl}`,
    nombre: est.nombreSugerido || descripcion.trim().slice(0, 60) || 'Comida estimada',
    tipo: tipoParaMomento(momento),
    porcion: est.porcion,
    carbohidratos: Math.max(0, Math.round(carbohidratos)),
    momentos: [momento],
    mealPrep: false,
    traeCarbohidratos: false,
    uso: 'sola',
    altaFibra: est.altaFibra,
    altaGrasa: est.altaGrasa,
    nota: '',
    origen: 'ia',
    validada: false,
    creadaEl,
  }
}
