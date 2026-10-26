import './ChipOpcion.css'

interface Props {
  texto: string
  activo: boolean
  alTocar: () => void
}

/** Chip redondeado que se enciende al tocarlo: filtros, tipo de pieza, momentos. */
export function ChipOpcion({ texto, activo, alTocar }: Props) {
  return (
    <button type="button" class={`chip-opcion label ${activo ? 'chip-opcion--activo' : ''}`} aria-pressed={activo} onClick={alTocar}>
      {texto}
    </button>
  )
}
