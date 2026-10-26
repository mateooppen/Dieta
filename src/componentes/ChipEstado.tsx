import './ChipEstado.css'
import { TEXTO_ESTADO } from '../logica/calculo.ts'
import type { Estado } from '../logica/tipos.ts'

interface Props {
  estado: Estado
  chico?: boolean
}

/** Chip con el estado del plato: siempre palabra además de color. */
export function ChipEstado({ estado, chico = false }: Props) {
  return <span class={`chip chip--${estado} ${chico ? 'chip--chico' : ''} label`}>{TEXTO_ESTADO[estado]}</span>
}
