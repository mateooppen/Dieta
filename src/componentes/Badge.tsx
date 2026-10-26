import './Badge.css'
import type { Badge as DatosBadge } from '../logica/marcas.ts'

/** Marca de una pieza: Fibra, Grasa, Meal prep o Sin validar. Siempre con la palabra completa. */
export function Badge({ texto, tono }: DatosBadge) {
  return <span class={`badge badge--${tono} label`}>{texto}</span>
}
