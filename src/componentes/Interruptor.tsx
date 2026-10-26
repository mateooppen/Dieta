import './Interruptor.css'
import type { ComponentChildren } from 'preact'

interface Props {
  etiqueta: string
  aclaracion?: string
  activo: boolean
  alCambiar: (activo: boolean) => void
  children?: ComponentChildren
}

/** Fila con texto a la izquierda e interruptor a la derecha. */
export function Interruptor({ etiqueta, aclaracion, activo, alCambiar }: Props) {
  return (
    <div class="interruptor">
      <span class="body interruptor__texto">
        {etiqueta}
        {aclaracion && <span class="meta interruptor__aclaracion"> {aclaracion}</span>}
      </span>
      <button
        type="button"
        role="switch"
        class={`interruptor__boton ${activo ? 'interruptor__boton--activo' : ''}`}
        aria-checked={activo}
        aria-label={etiqueta}
        onClick={() => alCambiar(!activo)}
      />
    </div>
  )
}
