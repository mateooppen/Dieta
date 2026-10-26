import type { Dieta } from './tipos.ts'

/** Nombre del archivo que se descarga: dieta-2026-10-26.json */
export function nombreDeRespaldo(fecha: Date): string {
  const d = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  return `dieta-${fecha.getFullYear()}-${d(fecha.getMonth() + 1)}-${d(fecha.getDate())}.json`
}

/** Texto del respaldo, legible, con la clave de la IA afuera (el respaldo puede compartirse). */
export function textoDeRespaldo(dieta: Dieta): string {
  return JSON.stringify({ ...dieta, ajustes: { ...dieta.ajustes, claveIA: '' } }, null, 2)
}

/** Al importar un respaldo, se conservan la clave y el tema que había en el teléfono. */
export function fusionarAjustesAlImportar(importada: Dieta, actual: Dieta): Dieta {
  return { ...importada, ajustes: { ...importada.ajustes, claveIA: actual.ajustes.claveIA || importada.ajustes.claveIA, tema: actual.ajustes.tema } }
}
