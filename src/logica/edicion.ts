import { normalizar } from './busqueda.ts'
import type { Dieta, MomentoId, Pieza, TipoPieza } from './tipos.ts'

/** Lo que se edita en la hoja de una pieza: todo menos id, origen y fecha de creación. */
export type Borrador = Omit<Pieza, 'id' | 'origen' | 'creadaEl'>

export function borradorVacio(): Borrador {
  return {
    nombre: '',
    porcion: '',
    carbohidratos: 0,
    tipo: 'principal',
    momentos: [],
    mealPrep: false,
    traeCarbohidratos: false,
    altaFibra: false,
    altaGrasa: false,
    nota: '',
    validada: false,
  }
}

export function borradorDesdePieza(p: Pieza): Borrador {
  const { id: _id, origen: _origen, creadaEl: _creadaEl, ...resto } = p
  return { ...resto, momentos: [...p.momentos] }
}

/** Devuelve el primer problema del borrador en palabras, o null si está bien. */
export function validarBorrador(b: Borrador): string | null {
  if (b.nombre.trim() === '') return 'Falta el nombre.'
  if (!Number.isInteger(b.carbohidratos) || b.carbohidratos < 0) return 'Los carbohidratos tienen que ser un número entero, 0 o más.'
  if (b.momentos.length === 0) return 'Elegí al menos un momento.'
  return null
}

/** "Tarta de choclo" → "tarta-de-choclo"; si ya existe, agrega -2, -3… */
export function generarId(nombre: string, existentes: Set<string>): string {
  const base =
    normalizar(nombre)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'pieza'
  if (!existentes.has(base)) return base
  let n = 2
  while (existentes.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

/** Crea la pieza a partir del borrador (nace sin validar salvo que se marque). */
export function crearPieza(b: Borrador, existentes: Pieza[], fecha: string, origen = 'manual'): Pieza {
  return {
    ...b,
    nombre: b.nombre.trim(),
    porcion: b.porcion.trim(),
    nota: b.nota.trim(),
    momentos: [...b.momentos],
    id: generarId(b.nombre, new Set(existentes.map((p) => p.id))),
    origen,
    creadaEl: fecha,
  }
}

/** Dieta con la pieza agregada al final. */
export function agregarPieza(dieta: Dieta, pieza: Pieza): Dieta {
  return { ...dieta, piezas: [...dieta.piezas, pieza] }
}

/** Dieta con la pieza de ese id reemplazada por el borrador (el id, el origen y la fecha se conservan). */
export function editarPieza(dieta: Dieta, id: string, b: Borrador): Dieta {
  return {
    ...dieta,
    piezas: dieta.piezas.map((p) =>
      p.id === id ? { ...p, ...b, nombre: b.nombre.trim(), porcion: b.porcion.trim(), nota: b.nota.trim(), momentos: [...b.momentos] } : p,
    ),
  }
}

/** Dieta sin esa pieza. El historial no se toca: guarda nombre y carbohidratos por su cuenta. */
export function eliminarPieza(dieta: Dieta, id: string): Dieta {
  return { ...dieta, piezas: dieta.piezas.filter((p) => p.id !== id) }
}

export function alternarMomento(momentos: MomentoId[], m: MomentoId): MomentoId[] {
  return momentos.includes(m) ? momentos.filter((x) => x !== m) : [...momentos, m]
}

export const NOMBRE_TIPO: Record<TipoPieza, string> = {
  principal: 'Principal',
  acompanamiento: 'Acompañamiento',
  desayuno_merienda: 'Desayuno / merienda',
  fruta: 'Fruta',
  bebida: 'Bebida',
  extra: 'Extra',
}
