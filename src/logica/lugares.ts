import { normalizar } from './busqueda.ts'
import type { Lugar, Momento, MomentoId, Pieza, Plato, Rol, UsoPieza } from './tipos.ts'

/** Umbral que separa un acompañamiento con carbohidratos (más de 10) de una verdura (10 o menos). */
export const UMBRAL_VERDURA = 10

export const NOMBRE_ROL: Record<Rol, string> = {
  principal: 'Principal',
  acompanamiento: 'Acompañamiento',
  verdura: 'Verdura',
  postre: 'Postre',
  bebida: 'Bebida',
  conBebida: 'En la bebida',
  solido: 'Para comer',
  segundo: 'Para acompañar',
  colacion: 'Colación',
}

/** Cómo se dice un lugar vacío: "Sin postre", "Nada en la bebida". */
export function textoVacio(rol: Rol): string {
  if (rol === 'conBebida') return 'Nada en la bebida'
  if (rol === 'segundo') return 'Nada para acompañar'
  if (rol === 'solido') return 'Nada para comer'
  return `Sin ${NOMBRE_ROL[rol].toLowerCase()}`
}

/** Título de la hoja para cambiar un lugar: "Cambiar postre", "Agregar a la bebida". */
export function tituloCambiar(rol: Rol): string {
  if (rol === 'conBebida') return 'Agregar a la bebida'
  if (rol === 'segundo') return 'Cambiar lo que acompaña'
  if (rol === 'solido') return 'Cambiar qué comer'
  return `Cambiar ${NOMBRE_ROL[rol].toLowerCase()}`
}

