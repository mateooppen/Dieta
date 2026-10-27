import { distanciaAlRango, estadoDelTotal, totalDelPlato } from './calculo.ts'
import { conPieza, lugarRequerido, lugaresVacios, piezasValidasParaLugar, rolPrincipal } from './lugares.ts'
import type { EntradaHistorial, Estado, Momento, MomentoId, Pieza, Plato } from './tipos.ts'

/** Función que devuelve un número al azar en [0, 1). Se inyecta para que las pruebas sean repetibles. */
export type Azar = () => number

export const INTENTOS = 50

/** Probabilidad de dejar vacío un lugar opcional en cada intento. */
const PROB_VACIO = 0.25

export interface Propuesta {
  plato: Plato
  total: number
  estado: Estado
}

function elegir<T>(lista: T[], azar: Azar): T {
  return lista[Math.min(lista.length - 1, Math.floor(azar() * lista.length))]
}

/** Ids de las piezas que aparecieron en las últimas entradas del historial para ese momento. */
export function idsRecientes(historial: EntradaHistorial[], momento: MomentoId, cantidad = 3): Set<string> {
  const ultimas = historial.filter((h) => h.momento === momento).slice(-cantidad)
  return new Set(ultimas.flatMap((h) => h.piezas.map((p) => p.id)))
}

function armarIntento(piezas: Pieza[], momento: Momento, evitar: Set<string>, azar: Azar): Plato | null {
  let plato: Plato = { momento: momento.id, lugares: lugaresVacios(momento.id) }
  const principalRol = rolPrincipal(momento.id)
  for (const lugar of plato.lugares) {
    let candidatas = piezasValidasParaLugar(piezas, lugar.rol, momento, plato)
    if (lugar.rol === principalRol) {
      const sinRecientes = candidatas.filter((p) => !evitar.has(p.id))
      if (sinRecientes.length > 0) candidatas = sinRecientes
    }
    // No repetir una pieza ya puesta en otro lugar del mismo plato.
    const usadas = new Set(plato.lugares.filter((l) => l.pieza).map((l) => l.pieza!.id))
    candidatas = candidatas.filter((p) => !usadas.has(p.id))
    const requerido = lugarRequerido(plato, lugar.rol)
    if (candidatas.length === 0) {
      if (requerido) return null
      continue
    }
    if (!requerido && azar() < PROB_VACIO) continue
    const elegida = elegir(candidatas, azar)
    plato = conPieza(plato, lugar.rol, elegida)
  }
  return plato
}

/**
 * Propone un plato al azar para el momento: hasta 50 intentos, se queda con el primero en rango;
 * si ninguno lo está, devuelve el más cercano al rango con su estado. Evita repetir el principal
 * de las últimas 3 entradas del historial para ese momento, si hay otras opciones.
 */
export function proponerPlato(
  piezas: Pieza[],
  momento: Momento,
  historial: EntradaHistorial[] = [],
  azar: Azar = Math.random,
): Propuesta | null {
  const evitar = idsRecientes(historial, momento.id)
  let mejor: Plato | null = null
  let mejorDistancia = Infinity
  for (let i = 0; i < INTENTOS; i++) {
    const plato = armarIntento(piezas, momento, evitar, azar)
    if (!plato) continue
    const total = totalDelPlato(plato)
    const distancia = distanciaAlRango(total, momento)
    if (distancia === 0) return { plato, total, estado: 'ok' }
    if (distancia < mejorDistancia) {
      mejor = plato
      mejorDistancia = distancia
    }
  }
  if (!mejor) return null
  const total = totalDelPlato(mejor)
  return { plato: mejor, total, estado: estadoDelTotal(total, momento) }
}
