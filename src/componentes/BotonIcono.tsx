import './BotonIcono.css'
import { Icono, type NombreIcono } from './Icono.tsx'

interface Props {
  icono: NombreIcono
  etiqueta: string
  alTocar?: () => void
  /** Si se pasa, es un enlace en vez de un botón. */
  href?: string
}

/** Botón cuadrado de 44 px con un ícono y una etiqueta accesible. */
export function BotonIcono({ icono, etiqueta, alTocar, href }: Props) {
  if (href) {
    return (
      <a class="boton-icono" href={href} aria-label={etiqueta}>
        <Icono nombre={icono} tamano={22} />
      </a>
    )
  }
  return (
    <button type="button" class="boton-icono" onClick={alTocar} aria-label={etiqueta}>
      <Icono nombre={icono} tamano={22} />
    </button>
  )
}
