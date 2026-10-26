import './TarjetaAlternativa.css'
import type { Alternativa } from '../logica/alternativas.ts'
import { badgesDePieza, textoCarbohidratos } from '../logica/marcas.ts'
import { Badge } from './Badge.tsx'
import { ChipEstado } from './ChipEstado.tsx'

interface Props {
  alternativa: Alternativa
  alElegir: () => void
}

/** Opción dentro de la hoja de alternativas: nombre, badges, porción, total resultante y carbohidratos. */
export function TarjetaAlternativa({ alternativa, alElegir }: Props) {
  const { pieza, nombre, totalNuevo, estado } = alternativa
  return (
    <button type="button" class="alternativa" onClick={alElegir}>
      <span class="alternativa__texto">
        <span class="alternativa__nombre">
          <span class="heading">{nombre}</span>
          {pieza && badgesDePieza(pieza).map((b) => <Badge key={b.texto} {...b} />)}
        </span>
        <span class="body alternativa__porcion">{pieza ? pieza.porcion : 'Dejar este lugar vacío'}</span>
        <span class="num alternativa__total">
          <span class="body alternativa__total-texto">
            El plato queda en <b class="alternativa__total-numero">{textoCarbohidratos(totalNuevo)}</b>
          </span>
          <ChipEstado estado={estado} chico />
        </span>
      </span>
      <b class="num carb-lg alternativa__carb">
        {pieza ? pieza.carbohidratos : 0}
        <span class="alternativa__unidad"> g</span>
      </b>
    </button>
  )
}
