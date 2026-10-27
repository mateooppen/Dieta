import { estadoDelTotal, totalDelPlato } from './calculo.ts'
import { conPieza, textoVacio, lugarRequerido, piezasValidasParaLugar } from './lugares.ts'
import type { Estado, Momento, Pieza, Plato, Rol } from './tipos.ts'

export interface Alternativa {
  /** `null` representa "Sin <rol>": dejar el lugar vacío. */
  pieza: Pieza | null
  nombre: string
  totalNuevo: number
  estado: Estado
}

/**
 * Todas las piezas válidas para un lugar, menos la actual, con el total que tendría el plato y su estado,
 * ordenadas por cercanía en carbohidratos a la pieza actual. En lugares opcionales la primera es "Sin <rol>".
 */
export function alternativasParaLugar(plato: Plato, rol: Rol, piezas: Pieza[], momento: Momento): Alternativa[] {
  const lugar = plato.lugares.find((l) => l.rol === rol)
  if (!lugar) return []
  const actual = lugar.pieza
  const carbActual = actual ? actual.carbohidratos : 0
  const usadas = new Set(plato.lugares.filter((l) => l.pieza && l.rol !== rol).map((l) => l.pieza!.id))

  const evaluar = (pieza: Pieza | null): Alternativa => {
    const totalNuevo = totalDelPlato(conPieza(plato, rol, pieza))
    return {
      pieza,
      nombre: pieza ? pieza.nombre : textoVacio(rol),
      totalNuevo,
      estado: estadoDelTotal(totalNuevo, momento),
    }
  }

  const lista = piezasValidasParaLugar(piezas, rol, momento, plato)
    .filter((p) => p.id !== actual?.id && !usadas.has(p.id))
    .map((p) => ({ alt: evaluar(p), distancia: Math.abs(p.carbohidratos - carbActual) }))
    .sort((a, b) => a.distancia - b.distancia || a.alt.nombre.localeCompare(b.alt.nombre, 'es'))
    .map((x) => x.alt)

  if (!lugarRequerido(plato, rol)) lista.unshift(evaluar(null))
  return lista
}
