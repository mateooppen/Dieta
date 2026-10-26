import { PIEZAS_BASE } from '../datos/piezas.ts'
import type { Ajustes, Dieta, EntradaHistorial, MomentoId, Pieza, TipoPieza } from './tipos.ts'

export const VERSION_DIETA = 1

const MOMENTOS_VALIDOS: MomentoId[] = ['desayuno', 'almuerzo', 'merienda', 'cena', 'colacion']
const TIPOS_VALIDOS: TipoPieza[] = ['principal', 'acompanamiento', 'desayuno_merienda', 'fruta', 'bebida', 'extra']

export const AJUSTES_INICIALES: Ajustes = { tema: 'sistema', claveIA: '' }

function copiarPieza(p: Pieza): Pieza {
  return { ...p, momentos: [...p.momentos] }
}

/** Primer inicio: dieta.json nace de las piezas base. */
export function crearDietaInicial(): Dieta {
  return {
    version: VERSION_DIETA,
    piezas: PIEZAS_BASE.map(copiarPieza),
    historial: [],
    ajustes: { ...AJUSTES_INICIALES },
    piezasBaseEliminadas: [],
  }
}

/** Agrega a la dieta las piezas base que falten por id, sin tocar las existentes ni resucitar las que el usuario eliminó. */
export function agregarPiezasNuevas(dieta: Dieta, base: Pieza[] = PIEZAS_BASE): { dieta: Dieta; agregadas: number } {
  const existentes = new Set(dieta.piezas.map((p) => p.id))
  const eliminadas = new Set(dieta.piezasBaseEliminadas)
  const nuevas = base.filter((p) => !existentes.has(p.id) && !eliminadas.has(p.id)).map(copiarPieza)
  if (nuevas.length === 0) return { dieta, agregadas: 0 }
  return { dieta: { ...dieta, piezas: [...dieta.piezas, ...nuevas] }, agregadas: nuevas.length }
}

export type ResultadoImportacion = { ok: true; dieta: Dieta } | { ok: false; error: string }

function esObjeto(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function validarPieza(x: unknown, indice: number): Pieza | string {
  if (!esObjeto(x)) return `La pieza ${indice + 1} no tiene la forma esperada.`
  if (typeof x.id !== 'string' || x.id === '') return `La pieza ${indice + 1} no tiene id.`
  if (typeof x.nombre !== 'string' || x.nombre.trim() === '') return `La pieza "${x.id}" no tiene nombre.`
  if (!TIPOS_VALIDOS.includes(x.tipo as TipoPieza)) return `La pieza "${x.id}" tiene un tipo desconocido.`
  if (typeof x.carbohidratos !== 'number' || !Number.isInteger(x.carbohidratos) || x.carbohidratos < 0)
    return `La pieza "${x.id}" tiene carbohidratos inválidos.`
  if (!Array.isArray(x.momentos) || !x.momentos.every((m) => MOMENTOS_VALIDOS.includes(m as MomentoId)))
    return `La pieza "${x.id}" tiene momentos inválidos.`
  return {
    id: x.id,
    nombre: x.nombre,
    tipo: x.tipo as TipoPieza,
    porcion: typeof x.porcion === 'string' ? x.porcion : '',
    carbohidratos: x.carbohidratos,
    momentos: x.momentos as MomentoId[],
    mealPrep: x.mealPrep === true,
    traeCarbohidratos: x.traeCarbohidratos === true,
    altaFibra: x.altaFibra === true,
    altaGrasa: x.altaGrasa === true,
    nota: typeof x.nota === 'string' ? x.nota : '',
    origen: typeof x.origen === 'string' ? x.origen : 'importada',
    validada: x.validada === true,
    creadaEl: typeof x.creadaEl === 'string' ? x.creadaEl : '',
  }
}

function validarEntrada(x: unknown, indice: number): EntradaHistorial | string {
  const n = indice + 1
  if (!esObjeto(x)) return `La entrada ${n} del historial no tiene la forma esperada.`
  if (typeof x.fecha !== 'string') return `La entrada ${n} del historial no tiene fecha.`
  if (!MOMENTOS_VALIDOS.includes(x.momento as MomentoId)) return `La entrada ${n} del historial tiene un momento inválido.`
  if (!Array.isArray(x.piezas)) return `La entrada ${n} del historial no tiene piezas.`
  const piezas: EntradaHistorial['piezas'] = []
  for (const p of x.piezas) {
    if (!esObjeto(p) || typeof p.id !== 'string' || typeof p.nombre !== 'string' || typeof p.carbohidratos !== 'number')
      return `La entrada ${n} del historial tiene piezas inválidas.`
    piezas.push({ id: p.id, nombre: p.nombre, carbohidratos: p.carbohidratos })
  }
  const total = typeof x.total === 'number' ? x.total : piezas.reduce((s, p) => s + p.carbohidratos, 0)
  const origen = x.origen === 'otra-comida' ? 'otra-comida' : 'propuesta'
  return { fecha: x.fecha, momento: x.momento as MomentoId, piezas, total, origen }
}

/** Valida el contenido de un dieta.json (texto u objeto) y lo normaliza. Nunca lanza: devuelve ok o un error legible. */
export function importarDieta(entrada: unknown): ResultadoImportacion {
  let datos: unknown = entrada
  if (typeof entrada === 'string') {
    try {
      datos = JSON.parse(entrada)
    } catch {
      return { ok: false, error: 'El archivo no es un JSON válido.' }
    }
  }
  if (!esObjeto(datos)) return { ok: false, error: 'El archivo no tiene la forma de un respaldo de Dieta.' }
  if (!Array.isArray(datos.piezas)) return { ok: false, error: 'El respaldo no tiene la lista de piezas.' }

  const piezas: Pieza[] = []
  const ids = new Set<string>()
  for (const [i, x] of datos.piezas.entries()) {
    const r = validarPieza(x, i)
    if (typeof r === 'string') return { ok: false, error: r }
    if (ids.has(r.id)) return { ok: false, error: `Hay dos piezas con el id "${r.id}".` }
    ids.add(r.id)
    piezas.push(r)
  }

  const historial: EntradaHistorial[] = []
  const listaHistorial = Array.isArray(datos.historial) ? datos.historial : []
  for (const [i, x] of listaHistorial.entries()) {
    const r = validarEntrada(x, i)
    if (typeof r === 'string') return { ok: false, error: r }
    historial.push(r)
  }

  const a = esObjeto(datos.ajustes) ? datos.ajustes : {}
  const tema = a.tema === 'claro' || a.tema === 'oscuro' ? a.tema : 'sistema'
  const ajustes: Ajustes = { tema, claveIA: typeof a.claveIA === 'string' ? a.claveIA : '' }

  const piezasBaseEliminadas = Array.isArray(datos.piezasBaseEliminadas)
    ? datos.piezasBaseEliminadas.filter((x): x is string => typeof x === 'string')
    : []

  return { ok: true, dieta: { version: VERSION_DIETA, piezas, historial, ajustes, piezasBaseEliminadas } }
}
