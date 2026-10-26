import './TarjetaPieza.css'
import { badgesDePieza } from '../logica/marcas.ts'
import type { Pieza } from '../logica/tipos.ts'
import { Badge } from './Badge.tsx'

interface Props {
  pieza: Pieza
  alTocar: () => void
}

/** Tarjeta de pieza en Mis piezas: nombre, porción, badges y carbohidratos grandes. */
export function TarjetaPieza({ pieza, alTocar }: Props) {
  const badges = badgesDePieza(pieza)
  return (
    <button type="button" class="tarjeta-pieza" onClick={alTocar}>
      <span class="tarjeta-pieza__texto">
        <span class="heading">{pieza.nombre}</span>
        {pieza.porcion && <span class="meta tarjeta-pieza__porcion">{pieza.porcion}</span>}
        {badges.length > 0 && (
          <span class="tarjeta-pieza__badges">
            {badges.map((b) => (
              <Badge key={b.texto} {...b} />
            ))}
          </span>
        )}
      </span>
      <span class="num carb-lg tarjeta-pieza__carb">
        {pieza.carbohidratos}
        <span class="tarjeta-pieza__unidad"> g</span>
      </span>
    </button>
  )
}
