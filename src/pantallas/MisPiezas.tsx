import './MisPiezas.css'
import { useState } from 'preact/hooks'
import { useDieta } from '../datos/almacen.ts'
import { fechaCorta } from '../datos/platoActual.ts'
import { BarraAcciones } from '../componentes/BarraAcciones.tsx'
import { Boton } from '../componentes/Boton.tsx'
import { Campo } from '../componentes/Campo.tsx'
import { ChipOpcion } from '../componentes/ChipOpcion.tsx'
import { Encabezado } from '../componentes/Encabezado.tsx'
import { HojaEdicionPieza } from '../componentes/HojaEdicionPieza.tsx'
import { Icono } from '../componentes/Icono.tsx'
import { TarjetaPieza } from '../componentes/TarjetaPieza.tsx'
import { FILTROS, filtrarPiezas, resumenPiezas, type Filtro } from '../logica/busqueda.ts'
import { agregarPieza, crearPieza, editarPieza, eliminarPieza, type Borrador } from '../logica/edicion.ts'
import type { Pieza } from '../logica/tipos.ts'

/** Estado de la hoja: cerrada, creando una pieza nueva, o editando una existente. */
type Hoja = { modo: 'cerrada' } | { modo: 'nueva'; clave: number } | { modo: 'editar'; pieza: Pieza; clave: number }

/** Lista de piezas con buscador, filtros siempre visibles y hoja de edición. */
export function MisPiezas() {
  const [dieta, cambiarDieta] = useDieta()
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [hoja, setHoja] = useState<Hoja>({ modo: 'cerrada' })

  const lista = filtrarPiezas(dieta.piezas, filtro, busqueda)
  const cerrar = () => setHoja({ modo: 'cerrada' })

  const guardar = (b: Borrador) => {
    if (hoja.modo === 'editar') {
      const id = hoja.pieza.id
      cambiarDieta((d) => editarPieza(d, id, b))
    } else {
      cambiarDieta((d) => agregarPieza(d, crearPieza(b, d.piezas, fechaCorta(new Date()))))
    }
    cerrar()
  }

  const eliminar = (id: string) => {
    cambiarDieta((d) => eliminarPieza(d, id))
    cerrar()
  }

  return (
    <div class="pantalla">
      <div class="pantalla__contenido mis-piezas">
        <Encabezado titulo="Mis piezas" subtitulo={resumenPiezas(dieta.piezas)} />

        <Campo id="buscar-piezas" etiquetaOculta="Buscar pieza" icono="buscar" tipo="search" sugerencia="Buscar pieza" valor={busqueda} alCambiar={setBusqueda} />

        <div class="chips-fila" role="group" aria-label="Filtrar">
          {FILTROS.map((f) => (
            <ChipOpcion key={f.id} texto={f.nombre} activo={filtro === f.id} alTocar={() => setFiltro(f.id)} />
          ))}
        </div>

        <div class="mis-piezas__lista">
          {lista.map((p) => (
            <TarjetaPieza key={p.id} pieza={p} alTocar={() => setHoja({ modo: 'editar', pieza: p, clave: Date.now() })} />
          ))}
          {lista.length === 0 && <span class="body texto-apagado mis-piezas__vacio">No hay piezas con ese nombre. Podés agregarla con el botón de abajo.</span>}
        </div>
      </div>

      <BarraAcciones>
        <Boton tipo="primario" alTocar={() => setHoja({ modo: 'nueva', clave: Date.now() })}>
          <Icono nombre="mas" tamano={22} />
          Agregar pieza
        </Boton>
      </BarraAcciones>

      {hoja.modo !== 'cerrada' && (
        <HojaEdicionPieza
          key={hoja.clave}
          pieza={hoja.modo === 'editar' ? hoja.pieza : null}
          abierta
          alCerrar={cerrar}
          alGuardar={guardar}
          alEliminar={eliminar}
        />
      )}
    </div>
  )
}
