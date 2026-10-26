import './Hoy.css'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { useDieta } from '../datos/almacen.ts'
import { momentoPorId } from '../datos/piezas.ts'
import { BarraAcciones } from '../componentes/BarraAcciones.tsx'
import { Boton } from '../componentes/Boton.tsx'
import { BotonIcono } from '../componentes/BotonIcono.tsx'
import { Enlace } from '../componentes/Enrutador.tsx'
import { HojaInferior } from '../componentes/HojaInferior.tsx'
import { Icono } from '../componentes/Icono.tsx'
import { PlatoCard } from '../componentes/PlatoCard.tsx'
import { SelectorMomento } from '../componentes/SelectorMomento.tsx'
import { TarjetaAlternativa } from '../componentes/TarjetaAlternativa.tsx'
import { alternativasParaLugar } from '../logica/alternativas.ts'
import { fechaISOLocal, fechaLarga } from '../logica/fecha.ts'
import { entradaDesdePlato } from '../logica/historial.ts'
import { NOMBRE_ROL, conPieza, piezaDelRol, platoVacio } from '../logica/lugares.ts'
import { paraTenerAMano, textoCarbohidratos } from '../logica/marcas.ts'
import { momentoPorHora } from '../logica/momentos.ts'
import { proponerPlato } from '../logica/propuesta.ts'
import { temaAlternado, temaEfectivo } from '../logica/tema.ts'
import type { MomentoId, Plato, Rol } from '../logica/tipos.ts'

function sistemaOscuro(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
}

/** Pantalla principal: propone qué comer ahora y deja ajustarlo pieza por pieza. */
export function Hoy() {
  const [dieta, cambiarDieta] = useDieta()
  const [momentoId, setMomentoId] = useState<MomentoId>(() => momentoPorHora(new Date()))
  const [plato, setPlato] = useState<Plato>(() => platoVacio(momentoId))
  const [guardado, setGuardado] = useState(false)
  const [rolAbierto, setRolAbierto] = useState<Rol | null>(null)

  const momento = momentoPorId(momentoId)

  const proponer = (id: MomentoId) => {
    const propuesta = proponerPlato(dieta.piezas, momentoPorId(id), dieta.historial)
    setPlato(propuesta ? propuesta.plato : platoVacio(id))
    setGuardado(false)
  }

  // Al abrir y al cambiar de momento se propone un plato nuevo.
  useEffect(() => proponer(momentoId), [momentoId])

  const elegirPieza = (rol: Rol, pieza: Plato['lugares'][number]['pieza']) => {
    setPlato((actual) => conPieza(actual, rol, pieza))
    setGuardado(false)
    setRolAbierto(null)
  }

  const confirmar = () => {
    const entrada = entradaDesdePlato(plato, fechaISOLocal(new Date()), 'propuesta')
    cambiarDieta((d) => ({ ...d, historial: [...d.historial, entrada] }))
    setGuardado(true)
  }

  const alternarTema = () => {
    cambiarDieta((d) => ({ ...d, ajustes: { ...d.ajustes, tema: temaAlternado(d.ajustes.tema, sistemaOscuro()) } }))
  }

  const alternativas = useMemo(
    () => (rolAbierto ? alternativasParaLugar(plato, rolAbierto, dieta.piezas, momento) : []),
    [rolAbierto, plato, dieta.piezas, momento],
  )

  const piezaAbierta = rolAbierto ? piezaDelRol(plato, rolAbierto) : null
  const nombreRolAbierto = rolAbierto ? NOMBRE_ROL[rolAbierto].toLowerCase() : ''
  const oscuro = temaEfectivo(dieta.ajustes.tema, sistemaOscuro()) === 'oscuro'

  return (
    <div class="hoy">
      <div class="hoy__contenido">
        <header class="hoy__encabezado">
          <div class="hoy__titulos">
            <h1 class="title hoy__titulo">Hoy</h1>
            <span class="meta hoy__fecha">{fechaLarga(new Date())}</span>
          </div>
          <div class="hoy__iconos">
            <Enlace href="/piezas" class="boton-icono" aria-label="Mis piezas">
              <Icono nombre="lista" tamano={22} />
            </Enlace>
            <Enlace href="/ajustes" class="boton-icono" aria-label="Ajustes">
              <Icono nombre="ajustes" tamano={22} />
            </Enlace>
            <BotonIcono icono={oscuro ? 'sol' : 'luna'} etiqueta={oscuro ? 'Pasar a modo claro' : 'Pasar a modo oscuro'} alTocar={alternarTema} />
          </div>
        </header>

        <SelectorMomento actual={momentoId} alElegir={setMomentoId} />

        <PlatoCard plato={plato} momento={momento} alTocarLugar={setRolAbierto} alProponerOtro={() => proponer(momentoId)} />

        <section class="hoy__tip" aria-label="Para tener a mano">
          <span class="label hoy__tip-titulo">Para tener a mano</span>
          <span class="meta hoy__tip-texto">{paraTenerAMano(plato.lugares.map((l) => l.pieza))}</span>
        </section>
      </div>

      <BarraAcciones>
        <Enlace href="/otra" class="boton boton--secundario body-strong">
          Otra comida
        </Enlace>
        <Boton tipo="primario" hecho={guardado} deshabilitado={guardado} alTocar={confirmar}>
          {guardado ? 'Guardado' : 'Voy a comer esto'}
        </Boton>
      </BarraAcciones>

      <HojaInferior
        abierta={rolAbierto !== null}
        titulo={`Cambiar ${nombreRolAbierto}`}
        subtitulo={
          piezaAbierta
            ? `Ahora: ${piezaAbierta.nombre} (${textoCarbohidratos(piezaAbierta.carbohidratos)}). El total se recalcula con cada opción.`
            : `Ahora sin ${nombreRolAbierto}. El total se recalcula con cada opción.`
        }
        alCerrar={() => setRolAbierto(null)}
      >
        {alternativas.length === 0 && <span class="body hoy__sin-opciones">No hay otras opciones para este lugar.</span>}
        {alternativas.map((a) => (
          <TarjetaAlternativa key={a.pieza?.id ?? 'vacio'} alternativa={a} alElegir={() => elegirPieza(rolAbierto!, a.pieza)} />
        ))}
      </HojaInferior>
    </div>
  )
}
