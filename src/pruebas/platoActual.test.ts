import { describe, expect, it } from 'vitest'
import type { Deposito } from '../datos/almacen.ts'
import { PIEZAS_BASE } from '../datos/piezas.ts'
import { CLAVE_PLATO_ACTUAL, cargarPlatoActual, fechaCorta, guardarPlatoActual } from '../datos/platoActual.ts'
import { conPieza, platoVacio } from '../logica/lugares.ts'

function deposito(): Deposito & { datos: Record<string, string> } {
  const datos: Record<string, string> = {}
  return { datos, getItem: (k) => datos[k] ?? null, setItem: (k, v) => void (datos[k] = v) }
}

const mila = PIEZAS_BASE.find((p) => p.id === 'milanesa-de-pollo-o-carne-al-horno')!
const arroz = PIEZAS_BASE.find((p) => p.tipo === 'acompanamiento' && p.carbohidratos > 10)!

describe('plato actual por momento y día', () => {
  it('sin nada guardado devuelve null', () => {
    expect(cargarPlatoActual(deposito(), 'cena', PIEZAS_BASE, '2026-10-26')).toBeNull()
    expect(cargarPlatoActual(null, 'cena', PIEZAS_BASE, '2026-10-26')).toBeNull()
  })

  it('guarda y recupera el mismo plato, con lugares vacíos incluidos', () => {
    const d = deposito()
    let plato = platoVacio('cena')
    plato = conPieza(plato, 'principal', mila)
    plato = conPieza(plato, 'acompanamiento', arroz)
    guardarPlatoActual(d, plato, '2026-10-26')
    const cargado = cargarPlatoActual(d, 'cena', PIEZAS_BASE, '2026-10-26')
    expect(cargado).toEqual(plato)
    expect(cargarPlatoActual(d, 'almuerzo', PIEZAS_BASE, '2026-10-26')).toBeNull()
  })

  it('guarda un plato por momento sin pisar los otros', () => {
    const d = deposito()
    guardarPlatoActual(d, conPieza(platoVacio('cena'), 'principal', mila), '2026-10-26')
    guardarPlatoActual(d, conPieza(platoVacio('almuerzo'), 'principal', mila), '2026-10-26')
    expect(cargarPlatoActual(d, 'cena', PIEZAS_BASE, '2026-10-26')).not.toBeNull()
    expect(cargarPlatoActual(d, 'almuerzo', PIEZAS_BASE, '2026-10-26')).not.toBeNull()
  })

  it('al día siguiente se descarta', () => {
    const d = deposito()
    guardarPlatoActual(d, conPieza(platoVacio('cena'), 'principal', mila), '2026-10-26')
    expect(cargarPlatoActual(d, 'cena', PIEZAS_BASE, '2026-10-27')).toBeNull()
    guardarPlatoActual(d, conPieza(platoVacio('almuerzo'), 'principal', mila), '2026-10-27')
    expect(JSON.parse(d.datos[CLAVE_PLATO_ACTUAL]).platos.cena).toBeUndefined()
  })

  it('si la pieza principal ya no existe, no sirve; si falta una opcional, queda vacía', () => {
    const d = deposito()
    let plato = conPieza(platoVacio('cena'), 'principal', mila)
    plato = conPieza(plato, 'acompanamiento', arroz)
    guardarPlatoActual(d, plato, '2026-10-26')
    const sinMila = PIEZAS_BASE.filter((p) => p.id !== mila.id)
    expect(cargarPlatoActual(d, 'cena', sinMila, '2026-10-26')).toBeNull()
    const sinArroz = PIEZAS_BASE.filter((p) => p.id !== arroz.id)
    const cargado = cargarPlatoActual(d, 'cena', sinArroz, '2026-10-26')!
    expect(cargado.lugares.find((l) => l.rol === 'acompanamiento')!.pieza).toBeNull()
  })

  it('caché rota se ignora', () => {
    const d = deposito()
    d.datos[CLAVE_PLATO_ACTUAL] = '{rota'
    expect(cargarPlatoActual(d, 'cena', PIEZAS_BASE, '2026-10-26')).toBeNull()
  })

  it('fecha corta local', () => {
    expect(fechaCorta(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})
