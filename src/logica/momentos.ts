import type { MomentoId } from './tipos.ts'

/**
 * Momento preseleccionado según la hora: desayuno antes de las 11, almuerzo antes de las 16:30,
 * merienda antes de las 20, cena después. La colación nunca se preselecciona.
 */
export function momentoPorHora(fecha: Date): MomentoId {
  const minutos = fecha.getHours() * 60 + fecha.getMinutes()
  if (minutos < 11 * 60) return 'desayuno'
  if (minutos < 16 * 60 + 30) return 'almuerzo'
  if (minutos < 20 * 60) return 'merienda'
  return 'cena'
}
