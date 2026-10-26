import './Encabezado.css'
import { Enlace } from './Enrutador.tsx'
import { Icono } from './Icono.tsx'

interface Props {
  titulo: string
  subtitulo?: string
  /** Adónde vuelve la flecha. */
  volverA?: string
}

/** Encabezado de pantalla secundaria: flecha para volver, título y subtítulo. */
export function Encabezado({ titulo, subtitulo, volverA = '/' }: Props) {
  return (
    <header class="encabezado">
      <Enlace href={volverA} class="boton-icono" aria-label="Volver a Hoy">
        <Icono nombre="atras" tamano={24} />
      </Enlace>
      <div class="encabezado__textos">
        <h1 class="title encabezado__titulo">{titulo}</h1>
        {subtitulo && <span class="meta encabezado__subtitulo">{subtitulo}</span>}
      </div>
    </header>
  )
}
