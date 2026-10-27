/** Tipos del modelo de datos. Espejan la forma de piezas.json y de dieta.json (Drive). */

export type MomentoId = 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'colacion'

export type TipoPieza = 'principal' | 'acompanamiento' | 'desayuno_merienda' | 'fruta' | 'bebida' | 'extra'

export interface Momento {
  id: MomentoId
  nombre: string
  abrev: string
  horaAprox: string
  carbMin: number
  carbMax: number
  descripcion: string
}

/**
 * Cómo se come una pieza de desayuno/merienda; decide con qué se puede combinar.
 * En las piezas de otros tipos no se usa y vale 'sola'.
 */
export type UsoPieza = 'base' | 'sola' | 'encima' | 'lacteo' | 'con-lacteo' | 'en-bebida'

export interface Pieza {
  id: string
  nombre: string
  tipo: TipoPieza
  porcion: string
  carbohidratos: number
  momentos: MomentoId[]
  mealPrep: boolean
  traeCarbohidratos: boolean
  uso: UsoPieza
  altaFibra: boolean
  altaGrasa: boolean
  nota: string
  origen: string
  validada: boolean
  creadaEl: string
}

/** Estado del total del plato respecto del rango del momento. */
export type Estado = 'ok' | 'over' | 'under'

/** Lugares posibles dentro de un plato, según el momento del día. */
export type Rol =
  | 'principal'
  | 'acompanamiento'
  | 'verdura'
  | 'postre'
  | 'bebida'
  | 'conBebida'
  | 'solido'
  | 'segundo'
  | 'colacion'

export interface Lugar {
  rol: Rol
  obligatorio: boolean
  pieza: Pieza | null
}

export interface Plato {
  momento: MomentoId
  lugares: Lugar[]
}

export interface PiezaHistorial {
  id: string
  nombre: string
  carbohidratos: number
}

export interface EntradaHistorial {
  fecha: string
  momento: MomentoId
  piezas: PiezaHistorial[]
  total: number
  origen: 'propuesta' | 'otra-comida'
}

export interface Ajustes {
  tema: 'sistema' | 'claro' | 'oscuro'
  claveIA: string
}

export interface Dieta {
  version: number
  piezas: Pieza[]
  historial: EntradaHistorial[]
  ajustes: Ajustes
  /** Ids de piezas base que el usuario eliminó, para que una versión nueva de la app no las vuelva a agregar. */
  piezasBaseEliminadas: string[]
}
