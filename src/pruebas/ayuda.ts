import type { Momento, Pieza } from '../logica/tipos.ts'

/** Generador de azar repetible (mulberry32) para que las pruebas den siempre lo mismo. */
export function azarFijo(semilla: number): () => number {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let contador = 0

/** Pieza de prueba con valores por defecto razonables. */
export function pieza(parcial: Partial<Pieza> & Pick<Pieza, 'tipo' | 'carbohidratos'>): Pieza {
  contador += 1
  return {
    id: `p${contador}`,
    nombre: `Pieza ${contador}`,
    porcion: '1 unidad',
    momentos: ['desayuno', 'almuerzo', 'merienda', 'cena', 'colacion'],
    mealPrep: false,
    traeCarbohidratos: false,
    uso: 'sola',
    altaFibra: false,
    altaGrasa: false,
    nota: '',
    origen: 'prueba',
    validada: true,
    creadaEl: '2026-10-26',
    ...parcial,
  }
}

export const ALMUERZO: Momento = {
  id: 'almuerzo',
  nombre: 'Almuerzo',
  abrev: 'A',
  horaAprox: '14',
  carbMin: 50,
  carbMax: 60,
  descripcion: '',
}
