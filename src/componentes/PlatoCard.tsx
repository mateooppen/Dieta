import './PlatoCard.css'
import { estadoDelTotal, totalDelPlato } from '../logica/calculo.ts'
import { lugarVisible } from '../logica/lugares.ts'
import type { Momento, Plato, Rol } from '../logica/tipos.ts'
import { Boton } from './Boton.tsx'
import { ChipEstado } from './ChipEstado.tsx'
import { FilaLugar } from './FilaLugar.tsx'
import { Icono } from './Icono.tsx'

interface Props {
  plato: Plato
  momento: Momento
  alTocarLugar: (rol: Rol) => void
  alProponerOtro: () => void
}

/** Tarjeta del plato: momento, estado, total grande, rango, filas por lugar y "Proponer otro plato". */
export function PlatoCard({ plato, momento, alTocarLugar, alProponerOtro }: Props) {
  const total = totalDelPlato(plato)
  const estado = estadoDelTotal(total, momento)
  const nombreMomento = momento.id === 'colacion' ? 'Colación' : momento.nombre
  return (
    <section class="plato-card" aria-label={`Plato de ${nombreMomento.toLowerCase()}`}>
      <div class="plato-card__encabezado">
        <h2 class="title plato-card__momento">{nombreMomento}</h2>
        <ChipEstado estado={estado} />
      </div>
      <div class="plato-card__total">
        <span class="num carb-xl">
          {total}
          <span class="plato-card__unidad">g</span>
        </span>
        <span class="meta plato-card__rango">
          rango {momento.carbMin}–{momento.carbMax} g
        </span>
      </div>
      <div class="plato-card__filas">
        {plato.lugares.filter((l) => lugarVisible(plato, l)).map((l) => (
          <FilaLugar key={l.rol} lugar={l} alTocar={() => alTocarLugar(l.rol)} />
        ))}
      </div>
      <div class="plato-card__pie">
        <Boton tipo="liviano" alTocar={alProponerOtro}>
          <Icono nombre="mezclar" tamano={20} />
          Proponer otro plato
        </Boton>
      </div>
    </section>
  )
}
