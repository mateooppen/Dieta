import './Contador.css'

interface Props {
  id: string
  etiqueta: string
  valor: number
  alCambiar: (valor: number) => void
  /** Suma o resta sobre el valor más reciente, para que varios toques seguidos no se pisen. */
  alAjustar: (delta: number) => void
  unidad?: string
}

/** Número con botones − y +, y el campo editable en el medio. Nunca baja de 0. */
export function Contador({ id, etiqueta, valor, alCambiar, alAjustar, unidad = 'g' }: Props) {
  const fijar = (n: number) => alCambiar(Math.max(0, Math.round(n)))
  return (
    <div class="contador">
      <label for={id} class="label contador__etiqueta">
        {etiqueta}
      </label>
      <div class="contador__caja">
        <button type="button" class="contador__boton" aria-label="Restar 1" onClick={() => alAjustar(-1)}>
          −
        </button>
        <input
          id={id}
          class="contador__entrada num"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={valor}
          onInput={(e) => {
            const n = Number((e.currentTarget as HTMLInputElement).value)
            if (Number.isFinite(n)) fijar(n)
          }}
        />
        <span class="body contador__unidad">{unidad}</span>
        <button type="button" class="contador__boton" aria-label="Sumar 1" onClick={() => alAjustar(1)}>
          +
        </button>
      </div>
    </div>
  )
}
