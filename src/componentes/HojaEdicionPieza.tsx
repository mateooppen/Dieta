import './HojaEdicionPieza.css'
import { useState } from 'preact/hooks'
import { MOMENTOS, TIPOS } from '../datos/piezas.ts'
import { NOMBRE_TIPO, alternarMomento, borradorDesdePieza, borradorVacio, validarBorrador, type Borrador } from '../logica/edicion.ts'
import type { MomentoId, Pieza } from '../logica/tipos.ts'
import { Badge } from './Badge.tsx'
import { Boton } from './Boton.tsx'
import { Campo } from './Campo.tsx'
import { ChipOpcion } from './ChipOpcion.tsx'
import { Contador } from './Contador.tsx'
import { HojaInferior } from './HojaInferior.tsx'
import { Interruptor } from './Interruptor.tsx'

interface Props {
  /** La pieza que se edita, o null para crear una nueva. */
  pieza: Pieza | null
  abierta: boolean
  alCerrar: () => void
  alGuardar: (borrador: Borrador) => void
  alEliminar: (id: string) => void
}

const NOMBRE_MOMENTO: Record<MomentoId, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
  colacion: 'Colación',
}

/** Hoja inferior para crear o editar una pieza, con confirmación de borrado adentro. */
export function HojaEdicionPieza({ pieza, abierta, alCerrar, alGuardar, alEliminar }: Props) {
  // La clave en el padre reinicia este componente cada vez que se abre con otra pieza.
  const [b, setB] = useState<Borrador>(() => (pieza ? borradorDesdePieza(pieza) : borradorVacio()))
  const [error, setError] = useState<string | null>(null)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)

  /** Acepta una parte nueva o una función que la calcula desde el borrador actual (para toques muy seguidos). */
  const cambiar = (parte: Partial<Borrador> | ((actual: Borrador) => Partial<Borrador>)) => {
    setB((actual) => ({ ...actual, ...(typeof parte === 'function' ? parte(actual) : parte) }))
    setError(null)
  }

  const guardar = () => {
    const problema = validarBorrador(b)
    if (problema) {
      setError(problema)
      return
    }
    alGuardar(b)
  }

  return (
    <HojaInferior abierta={abierta} titulo={pieza ? 'Editar pieza' : 'Pieza nueva'} alCerrar={alCerrar}>
      <div class="edicion">
        {!b.validada && (
          <div class="edicion__estado">
            <Badge texto="Sin validar" tono="ambar" />
          </div>
        )}

        <Campo id="ed-nombre" etiqueta="Nombre" sugerencia="Por ejemplo: Tarta de choclo" valor={b.nombre} alCambiar={(v) => cambiar({ nombre: v })} />
        <Campo id="ed-porcion" etiqueta="Porción casera" sugerencia="1 porción, ½ plato, 1 taza…" valor={b.porcion} alCambiar={(v) => cambiar({ porcion: v })} />
        <Contador
          id="ed-carb"
          etiqueta="Carbohidratos por porción"
          valor={b.carbohidratos}
          alCambiar={(v) => cambiar({ carbohidratos: v })}
          alAjustar={(delta) => cambiar((a) => ({ carbohidratos: Math.max(0, a.carbohidratos + delta) }))}
        />

        <div class="edicion__grupo">
          <span class="label edicion__etiqueta">Tipo</span>
          <div class="chips-grupo">
            {TIPOS.map((t) => (
              <ChipOpcion key={t.id} texto={NOMBRE_TIPO[t.id]} activo={b.tipo === t.id} alTocar={() => cambiar({ tipo: t.id })} />
            ))}
          </div>
        </div>

        <div class="edicion__grupo">
          <span class="label edicion__etiqueta">Momentos en que va</span>
          <div class="chips-grupo">
            {MOMENTOS.map((m) => (
              <ChipOpcion
                key={m.id}
                texto={NOMBRE_MOMENTO[m.id]}
                activo={b.momentos.includes(m.id)}
                alTocar={() => cambiar((a) => ({ momentos: alternarMomento(a.momentos, m.id) }))}
              />
            ))}
          </div>
        </div>

        <div class="edicion__interruptores">
          <Interruptor etiqueta="Alta fibra" aclaracion="(4 g o más por porción)" activo={b.altaFibra} alCambiar={(v) => cambiar({ altaFibra: v })} />
          <Interruptor etiqueta="Alta grasa" aclaracion="(10 g o más por porción)" activo={b.altaGrasa} alCambiar={(v) => cambiar({ altaGrasa: v })} />
          <Interruptor etiqueta="Sirve para meal prep" activo={b.mealPrep} alCambiar={(v) => cambiar({ mealPrep: v })} />
          <Interruptor
            etiqueta="Ya trae sus carbohidratos"
            aclaracion="(no lleva acompañamiento)"
            activo={b.traeCarbohidratos}
            alCambiar={(v) => cambiar({ traeCarbohidratos: v })}
          />
          <Interruptor etiqueta="Validada por la nutricionista" activo={b.validada} alCambiar={(v) => cambiar({ validada: v })} />
        </div>

        <Campo id="ed-nota" etiqueta="Nota (opcional)" sugerencia="Para tener a mano, aclaraciones…" valor={b.nota} alCambiar={(v) => cambiar({ nota: v })} />

        {error && (
          <span class="body edicion__error" role="alert">
            {error}
          </span>
        )}

        {confirmandoBorrado ? (
          <div class="edicion__confirmar" role="alert">
            <span class="body">¿Eliminar esta pieza? No se puede deshacer.</span>
            <div class="edicion__acciones">
              <Boton tipo="liviano" alTocar={() => setConfirmandoBorrado(false)}>
                No, dejarla
              </Boton>
              <Boton tipo="secundario" alTocar={() => alEliminar(pieza!.id)}>
                Sí, eliminar
              </Boton>
            </div>
          </div>
        ) : (
          <div class="edicion__acciones">
            {pieza && (
              <button type="button" class="edicion__eliminar body-strong" onClick={() => setConfirmandoBorrado(true)}>
                Eliminar
              </button>
            )}
            <span class="edicion__espacio" />
            <Boton tipo="liviano" alTocar={alCerrar}>
              Cancelar
            </Boton>
            <Boton tipo="primario" alTocar={guardar}>
              Guardar
            </Boton>
          </div>
        )}
      </div>
    </HojaInferior>
  )
}
