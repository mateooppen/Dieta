import './Inicio.css'
import { MOMENTOS, PIEZAS_BASE } from '../datos/piezas.ts'
import { alternativasParaLugar } from '../logica/alternativas.ts'
import { TEXTO_ESTADO } from '../logica/calculo.ts'
import { crearDietaInicial, importarDieta } from '../logica/dieta.ts'
import { NOMBRE_ROL, rolPrincipal } from '../logica/lugares.ts'
import { paraTenerAMano, textoCarbohidratos } from '../logica/marcas.ts'
import { momentoPorHora } from '../logica/momentos.ts'
import { proponerPlato } from '../logica/propuesta.ts'

interface Verificacion {
  titulo: string
  ok: boolean
  detalle: string
}

/** Corre la lógica de la fase 2 con los datos reales y arma la lista de verificación. */
function verificar(): Verificacion[] {
  const lista: Verificacion[] = []
  const dieta = crearDietaInicial()

  lista.push({
    titulo: 'Tabla de piezas cargada',
    ok: dieta.piezas.length === 96,
    detalle: `${dieta.piezas.length} piezas, todas validadas`,
  })

  const ahora = momentoPorHora(new Date())
  lista.push({
    titulo: 'Momento según la hora',
    ok: true,
    detalle: MOMENTOS.find((m) => m.id === ahora)?.nombre ?? ahora,
  })

  for (const momento of MOMENTOS) {
    const p = proponerPlato(dieta.piezas, momento, dieta.historial)
    if (!p) {
      lista.push({ titulo: momento.nombre, ok: false, detalle: 'No se pudo armar un plato' })
      continue
    }
    const piezas = p.plato.lugares
      .filter((l) => l.pieza)
      .map((l) => `${NOMBRE_ROL[l.rol]}: ${l.pieza!.nombre} (${textoCarbohidratos(l.pieza!.carbohidratos)})`)
    lista.push({
      titulo: `${momento.nombre} · ${textoCarbohidratos(p.total)} · ${TEXTO_ESTADO[p.estado]}`,
      ok: p.estado === 'ok',
      detalle: `${piezas.join(' · ')}. Para tener a mano: ${paraTenerAMano(p.plato.lugares.map((l) => l.pieza))}`,
    })
  }

  const almuerzo = MOMENTOS.find((m) => m.id === 'almuerzo')!
  const propuesta = proponerPlato(dieta.piezas, almuerzo)
  if (propuesta) {
    const rol = rolPrincipal('almuerzo')
    const alts = alternativasParaLugar(propuesta.plato, rol, dieta.piezas, almuerzo)
    lista.push({
      titulo: 'Alternativas para el principal',
      ok: alts.length > 0,
      detalle: `${alts.length} opciones; la más cercana: ${alts[0]?.nombre} → ${textoCarbohidratos(alts[0]?.totalNuevo ?? 0)}`,
    })
  }

  const r = importarDieta(JSON.stringify(dieta))
  lista.push({
    titulo: 'Respaldo: exportar e importar',
    ok: r.ok && r.dieta.piezas.length === 96,
    detalle: r.ok ? 'El archivo vuelve a leerse igual' : r.error,
  })

  return lista
}

/** Pantalla provisoria de la fase 2: lista de verificación de la lógica con datos reales. */
export function Inicio() {
  const verificaciones = verificar()
  const todasOk = verificaciones.every((v) => v.ok)
  return (
    <main class="inicio">
      <header class="inicio__cabecera">
        <h1 class="title inicio__titulo">Dieta</h1>
        <p class="body inicio__texto">Fase 2: datos y lógica</p>
        <span class={`label inicio__chip ${todasOk ? 'inicio__chip--ok' : 'inicio__chip--over'}`}>
          {todasOk ? 'Todo en orden' : 'Revisar'}
        </span>
      </header>
      <ul class="inicio__lista">
        {verificaciones.map((v) => (
          <li class="inicio__item" key={v.titulo}>
            <span class={`inicio__marca ${v.ok ? 'inicio__marca--ok' : 'inicio__marca--over'}`} aria-hidden="true">
              {v.ok ? '✓' : '!'}
            </span>
            <span class="inicio__cuerpo">
              <span class="heading">{v.titulo}</span>
              <span class="meta inicio__detalle">{v.detalle}</span>
            </span>
          </li>
        ))}
      </ul>
      <p class="meta inicio__pie">
        {PIEZAS_BASE.length} piezas en la tabla base. Tocá recargar para ver otras propuestas.
      </p>
    </main>
  )
}
