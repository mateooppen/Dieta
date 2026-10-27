import { lugaresVacios, piezasValidasParaLugar } from '../logica/lugares.ts'
import { momentoPorId } from './piezas.ts'
import type { MomentoId, Pieza, Plato, Rol } from '../logica/tipos.ts'
import type { Deposito } from './almacen.ts'

/**
 * El plato que se está mostrando en Hoy, por momento, para el día de hoy.
 * Es estado del teléfono (no va a Drive): sirve para que al volver a abrir la app
 * siga el mismo plato y no uno al azar. Solo cambia con "Proponer otro plato" o al cambiar una pieza.
 */

export const CLAVE_PLATO_ACTUAL = 'dieta.plato-actual'

type PlatoGuardado = Partial<Record<Rol, string | null>>

interface Guardado {
  fecha: string
  platos: Partial<Record<MomentoId, PlatoGuardado>>
}

/** "2026-10-26" en hora local. */
export function fechaCorta(fecha: Date): string {
  const d = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  return `${fecha.getFullYear()}-${d(fecha.getMonth() + 1)}-${d(fecha.getDate())}`
}

function leer(deposito: Deposito | null, hoy: string): Guardado {
  try {
    const texto = deposito?.getItem(CLAVE_PLATO_ACTUAL)
    if (texto) {
      const datos = JSON.parse(texto) as Guardado
      if (datos && datos.fecha === hoy && typeof datos.platos === 'object') return datos
    }
  } catch {
    // Caché ilegible: se empieza de cero.
  }
  return { fecha: hoy, platos: {} }
}

/** Devuelve el plato guardado para ese momento y día, armado con las piezas actuales, o null si no hay. */
export function cargarPlatoActual(deposito: Deposito | null, momento: MomentoId, piezas: Pieza[], hoy: string): Plato | null {
  const guardado = leer(deposito, hoy).platos[momento]
  if (!guardado) return null
  const porId = new Map(piezas.map((p) => [p.id, p]))
  const lugares = lugaresVacios(momento).map((l) => {
    const id = guardado[l.rol]
    return { ...l, pieza: id ? (porId.get(id) ?? null) : null }
  })
  // Si una pieza obligatoria ya no existe, el plato guardado no sirve.
  if (lugares.some((l) => l.obligatorio && !l.pieza)) return null
  // Si alguna pieza ya no encaja en su lugar (por ejemplo, un plato armado con reglas anteriores), tampoco.
  const plato: Plato = { momento, lugares }
  const m = momentoPorId(momento)
  for (const l of lugares) {
    if (l.pieza && !piezasValidasParaLugar([l.pieza], l.rol, m, plato).length) return null
  }
  return plato
}

/** Guarda el plato mostrado para ese momento; si el día cambió, descarta los de ayer. */
export function guardarPlatoActual(deposito: Deposito | null, plato: Plato, hoy: string): void {
  const actual = leer(deposito, hoy)
  const ids: PlatoGuardado = {}
  for (const l of plato.lugares) ids[l.rol] = l.pieza ? l.pieza.id : null
  actual.platos[plato.momento] = ids
  try {
    deposito?.setItem(CLAVE_PLATO_ACTUAL, JSON.stringify(actual))
  } catch {
    // Sin espacio: la app sigue en memoria.
  }
}
