import base from './piezas.json'
import type { Momento, MomentoId, Pieza, TipoPieza } from '../logica/tipos.ts'

/** Fecha en que se generó la tabla base; sirve de `creadaEl` para las piezas iniciales. */
export const FECHA_BASE: string = base.generado

export const MOMENTOS: Momento[] = base.momentos as Momento[]

export const TIPOS: { id: TipoPieza; nombre: string; descripcion: string }[] = base.tipos as {
  id: TipoPieza
  nombre: string
  descripcion: string
}[]

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
