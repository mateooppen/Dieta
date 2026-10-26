import './Pendiente.css'
import { Enlace, caminoActual } from '../componentes/Enrutador.tsx'
import { Icono } from '../componentes/Icono.tsx'

const TITULOS: Record<string, { titulo: string; fase: number }> = {
  '/otra': { titulo: 'Otra comida', fase: 4 },
  '/piezas': { titulo: 'Mis piezas', fase: 4 },
  '/ajustes': { titulo: 'Ajustes', fase: 5 },
}

/** Pantalla provisoria para las rutas que llegan en fases siguientes. */
export function Pendiente() {
  const info = TITULOS[caminoActual()] ?? { titulo: 'Esta pantalla', fase: 4 }
  return (
    <main class="pendiente">
      <Enlace href="/" class="pendiente__volver body-strong" aria-label="Volver a Hoy">
        <Icono nombre="volver" tamano={22} />
        Hoy
      </Enlace>
      <h1 class="title pendiente__titulo">{info.titulo}</h1>
      <p class="body pendiente__texto">Llega en la fase {info.fase}.</p>
    </main>
  )
}
