import './SelectorMomento.css'
import { MOMENTOS } from '../datos/piezas.ts'
import type { MomentoId } from '../logica/tipos.ts'

interface Props {
  actual: MomentoId
  alElegir: (momento: MomentoId) => void
}

const NOMBRE_CORTO: Record<MomentoId, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
  colacion: 'Colación',
}

/** Fila de chips con los momentos del día; se desplaza de costado si no entran. */
export function SelectorMomento({ actual, alElegir }: Props) {
  return (
    <div class="selector-momento" role="group" aria-label="Momento del día">
      {MOMENTOS.map((m) => (
        <button
          type="button"
          key={m.id}
          class={`selector-momento__chip body-strong ${m.id === actual ? 'selector-momento__chip--activo' : ''}`}
          aria-pressed={m.id === actual}
          onClick={() => alElegir(m.id)}
        >
          {NOMBRE_CORTO[m.id]}
        </button>
      ))}
    </div>
  )
}
