import './OtraComida.css'
import { useState } from 'preact/hooks'
import { useDieta } from '../datos/almacen.ts'
import { MOMENTOS, momentoPorId } from '../datos/piezas.ts'
import { Badge } from '../componentes/Badge.tsx'
import { BarraAcciones } from '../componentes/BarraAcciones.tsx'
import { BarraRango } from '../componentes/BarraRango.tsx'
import { Boton } from '../componentes/Boton.tsx'
import { Campo } from '../componentes/Campo.tsx'
import { ChipEstado } from '../componentes/ChipEstado.tsx'
import { Encabezado } from '../componentes/Encabezado.tsx'
import { Enlace, irA, parametroActual } from '../componentes/Enrutador.tsx'
import { Icono } from '../componentes/Icono.tsx'
import { buscarPiezas } from '../logica/busqueda.ts'
import { estadoDelTotal, totalDePiezas } from '../logica/calculo.ts'
import { fechaISOLocal } from '../logica/fecha.ts'
import { entradaDesdePiezas } from '../logica/historial.ts'
import { badgesDePieza, textoCarbohidratos } from '../logica/marcas.ts'
import { momentoPorHora } from '../logica/momentos.ts'
import type { MomentoId, Pieza } from '../logica/tipos.ts'

function momentoInicial(): MomentoId {
  const pedido = parametroActual('momento')
  return MOMENTOS.some((m) => m.id === pedido) ? (pedido as MomentoId) : momentoPorHora(new Date())
}

/** Armar a mano lo que se va a comer: buscar piezas y sumarlas. La estimación con IA llega en la fase 6. */
export function OtraComida() {
  const [dieta, cambiarDieta] = useDieta()
  const [momentoId] = useState(momentoInicial)
  const [elegidas, setElegidas] = useState<Pieza[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const momento = momentoPorId(momentoId)
  const total = totalDePiezas(elegidas)
  const estado = estadoDelTotal(total, momento)
  const nombreMomento = momentoId === 'colacion' ? 'Colación' : momento.nombre
  const resultados = buscarPiezas(dieta.piezas, busqueda, new Set(elegidas.map((p) => p.id)))

  const agregar = (p: Pieza) => {
    setElegidas((lista) => [...lista, p])
    setBusqueda('')
  }
  const quitar = (indice: number) => setElegidas((lista) => lista.filter((_, i) => i !== indice))

  const confirmar = () => {
    const entrada = entradaDesdePiezas(elegidas, momentoId, fechaISOLocal(new Date()), 'otra-comida')
    cambiarDieta((d) => ({ ...d, historial: [...d.historial, entrada] }))
    irA('/')
  }

  return (
    <div class="pantalla">
      <div class="pantalla__contenido otra">
        <Encabezado titulo="Otra comida" subtitulo={`${nombreMomento} · rango ${momento.carbMin}–${momento.carbMax} g`} />

        <section class="otra__tarjeta" aria-label="Lo que voy a comer">
          <div class="otra__fila-titulo">
            <span class="label otra__rol">Lo que voy a comer</span>
            <ChipEstado estado={estado} />
          </div>
          <div class="otra__total">
            <span class="num carb-xl">
              {total}
              <span class="otra__unidad">g</span>
            </span>
            <span class="meta texto-apagado">
              de {momento.carbMin}–{momento.carbMax} g
            </span>
          </div>
          <BarraRango total={total} momento={momento} estado={estado} />
          <div class="otra__elegidas">
            {elegidas.length === 0 && (
              <span class="body texto-apagado otra__vacio">Todavía no agregaste nada. Buscá una pieza o describí lo que vas a comer.</span>
            )}
            {elegidas.map((p, i) => (
              <div class="otra__elegida" key={`${p.id}-${i}`}>
                <span class="otra__elegida-nombre">
                  <span class="body">{p.nombre}</span>
                  {badgesDePieza(p)
                    .filter((b) => b.tono !== 'neutro')
                    .map((b) => (
                      <Badge key={b.texto} {...b} />
                    ))}
                </span>
                <b class="num body-strong">{textoCarbohidratos(p.carbohidratos)}</b>
                <button type="button" class="otra__quitar" aria-label={`Quitar ${p.nombre}`} onClick={() => quitar(i)}>
                  <Icono nombre="cerrar" tamano={18} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section class="otra__bloque" aria-label="Buscar en mis piezas">
          <Campo id="buscar" etiqueta="Buscar en mis piezas" icono="buscar" tipo="search" sugerencia="Nombre de la pieza" valor={busqueda} alCambiar={setBusqueda} />
          {resultados.length > 0 && (
            <div class="otra__resultados">
              {resultados.map((p) => (
                <button type="button" class="otra__resultado" key={p.id} onClick={() => agregar(p)} aria-label={`Agregar ${p.nombre}`}>
                  <span class="otra__resultado-texto">
                    <span class="otra__elegida-nombre">
                      <span class="body-strong">{p.nombre}</span>
                      {badgesDePieza(p)
                        .filter((b) => b.tono !== 'neutro')
                        .map((b) => (
                          <Badge key={b.texto} {...b} />
                        ))}
                    </span>
                    {p.porcion && <span class="meta texto-apagado">{p.porcion}</span>}
                  </span>
                  <b class="num body-strong">{textoCarbohidratos(p.carbohidratos)}</b>
                  <span class="otra__mas" aria-hidden="true">
                    <Icono nombre="mas" tamano={20} />
                  </span>
                </button>
              ))}
            </div>
          )}
          {busqueda.trim() !== '' && resultados.length === 0 && (
            <span class="body texto-apagado">No hay piezas con ese nombre. Describila abajo y la app estima los carbohidratos.</span>
          )}
        </section>

        <section class="otra__bloque" aria-label="Describir lo que voy a comer">
          <Campo
            id="descripcion"
            etiqueta="No está en la lista: describila"
            multilinea
            sugerencia="Qué y cuánto. Por ejemplo: 2 porciones de tarta de jamón y queso de la rotisería"
            valor={descripcion}
            alCambiar={setDescripcion}
          />
          <div class="otra__estimar">
            <Boton tipo="secundario" deshabilitado>
              <Icono nombre="chispas" tamano={20} />
              Estimar carbohidratos
            </Boton>
            <span class="meta texto-apagado">La estimación con IA llega en la fase 6.</span>
          </div>
        </section>
      </div>

      <BarraAcciones>
        <Enlace href="/" class="boton boton--liviano body-strong">
          Cancelar
        </Enlace>
        <Boton tipo="primario" deshabilitado={elegidas.length === 0} alTocar={confirmar}>
          Voy a comer esto
        </Boton>
      </BarraAcciones>
    </div>
  )
}
