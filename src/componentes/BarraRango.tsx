import './BarraRango.css'
import { barraRango } from '../logica/calculo.ts'
import type { Estado, Momento } from '../logica/tipos.ts'

interface Props {
  total: number
  momento: Momento
  estado: Estado
}

/** Pista con la zona del rango marcada y el relleno del total. Solo aparece cuando el plato se arma a mano. */
export function BarraRango({ total, momento, estado }: Props) {
  const b = barraRango(total, momento)
  return (
    <div class="barra-rango" aria-hidden="true">
      <div class="barra-rango__zona" style={{ left: `${b.zonaInicio}%`, width: `${b.zonaAncho}%` }} />
      <div class={`barra-rango__relleno barra-rango__relleno--${estado}`} style={{ width: `${b.relleno}%` }} />
    </div>
  )
}
