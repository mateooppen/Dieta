import base from './piezas.json'
import type { Momento, MomentoId, Pieza, TipoPieza, UsoPieza } from '../logica/tipos.ts'

/** Fecha en que se generó la tabla base; sirve de `creadaEl` para las piezas iniciales. */
export const FECHA_BASE: string = base.generado

export const MOMENTOS: Momento[] = base.momentos as Momento[]

export const TIPOS: { id: TipoPieza; nombre: string; descripcion: string }[] = base.tipos as {
  id: TipoPieza
  nombre: string
  descripcion: string
}[]

/**
 * Cómo se come cada pieza base de desayuno/merienda (acordado con Mateo el 2026-10-27).
 * Las que no figuran acá se comen solas.
 */
export const USO_BASE: Record<string, UsoPieza> = {
  'pan-lactal-blanco': 'base',
  'pan-lactal-integral': 'base',
  'pan-frances-mignon': 'base',
  'galletitas-de-agua': 'base',
  'galletita-de-arroz': 'base',
  'queso-untable': 'encima',
  'queso-fresco-port-salut-cremoso': 'encima',
  'jamon-cocido': 'encima',
  manteca: 'encima',
  'mermelada-comun': 'encima',
  'mermelada-light': 'encima',
  'dulce-de-leche': 'encima',
  palta: 'encima',
  'yogur-natural-o-sin-azucar': 'lacteo',
  'yogur-con-sabor-comun': 'lacteo',
  'avena-arrollada': 'con-lacteo',
  'leche-descremada': 'en-bebida',
}

/** La clase de una pieza: la acordada si es de la tabla base, o "se come sola". */
export function usoPorDefecto(id: string): UsoPieza {
  return USO_BASE[id] ?? 'sola'
}

/** Las 96 piezas iniciales, ya con `validada: true` y `creadaEl`. */
export const PIEZAS_BASE: Pieza[] = base.piezas.map((p) => ({
  id: p.id,
  nombre: p.nombre,
  tipo: p.tipo as TipoPieza,
  porcion: p.porcion,
  carbohidratos: p.carbohidratos,
  momentos: p.momentos as MomentoId[],
  mealPrep: p.mealPrep,
  traeCarbohidratos: p.traeCarbohidratos,
  uso: usoPorDefecto(p.id),
  altaFibra: p.altaFibra,
  altaGrasa: p.altaGrasa,
  nota: p.nota ?? '',
  origen: p.origen,
  validada: true,
  creadaEl: FECHA_BASE,
}))

export function momentoPorId(id: MomentoId): Momento {
  const m = MOMENTOS.find((x) => x.id === id)
  if (!m) throw new Error(`Momento desconocido: ${id}`)
  return m
}
