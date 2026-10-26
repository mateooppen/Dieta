import type { Pieza, TipoPieza } from './tipos.ts'

/** Minúsculas y sin acentos, para que "Sándwich" encuentre "sandwich". */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

/** Piezas cuyo nombre contiene lo escrito. Con el texto vacío no devuelve nada. */
export function buscarPiezas(piezas: Pieza[], texto: string, excluirIds: Set<string> = new Set(), maximo = 6): Pieza[] {
  const q = normalizar(texto)
  if (!q) return []
  return piezas.filter((p) => !excluirIds.has(p.id) && normalizar(p.nombre).includes(q)).slice(0, maximo)
}

export type Filtro = 'todas' | TipoPieza | 'sin-validar'

export const FILTROS: { id: Filtro; nombre: string }[] = [
  { id: 'todas', nombre: 'Todas' },
  { id: 'principal', nombre: 'Principales' },
  { id: 'acompanamiento', nombre: 'Acompañamientos' },
  { id: 'desayuno_merienda', nombre: 'Desayuno / merienda' },
  { id: 'fruta', nombre: 'Frutas' },
  { id: 'bebida', nombre: 'Bebidas' },
  { id: 'extra', nombre: 'Extras' },
  { id: 'sin-validar', nombre: 'Sin validar' },
]

/** Lista de Mis piezas: filtro por tipo o sin validar, y búsqueda por nombre (vacía = todas). */
export function filtrarPiezas(piezas: Pieza[], filtro: Filtro, texto: string): Pieza[] {
  const q = normalizar(texto)
  return piezas
    .filter((p) => filtro === 'todas' || (filtro === 'sin-validar' ? !p.validada : p.tipo === filtro))
    .filter((p) => !q || normalizar(p.nombre).includes(q))
}

/** "96 piezas · 3 sin validar" */
export function resumenPiezas(piezas: Pieza[]): string {
  const sinValidar = piezas.filter((p) => !p.validada).length
  const n = piezas.length
  return `${n} ${n === 1 ? 'pieza' : 'piezas'} · ${sinValidar} sin validar`
}
