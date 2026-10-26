import type { ComponentChildren, ComponentType } from 'preact'
import { useEffect, useState } from 'preact/hooks'

/** Prefijo con que se publica la app (/Dieta/ en GitHub Pages). */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

export interface Ruta {
  camino: string
  pantalla: ComponentType
}

/** Camino actual sin el prefijo de publicación: "/" , "/otra", "/piezas", "/ajustes". */
export function caminoActual(): string {
  const sinBase = location.pathname.startsWith(BASE) ? location.pathname.slice(BASE.length) : location.pathname
  return sinBase === '' ? '/' : sinBase.replace(/\/$/, '') || '/'
}

/** Navega sin recargar la página. */
export function irA(camino: string): void {
  history.pushState(null, '', BASE + camino)
  dispatchEvent(new PopStateEvent('popstate'))
}

/** Enlace interno: ya sabe anteponer el prefijo y no recarga la página. */
export function Enlace(props: { href: string; class?: string; 'aria-label'?: string; children: ComponentChildren }) {
  const alTocar = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    irA(props.href)
  }
  return (
    <a href={BASE + props.href} class={props.class} aria-label={props['aria-label']} onClick={alTocar}>
      {props.children}
    </a>
  )
}

/** Dibuja la pantalla que corresponde al camino actual. */
export function Enrutador({ rutas, porDefecto }: { rutas: Ruta[]; porDefecto: ComponentType }) {
  const [camino, setCamino] = useState(caminoActual())
  useEffect(() => {
    const alCambiar = () => setCamino(caminoActual())
    addEventListener('popstate', alCambiar)
    return () => removeEventListener('popstate', alCambiar)
  }, [])
  const Pantalla = rutas.find((r) => r.camino === camino)?.pantalla ?? porDefecto
  return <Pantalla />
}
