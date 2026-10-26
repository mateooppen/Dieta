import './Casilla.css'
import type { ComponentChildren } from 'preact'
import { Icono } from './Icono.tsx'

interface Props {
  marcada: boolean
  alCambiar: (marcada: boolean) => void
  children: ComponentChildren
}

/** Casilla de verificación grande (toque de 44 px), con el texto a la derecha. */
export function Casilla({ marcada, alCambiar, children }: Props) {
  return (
    <label class="casilla body">
      <input type="checkbox" class="casilla__nativa" checked={marcada} onChange={(e) => alCambiar((e.currentTarget as HTMLInputElement).checked)} />
      <span class={`casilla__caja ${marcada ? 'casilla__caja--marcada' : ''}`} aria-hidden="true">
        {marcada && <Icono nombre="tilde" tamano={16} />}
      </span>
      <span>{children}</span>
    </label>
  )
}
