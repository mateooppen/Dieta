import { piezasDelPlato, totalDePiezas } from './calculo.ts'
import type { EntradaHistorial, MomentoId, Pieza, Plato } from './tipos.ts'

/** Arma una entrada del historial a partir de una lista de piezas (Otra comida). */
export function entradaDesdePiezas(piezas: Pieza[], momento: MomentoId, fecha: string, origen: EntradaHistorial['origen']): EntradaHistorial {
  return {
    fecha,
    momento,
    piezas: piezas.map((p) => ({ id: p.id, nombre: p.nombre, carbohidratos: p.carbohidratos })),
    total: totalDePiezas(piezas),
    origen,
  }
}

/** Arma la entrada del historial que se guarda al tocar "Voy a comer esto" en Hoy. */
export function entradaDesdePlato(plato: Plato, fecha: string, origen: EntradaHistorial['origen']): EntradaHistorial {
  return entradaDesdePiezas(piezasDelPlato(plato), plato.momento, fecha, origen)
}
