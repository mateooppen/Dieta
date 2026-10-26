import './HojaInferior.css'
import type { ComponentChildren } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { BotonIcono } from './BotonIcono.tsx'

interface Props {
  abierta: boolean
  titulo: string
  subtitulo?: string
  alCerrar: () => void
  children: ComponentChildren
}

/** Distancia de arrastre hacia abajo a partir de la cual la hoja se cierra. */
const UMBRAL_CIERRE_PX = 80

/**
 * Hoja inferior (bottom sheet): panel que sube desde abajo. Se cierra tocando el velo,
 * con la × del encabezado o arrastrando el encabezado hacia abajo.
 */
export function HojaInferior({ abierta, titulo, subtitulo, alCerrar, children }: Props) {
  const [desplazamiento, setDesplazamiento] = useState(0)
  const inicioY = useRef<number | null>(null)
  const hoja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierta) return
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') alCerrar()
    }
    window.addEventListener('keydown', alTeclear)
    hoja.current?.focus()
    return () => window.removeEventListener('keydown', alTeclear)
  }, [abierta, alCerrar])

  if (!abierta) return null

  const empezar = (e: PointerEvent) => {
    inicioY.current = e.clientY
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const mover = (e: PointerEvent) => {
    if (inicioY.current === null) return
    setDesplazamiento(Math.max(0, e.clientY - inicioY.current))
  }
  const soltar = () => {
    if (inicioY.current === null) return
    const cerrar = desplazamiento > UMBRAL_CIERRE_PX
    inicioY.current = null
    setDesplazamiento(0)
    if (cerrar) alCerrar()
  }

  return (
    <div class="hoja">
      <button type="button" class="hoja__velo" onClick={alCerrar} aria-label="Cerrar" />
      <div
        class="hoja__panel"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        ref={hoja}
        style={desplazamiento ? { transform: `translateY(${desplazamiento}px)`, transition: 'none' } : undefined}
      >
        <div class="hoja__encabezado" onPointerDown={empezar} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}>
          <span class="hoja__asa" aria-hidden="true" />
          <div class="hoja__titulos">
            <span class="title hoja__titulo">{titulo}</span>
            <BotonIcono icono="cerrar" etiqueta="Cerrar" alTocar={alCerrar} />
          </div>
          {subtitulo && <span class="body hoja__subtitulo">{subtitulo}</span>}
        </div>
        <div class="hoja__contenido">{children}</div>
      </div>
    </div>
  )
}
