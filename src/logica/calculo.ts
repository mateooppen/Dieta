import type { Estado, Momento, Pieza, Plato } from './tipos.ts'

type Rango = Pick<Momento, 'carbMin' | 'carbMax'>

/** Total del plato: suma entera de los carbohidratos de las piezas presentes. */
export function totalDePiezas(piezas: (Pieza | null | undefined)[]): number {
  return piezas.reduce((suma, p) => suma + (p ? p.carbohidratos : 0), 0)
}

export function totalDelPlato(plato: Plato): number {
  return totalDePiezas(plato.lugares.map((l) => l.pieza))
}

/** `ok` dentro del rango, `over` por encima, `under` por debajo. */
export function estadoDelTotal(total: number, rango: Rango): Estado {
  if (total > rango.carbMax) return 'over'
  if (total < rango.carbMin) return 'under'
  return 'ok'
}

/** Cuánto le falta o sobra al total para entrar en el rango. 0 si ya está en rango. */
export function distanciaAlRango(total: number, rango: Rango): number {
  if (total > rango.carbMax) return total - rango.carbMax
  if (total < rango.carbMin) return rango.carbMin - total
  return 0
}

export const TEXTO_ESTADO: Record<Estado, string> = {
  ok: 'En rango',
  over: 'Por encima',
  under: 'Por debajo',
}

export function piezasDelPlato(plato: Plato): Pieza[] {
  return plato.lugares.map((l) => l.pieza).filter((p): p is Pieza => p !== null)
}