/** Si una fila se muestra: la de la leche solo aparece cuando la bebida la admite (café, té, mate cocido). */
export function lugarVisible(plato: Plato, lugar: Lugar): boolean {
  return lugar.rol !== 'conBebida' || lugar.pieza !== null || admiteLeche(piezaDelRol(plato, 'bebida'))
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
      return [vacio('bebida', true), vacio('conBebida', false), vacio('solido', true), vacio('segundo', false)]
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

export function piezaDelRol(plato: Plato | null, rol: Rol): Pieza | null {
  return plato?.lugares.find((l) => l.rol === rol)?.pieza ?? null
}

/** Clase de desayuno/merienda de una pieza. La fruta y los demás tipos cuentan como "se come sola". */
function usoDe(p: Pieza): UsoPieza {
  return p.tipo === 'desayuno_merienda' ? p.uso : 'sola'
}

const esDesayuno = (p: Pieza) => p.tipo === 'desayuno_merienda'

/** Bebidas a las que tiene sentido agregarles leche: café, té o mate cocido. */
export function admiteLeche(bebida: Pieza | null): boolean {
  if (!bebida) return false
  const palabras = normalizar(bebida.nombre).split(/[^a-z]+/)
  return palabras.includes('cafe') || palabras.includes('te') || palabras.includes('cocido')
}

/** Lo que puede ir en "Para comer": una base, algo que se come solo, un yogur, la avena o una fruta. */
export function encajaParaComer(p: Pieza): boolean {
  if (p.tipo === 'fruta') return true
  return esDesayuno(p) && ['base', 'sola', 'lacteo', 'con-lacteo'].includes(p.uso)
}

/**
 * Lo que puede ir en "Para acompañar", según lo que hay para comer:
 * con pan o galletitas, algo para poner encima; con avena, yogur o leche;
 * con una fruta, un yogur o algo que se come solo; con algo que se come solo, una fruta.
 */
export function encajaParaAcompanar(paraComer: Pieza | null, p: Pieza): boolean {
  if (!paraComer) return false
  if (paraComer.tipo === 'fruta') return esDesayuno(p) && (p.uso === 'sola' || p.uso === 'lacteo')
  switch (usoDe(paraComer)) {
    case 'base':
      return esDesayuno(p) && p.uso === 'encima'
    case 'con-lacteo':
      return esDesayuno(p) && (p.uso === 'lacteo' || p.uso === 'en-bebida')
    case 'sola':
    case 'lacteo':
      return p.tipo === 'fruta'
    default:
      return false
  }
}

/** Un lugar opcional pasa a ser obligatorio cuando lo de al lado lo necesita: la avena no va sola. */
export function lugarRequerido(plato: Plato, rol: Rol): boolean {
  const lugar = plato.lugares.find((l) => l.rol === rol)
  if (!lugar) return false
  if (lugar.obligatorio) return true
  const paraComer = piezaDelRol(plato, 'solido')
  return rol === 'segundo' && paraComer !== null && usoDe(paraComer) === 'con-lacteo'
}

/** Si el plato tiene todo lo obligatorio elegido (incluido lo que pasa a ser obligatorio, como el yogur o la leche de la avena). */
export function platoCompleto(plato: Plato): boolean {
  return plato.lugares.every((l) => l.pieza !== null || !lugarRequerido(plato, l.rol))
}

/** Lo que se agrega a la bebida (la leche), solo si la bebida es café, té o mate cocido. */
export function encajaEnBebida(bebida: Pieza | null, p: Pieza): boolean {
  return admiteLeche(bebida) && esDesayuno(p) && p.uso === 'en-bebida'
}

/**
 * Piezas válidas para un lugar del plato en un momento dado. Solo piezas cuyos momentos incluyan el actual.
 * `plato` es el plato actual: importa lo que ya hay en otros lugares (el principal, la bebida, lo que hay para comer).
 */
export function piezasValidasParaLugar(piezas: Pieza[], rol: Rol, momento: Momento, plato: Plato | null = null): Pieza[] {
  const delMomento = piezas.filter((p) => p.momentos.includes(momento.id))
  switch (rol) {
    case 'principal':
      return delMomento.filter((p) => p.tipo === 'principal')
    case 'acompanamiento':
      if (piezaDelRol(plato, 'principal')?.traeCarbohidratos) return []
      return delMomento.filter((p) => p.tipo === 'acompanamiento' && p.carbohidratos > UMBRAL_VERDURA)
    case 'verdura':
      return delMomento.filter((p) => p.tipo === 'acompanamiento' && p.carbohidratos <= UMBRAL_VERDURA)
    case 'postre':
      return delMomento.filter((p) => p.tipo === 'fruta' || p.tipo === 'extra')
    case 'bebida':
      return delMomento.filter((p) => p.tipo === 'bebida')
    case 'conBebida':
      return delMomento.filter((p) => encajaEnBebida(piezaDelRol(plato, 'bebida'), p))
    case 'solido':
      return delMomento.filter(encajaParaComer)
    case 'segundo':
      return delMomento.filter((p) => encajaParaAcompanar(piezaDelRol(plato, 'solido'), p))
    case 'colacion':
      return delMomento.filter(
        (p) =>
          (p.tipo === 'fruta' || p.tipo === 'extra' || (esDesayuno(p) && (p.uso === 'base' || p.uso === 'sola' || p.uso === 'lacteo'))) &&
          p.carbohidratos >= momento.carbMin &&
          p.carbohidratos <= momento.carbMax,
      )
  }
}

/**
 * Plato nuevo con la pieza cambiada en ese lugar. Lo que deja de tener sentido se vacía:
 * el acompañamiento si el principal trae carbohidratos, la leche si la bebida no la admite,
 * y "Para acompañar" si ya no combina con lo que hay para comer.
 */
export function conPieza(plato: Plato, rol: Rol, pieza: Pieza | null): Plato {
  const lugares = plato.lugares.map((l) => (l.rol === rol ? { ...l, pieza } : { ...l }))
  for (const l of lugares) {
    const actual = l.pieza
    if (!actual) continue
    if (rol === 'principal' && l.rol === 'acompanamiento' && pieza?.traeCarbohidratos) l.pieza = null
    if (rol === 'bebida' && l.rol === 'conBebida' && !encajaEnBebida(pieza, actual)) l.pieza = null
    if (rol === 'solido' && l.rol === 'segundo' && !encajaParaAcompanar(pieza, actual)) l.pieza = null
  }
  return { momento: plato.momento, lugares }
}
