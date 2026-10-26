import type { Pieza } from './tipos.ts'

export interface Badge {
  texto: string
  tono: 'fibra' | 'grasa' | 'neutro' | 'ambar'
}

/** Badges de una pieza: Fibra, Grasa, Meal prep y Sin validar (ámbar). Siempre la palabra completa. */
export function badgesDePieza(p: Pieza): Badge[] {
  const lista: Badge[] = []
  if (p.altaFibra) lista.push({ texto: 'Fibra', tono: 'fibra' })
  if (p.altaGrasa) lista.push({ texto: 'Grasa', tono: 'grasa' })
  if (p.mealPrep) lista.push({ texto: 'Meal prep', tono: 'neutro' })
  if (!p.validada) lista.push({ texto: 'Sin validar', tono: 'ambar' })
  return lista
}

export const SIN_PREPARACION = 'Nada que preparar de antes.'

/** "Para tener a mano": las notas de las piezas del plato que las tengan, unidas. */
export function paraTenerAMano(piezas: (Pieza | null)[]): string {
  const notas = piezas.filter((p): p is Pieza => !!p && p.nota.trim() !== '').map((p) => p.nota.trim())
  return notas.length ? notas.join(' ') : SIN_PREPARACION
}

/** Texto de carbohidratos con la unidad: "52 g". */
export function textoCarbohidratos(gramos: number): string {
  return `${gramos} g`
}
