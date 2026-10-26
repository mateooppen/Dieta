import type { Ajustes } from './tipos.ts'

export type Tema = Ajustes['tema']

/** Aplica el tema al elemento raíz: `data-theme` fijo para claro u oscuro, nada para seguir al sistema. */
export function aplicarTema(tema: Tema, raiz: { setAttribute(n: string, v: string): void; removeAttribute(n: string): void }): void {
  if (tema === 'sistema') raiz.removeAttribute('data-theme')
  else raiz.setAttribute('data-theme', tema === 'claro' ? 'light' : 'dark')
}

/** Qué tema se ve en pantalla ahora mismo, resolviendo "sistema" con la preferencia del teléfono. */
export function temaEfectivo(tema: Tema, sistemaOscuro: boolean): 'claro' | 'oscuro' {
  if (tema === 'sistema') return sistemaOscuro ? 'oscuro' : 'claro'
  return tema
}

/** El interruptor de la pantalla Hoy: pasa al opuesto del que se ve. */
export function temaAlternado(tema: Tema, sistemaOscuro: boolean): Tema {
  return temaEfectivo(tema, sistemaOscuro) === 'oscuro' ? 'claro' : 'oscuro'
}
