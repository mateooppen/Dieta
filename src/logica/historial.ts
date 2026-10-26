import { piezasDelPlato, totalDelPlato } from './calculo.ts'
import type { EntradaHistorial, Plato } from './tipos.ts'

/** Arma la entrada del historial que se guarda al tocar "Voy a comer esto". */
export function entradaDesdePlato(plato: Plato, fecha: string, origen: EntradaHistorial['origen']): EntradaHistorial {
  return {
    fecha,
    momento: plato.momento,
    piezas: piezasDelPlato(plato).map((p) => ({ id: p.id, nombre: p.nombre, carbohidratos: p.carbohidratos })),
    total: totalDelPlato(plato),
    origen,
  }
}
