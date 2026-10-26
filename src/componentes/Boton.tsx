import './Boton.css'
import type { ComponentChildren } from 'preact'

interface Props {
  tipo?: 'primario' | 'secundario' | 'liviano'
  /** Variante del primario después de guardar: fondo verde suave, deshabilitado. */
  hecho?: boolean
  deshabilitado?: boolean
  alTocar?: () => void
  children: ComponentChildren
  etiqueta?: string
}

/** Botón de texto. Primario 56 px, secundario 48 px, liviano 44 px sin fondo. */
export function Boton({ tipo = 'secundario', hecho = false, deshabilitado = false, alTocar, children, etiqueta }: Props) {
  return (
    <button
      type="button"
      class={`boton boton--${tipo} ${hecho ? 'boton--hecho' : ''} body-strong`}
      disabled={deshabilitado}
      onClick={alTocar}
      aria-label={etiqueta}
    >
      {children}
    </button>
  )
}
