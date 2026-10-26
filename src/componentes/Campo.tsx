import './Campo.css'
import { Icono, type NombreIcono } from './Icono.tsx'

interface Props {
  id: string
  valor: string
  alCambiar: (valor: string) => void
  etiqueta?: string
  /** Etiqueta solo para lectores de pantalla, cuando no se muestra una visible. */
  etiquetaOculta?: string
  sugerencia?: string
  icono?: NombreIcono
  tipo?: 'text' | 'search'
  multilinea?: boolean
}

/** Campo de texto sobre fondo hundido, con etiqueta en mayúsculas arriba si se pasa. */
export function Campo({ id, valor, alCambiar, etiqueta, etiquetaOculta, sugerencia, icono, tipo = 'text', multilinea = false }: Props) {
  const entrada = multilinea ? (
    <textarea
      id={id}
      class="campo__entrada campo__entrada--area body"
      rows={3}
      value={valor}
      placeholder={sugerencia}
      aria-label={etiquetaOculta}
      onInput={(e) => alCambiar((e.currentTarget as HTMLTextAreaElement).value)}
    />
  ) : (
    <div class="campo__caja">
      {icono && (
        <span class="campo__icono">
          <Icono nombre={icono} tamano={22} />
        </span>
      )}
      <input
        id={id}
        class="campo__entrada body"
        type={tipo}
        value={valor}
        placeholder={sugerencia}
        aria-label={etiquetaOculta}
        autocomplete="off"
        onInput={(e) => alCambiar((e.currentTarget as HTMLInputElement).value)}
      />
    </div>
  )
  return (
    <div class="campo">
      {etiqueta && (
        <label for={id} class="label campo__etiqueta">
          {etiqueta}
        </label>
      )}
      {entrada}
    </div>
  )
}
