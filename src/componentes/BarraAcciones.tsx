import './BarraAcciones.css'
import type { ComponentChildren } from 'preact'

/** Barra fija al pie con las acciones de la pantalla. La principal va a la derecha. */
export function BarraAcciones({ children }: { children: ComponentChildren }) {
  return <div class="barra-acciones">{children}</div>
}
