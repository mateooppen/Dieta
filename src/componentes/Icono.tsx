/** Íconos del set Lucide (lucide.dev, licencia ISC), dibujados a mano como trazos de 2 px en caja de 24. */

const TRAZOS = {
  lista: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  ajustes: 'M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4',
  luna: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
  sol: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  chevron: 'm9 18 6-6-6-6',
  mezclar: 'M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22M18 2l4 4-4 4M2 6h1.9c1.5 0 2.9.9 3.6 2.2M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8M18 14l4 4-4 4',
  cerrar: 'M18 6 6 18M6 6l12 12',
  volver: 'm12 19-7-7 7-7M19 12H5',
  atras: 'm15 6-6 6 6 6',
  buscar: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4-4',
  mas: 'M12 5v14M5 12h14',
  chispas: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z',
  tilde: 'm5 12 5 5L20 7',
} as const

export type NombreIcono = keyof typeof TRAZOS

interface Props {
  nombre: NombreIcono
  tamano?: number
}

export function Icono({ nombre, tamano = 24 }: Props) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  )
}
