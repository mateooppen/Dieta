import type { Lugar, Momento, MomentoId, Pieza, Plato, Rol } from './tipos.ts'

/** Umbral que separa un acompañamiento con carbohidratos (más de 10) de una verdura (10 o menos). */
export const UMBRAL_VERDURA = 10

export const NOMBRE_ROL: Record<Rol, string> = {
  principal: 'Principal',
  acompanamiento: 'Acompañamiento',
  verdura: 'Verdura',
  postre: 'Postre',
  bebida: 'Bebida',
  solido: 'Para comer',
  segundo: 'Algo más',
  colacion: 'Colación',
}

/** Lugares vacíos que tiene un plato según el momento. */
export function lugaresVacios(momento: MomentoId): Lugar[] {
  const vacio = (rol: Rol, obligatorio: boolean): Lugar => ({ rol, obligatorio, pieza: null })
  switch (momento) {
    case 'almuerzo':
    case 'cena':
      return [vacio('principal', true), vacio('acompanamiento', false), vacio('verdura', false), vacio('postre', false)]
    case 'desayuno':
    case 'merienda':
      return [vacio('bebida', true), vacio('solido', true), vacio('segundo', false)]
    case 'colacion':
      return [vacio('colacion', true)]
  }
}

export function platoVacio(momento: MomentoId): Plato {
  return { momento, lugares: lugaresVacios(momento) }
}

/** El lugar cuya pieza se considera "el principal" del plato: el primer obligatorio que no es bebida. */
export function rolPrincipal(momento: MomentoId): Rol {
  return lugaresVacios(momento).find((l) => l.obligatorio && l.rol !== 'bebida')!.rol
}

/**
 * Piezas válidas para un lugar del plato en un momento dado. Solo piezas cuyos momentos incluyan el actual.
 * `principal` es la pieza actual del lugar principal (importa para el acompañamiento de almuerzo y cena).
 */
export function piezasValidasParaLugar(
  piezas: Pieza[],
  rol: Rol,
  momento: Momento,
  principal: Pieza | null = null,
): Pieza[] {
  const delMomento = piezas.filter((p) => p.momentos.includes(momento.id))
  switch (rol) {
    case 'principal':
      return delMomento.filter((p) => p.tipo === 'principal')
    case 'acompanamiento':
      if (principal?.traeCarbohidratos) return []
      return delMomento.filter((p) => p.tipo === 'acompanamiento' && p.carbohidratos > UMBRAL_VERDURA)
    case 'verdura':
      return delMomento.filter((p) => p.tipo === 'acompanamiento' && p.carbohidratos <= UMBRAL_VERDURA)
    case 'postre':
      return delMomento.filter((p) => p.tipo === 'fruta' || p.tipo === 'extra')
    case 'bebida':
      return delMomento.filter((p) => p.tipo === 'bebida')
    case 'solido':
    case 'segundo':
      return delMomento.filter((p) => p.tipo === 'desayuno_merienda' || p.tipo === 'fruta')
    case 'colacion':
      return delMomento.filter(
        (p) =>
          (p.tipo === 'fruta' || p.tipo === 'desayuno_merienda' || p.tipo === 'extra') &&
          p.carbohidratos >= momento.carbMin &&
          p.carbohidratos <= momento.carbMax,
      )
  }
}

export function piezaDelRol(plato: Plato, rol: Rol): Pieza | null {
  return plato.lugares.find((l) => l.rol === rol)?.pieza ?? null
}

/** Plato nuevo con la pieza cambiada en ese lugar. Si el principal pasa a traer carbohidratos, vacía el acompañamiento. */
export function conPieza(plato: Plato, rol: Rol, pieza: Pieza | null): Plato {
  const lugares = plato.lugares.map((l) => (l.rol === rol ? { ...l, pieza } : { ...l }))
  if (rol === 'principal' && pieza?.traeCarbohidratos) {
    for (const l of lugares) if (l.rol === 'acompanamiento') l.pieza = null
  }
  return { momento: plato.momento, lugares }
}
