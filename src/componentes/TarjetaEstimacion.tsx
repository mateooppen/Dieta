import './TarjetaEstimacion.css'
import { useState } from 'preact/hooks'
import type { Estimacion } from '../logica/estimacion.ts'
import { Badge } from './Badge.tsx'
import { Boton } from './Boton.tsx'
import { Casilla } from './Casilla.tsx'

interface Props {
  estimacion: Estimacion
  /** Con los carbohidratos (corregidos o no) y si se guarda como pieza nueva. */
  alAgregar: (carbohidratos: number, guardar: boolean) => void
}

/** Resultado de la IA: número, rango probable, marcas, explicación, corrección y "Agregar". */
export function TarjetaEstimacion({ estimacion, alAgregar }: Props) {
  const [texto, setTexto] = useState(String(estimacion.carbohidratos))
  const [guardar, setGuardar] = useState(true)

  const numero = /^\d{1,4}$/.test(texto.trim()) ? Number(texto.trim()) : null
  const mismoRango = estimacion.rangoMin === estimacion.rangoMax

  return (
    <section class="tarjeta-estimacion" aria-label="Estimación con IA">
      <span class="label tarjeta-estimacion__rol">Estimación con IA</span>
      {estimacion.nombreSugerido && (
        <span class="body-strong">
          {estimacion.nombreSugerido}
          {estimacion.porcion && <span class="meta texto-apagado"> · {estimacion.porcion}</span>}
        </span>
      )}
      <div class="tarjeta-estimacion__numero">
        <span class="num carb-lg">
          {estimacion.carbohidratos}
          <span class="tarjeta-estimacion__unidad"> g</span>
        </span>
        <span class="meta texto-apagado">
          {mismoRango ? 'sin margen indicado' : `probablemente entre ${estimacion.rangoMin} y ${estimacion.rangoMax} g`}
        </span>
      </div>
      {(estimacion.altaFibra || estimacion.altaGrasa) && (
        <div class="tarjeta-estimacion__marcas">
          {estimacion.altaFibra && <Badge texto="Fibra" tono="fibra" />}
          {estimacion.altaGrasa && <Badge texto="Grasa" tono="grasa" />}
        </div>
      )}
      {estimacion.explicacion && <span class="meta texto-apagado">{estimacion.explicacion}</span>}
      <div class="tarjeta-estimacion__corregir">
        <label for="carb-corregidos" class="meta texto-apagado">
          Si no coincide, corregilo:
        </label>
        <div class="tarjeta-estimacion__campo">
          <input
            id="carb-corregidos"
            class="body num"
            type="text"
            inputMode="numeric"
            autocomplete="off"
            value={texto}
            onInput={(e) => setTexto((e.currentTarget as HTMLInputElement).value)}
          />
          <span class="texto-apagado">g</span>
        </div>
      </div>
      {numero === null && <span class="meta tarjeta-estimacion__aviso">Escribí un número entero de gramos.</span>}
      <Casilla marcada={guardar} alCambiar={setGuardar}>
        Guardar como pieza nueva <span class="texto-apagado">(queda "Sin validar")</span>
      </Casilla>
      <Boton tipo="secundario" deshabilitado={numero === null} alTocar={() => numero !== null && alAgregar(numero, guardar)}>
        Agregar a lo que voy a comer
      </Boton>
    </section>
  )
}
