import { describe, expect, it } from 'vitest'
import { PIEZAS_BASE, USO_BASE, momentoPorId } from '../datos/piezas.ts'
import { alternativasParaLugar } from '../logica/alternativas.ts'
import { importarDieta } from '../logica/dieta.ts'
import { admiteLeche, conPieza, lugarRequerido, lugarVisible, platoCompleto, piezaDelRol, piezasValidasParaLugar, platoVacio, textoVacio } from '../logica/lugares.ts'
import { proponerPlato } from '../logica/propuesta.ts'
import type { Pieza } from '../logica/tipos.ts'
import { azarFijo } from './ayuda.ts'

const desayuno = momentoPorId('desayuno')
const merienda = momentoPorId('merienda')
const p = (id: string): Pieza => {
  const x = PIEZAS_BASE.find((y) => y.id === id)
  if (!x) throw new Error(id)
  return x
}
const ids = (lista: Pieza[]) => lista.map((x) => x.id).sort()
const usosDe = (lista: Pieza[]) => new Set(lista.map((x) => (x.tipo === 'fruta' ? 'fruta' : x.uso)))

describe('clase de cada pieza de desayuno/merienda', () => {
  it('todas las ids de la tabla de clases existen', () => {
    for (const id of Object.keys(USO_BASE)) expect(PIEZAS_BASE.some((x) => x.id === id)).toBe(true)
  })
  it('una dieta guardada antes de las clases las recibe al abrirse', () => {
    const vieja = { piezas: [{ ...p('manteca'), uso: undefined }, { ...p('medialuna'), uso: undefined }] }
    const r = importarDieta(JSON.stringify(vieja))
    expect(r.ok && r.dieta.piezas.map((x) => x.uso)).toEqual(['encima', 'sola'])
  })
  it('una clase cambiada por el usuario se respeta', () => {
    const r = importarDieta(JSON.stringify({ piezas: [{ ...p('palta'), uso: 'sola' }] }))
    expect(r.ok && r.dieta.piezas[0].uso).toBe('sola')
  })
})

describe('"Para comer"', () => {
  it('nunca ofrece algo para untar ni la leche', () => {
    const lista = piezasValidasParaLugar(PIEZAS_BASE, 'solido', desayuno)
    expect(usosDe(lista)).toEqual(new Set(['base', 'sola', 'lacteo', 'con-lacteo', 'fruta']))
    expect(lista.map((x) => x.id)).not.toContain('manteca')
    expect(lista.map((x) => x.id)).not.toContain('leche-descremada')
  })
})

describe('"Para acompañar" según lo que hay para comer', () => {
  const con = (id: string) => piezasValidasParaLugar(PIEZAS_BASE, 'segundo', desayuno, conPieza(platoVacio('desayuno'), 'solido', p(id)))

  it('con pan: solo cosas para poner encima', () => {
    expect(usosDe(con('pan-lactal-integral'))).toEqual(new Set(['encima']))
    expect(ids(con('pan-lactal-integral'))).toContain('dulce-de-leche')
  })
  it('con avena: yogur o leche', () => {
    expect(ids(con('avena-arrollada'))).toEqual(['leche-descremada', 'yogur-con-sabor-comun', 'yogur-natural-o-sin-azucar'])
  })
  it('con algo que se come solo o un yogur: una fruta', () => {
    expect(usosDe(con('medialuna'))).toEqual(new Set(['fruta']))
    expect(usosDe(con('yogur-natural-o-sin-azucar'))).toEqual(new Set(['fruta']))
  })
  it('con una fruta: un yogur o algo que se come solo', () => {
    expect(usosDe(con('banana'))).toEqual(new Set(['lacteo', 'sola']))
  })
  it('cambiar el pan por una medialuna saca la manteca', () => {
    let plato = conPieza(platoVacio('desayuno'), 'solido', p('pan-frances-mignon'))
    plato = conPieza(plato, 'segundo', p('manteca'))
    plato = conPieza(plato, 'solido', p('medialuna'))
    expect(piezaDelRol(plato, 'segundo')).toBeNull()
  })
  it('con avena el acompañamiento es obligatorio y no se ofrece dejarlo vacío', () => {
    const plato = conPieza(platoVacio('desayuno'), 'solido', p('avena-arrollada'))
    expect(lugarRequerido(plato, 'segundo')).toBe(true)
    expect(alternativasParaLugar(plato, 'segundo', PIEZAS_BASE, desayuno).some((a) => a.pieza === null)).toBe(false)
  })
})

describe('leche en la bebida', () => {
  it('solo con café, té o mate cocido', () => {
    expect(admiteLeche(p('cafe-solo-con-edulcorante'))).toBe(true)
    expect(admiteLeche(p('te'))).toBe(true)
    expect(admiteLeche(p('mate-amargo-o-con-edulcorante'))).toBe(false)
    expect(admiteLeche(p('agua-soda'))).toBe(false)
  })
  it('la fila se ve con café y se oculta con agua; cambiar a agua saca la leche', () => {
    let plato = conPieza(platoVacio('desayuno'), 'bebida', p('cafe-solo-con-edulcorante'))
    expect(ids(piezasValidasParaLugar(PIEZAS_BASE, 'conBebida', desayuno, plato))).toEqual(['leche-descremada'])
    plato = conPieza(plato, 'conBebida', p('leche-descremada'))
    plato = conPieza(plato, 'bebida', p('agua-soda'))
    expect(piezaDelRol(plato, 'conBebida')).toBeNull()
    expect(lugarVisible(plato, plato.lugares.find((l) => l.rol === 'conBebida')!)).toBe(false)
  })
  it('textos de lugar vacío', () => {
    expect(textoVacio('conBebida')).toBe('Nada en la bebida')
    expect(textoVacio('postre')).toBe('Sin postre')
  })
})

describe('propuestas de desayuno y merienda', () => {
  it('en 400 propuestas no aparece nada para untar sin pan, ni dos dulces, ni avena sola, ni leche sin café o té', () => {
    for (const momento of [desayuno, merienda]) {
      for (let semilla = 1; semilla <= 200; semilla++) {
        const r = proponerPlato(PIEZAS_BASE, momento, [], azarFijo(semilla))
        expect(r).not.toBeNull()
        const plato = r!.plato
        const comer = piezaDelRol(plato, 'solido')!
        const acompana = piezaDelRol(plato, 'segundo')
        const leche = piezaDelRol(plato, 'conBebida')
        expect(comer.tipo === 'fruta' || ['base', 'sola', 'lacteo', 'con-lacteo'].includes(comer.uso)).toBe(true)
        if (acompana?.uso === 'encima') expect(comer.uso).toBe('base')
        if (comer.uso === 'con-lacteo') expect(acompana).not.toBeNull()
        if (leche) expect(admiteLeche(piezaDelRol(plato, 'bebida'))).toBe(true)
      }
    }
  })
})

describe('plato completo', () => {
  it('con avena sin yogur ni leche no está completo; al elegir uno, sí', () => {
    let plato = conPieza(platoVacio('desayuno'), 'bebida', p('te'))
    plato = conPieza(plato, 'solido', p('avena-arrollada'))
    expect(platoCompleto(plato)).toBe(false)
    plato = conPieza(plato, 'segundo', p('yogur-natural-o-sin-azucar'))
    expect(platoCompleto(plato)).toBe(true)
  })
  it('los lugares opcionales vacíos no lo dejan incompleto', () => {
    let plato = conPieza(platoVacio('desayuno'), 'bebida', p('te'))
    plato = conPieza(plato, 'solido', p('medialuna'))
    expect(platoCompleto(plato)).toBe(true)
  })
})
