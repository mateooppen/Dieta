/** "sábado 24 de octubre", sin coma y en minúsculas, como se dice. */
export function fechaLarga(fecha: Date): string {
  const partes = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).formatToParts(fecha)
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? ''
  return `${valor('weekday')} ${valor('day')} de ${valor('month')}`
}

function dosDigitos(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

/** Fecha y hora locales en formato ISO sin zona: "2026-10-26T14:10". Legible y ordenable. */
export function fechaISOLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}T${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`
}
