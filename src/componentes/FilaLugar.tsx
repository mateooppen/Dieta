import './FilaLugar.css'
import { NOMBRE_ROL } from '../logica/lugares.ts'
import { badgesDePieza, textoCarbohidratos } from '../logica/marcas.ts'
import type { Lugar } from '../logica/tipos.ts'
import { Badge } from './Badge.tsx'
import { Icono } from './Icono.tsx'

interface Props {
  lugar: Lugar
  alTocar: () => void
}

/** Fila tocable del plato: rol, pieza (o "Sin <rol>"), badges, carbohidratos y flecha. */
export function FilaLugar({ lugar, alTocar }: Props) {
  const nombreRol = NOMBRE_ROL[lugar.rol]
  const pieza = lugar.pieza
  return (
    <button type="button" class="fila-lugar" onClick={alTocar} aria-label={`Cambiar ${nombreRol.toLowerCase()}`}>
      <span class="fila-lugar__texto">
        <span class="label fila-lugar__rol">{nombreRol}</span>
        <span class="fila-lugar__nombre">
          <span class={`body ${pieza ? '' : 'fila-lugar__vacio'}`}>{pieza ? pieza.nombre : `Sin ${nombreRol.toLowerCase()}`}</span>
          {pieza && badgesDePieza(pieza).filter((b) => b.tono === 'fibra' || b.tono === 'grasa').map((b) => <Badge key={b.texto} {...b} />)}
        </span>
      </span>
      <b class="num heading fila-lugar__carb">{pieza ? textoCarbohidratos(pieza.carbohidratos) : '—'}</b>
      <span class="fila-lugar__flecha">
        <Icono nombre="chevron" tamano={20} />
      </span>
    </button>
  )
}
