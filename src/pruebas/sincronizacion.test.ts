import { describe, expect, it } from 'vitest'
import { mensajeErrorGoogle, tokenVigente } from '../datos/google.ts'
import { accionAlAbrir, dietaAlAbrir } from '../datos/sincronizacion.ts'
import { crearDietaInicial } from '../logica/dieta.ts'
import { fusionarAjustesAlImportar, nombreDeRespaldo, textoDeRespaldo } from '../logica/respaldo.ts'

describe('token de Google', () => {
  it('sirve hasta un minuto antes de vencer', () => {
    const vence = 1_000_000
    expect(tokenVigente({ token: 'abc', vence }, vence - 120_000)).toBe('abc')
    expect(tokenVigente({ token: 'abc', vence }, vence - 30_000)).toBeNull()
    expect(tokenVigente({ token: 'abc', vence }, vence + 1)).toBeNull()
    expect(tokenVigente(null, 0)).toBeNull()
    expect(tokenVigente({ token: 'abc' } as never, 0)).toBeNull()
  })
})

describe('qué queda al abrir con Drive', () => {
  it('sin archivo o roto, null', () => {
    expect(dietaAlAbrir(null)).toBeNull()
    expect(dietaAlAbrir('{roto')).toBeNull()
  })

  it('lo de Drive manda y se suman las piezas base nuevas', () => {
    const d = crearDietaInicial()
    d.piezas[0].carbohidratos = 123
    d.piezas = d.piezas.slice(0, 50)
    const r = dietaAlAbrir(JSON.stringify(d))!
    expect(r.piezas).toHaveLength(96)
    expect(r.piezas[0].carbohidratos).toBe(123)
  })
})

describe('respaldo', () => {
  it('nombre con la fecha', () => {
    expect(nombreDeRespaldo(new Date(2026, 9, 26))).toBe('dieta-2026-10-26.json')
  })

  it('el archivo no lleva la clave de la IA', () => {
    const d = crearDietaInicial()
    d.ajustes.claveIA = 'sk-ant-secreta'
    const texto = textoDeRespaldo(d)
    expect(texto).not.toContain('sk-ant-secreta')
    expect(JSON.parse(texto).piezas).toHaveLength(96)
  })

  it('al importar se conservan la clave y el tema del teléfono', () => {
    const actual = crearDietaInicial()
    actual.ajustes = { tema: 'oscuro', claveIA: 'sk-ant-mia' }
    const importada = crearDietaInicial()
    importada.ajustes = { tema: 'claro', claveIA: '' }
    expect(fusionarAjustesAlImportar(importada, actual).ajustes).toEqual({ tema: 'oscuro', claveIA: 'sk-ant-mia' })
  })
})

describe('mensajeErrorGoogle', () => {
  it('explica la ventana cerrada y el permiso de Drive sin marcar', () => {
    expect(mensajeErrorGoogle('popup_closed')).toContain('Se cerró la ventana')
    expect(mensajeErrorGoogle('sin_permiso_drive')).toContain('permiso de Drive')
  })
  it('no deja el mensaje vacío ante un problema desconocido', () => {
    expect(mensajeErrorGoogle('raro')).toContain('raro')
    expect(mensajeErrorGoogle(undefined)).toBe('No se pudo entrar con Google.')
  })
})

describe('qué hacer con Drive al abrir', () => {
  const base = { haySesion: true, tokenVigente: true, enLinea: true, cambiosSinSubir: false }
  it('sin sesión no hace nada', () => {
    expect(accionAlAbrir({ ...base, haySesion: false })).toBe('nada')
  })
  it('sin internet avisa "sin conexión", aunque el token haya vencido', () => {
    expect(accionAlAbrir({ ...base, enLinea: false, tokenVigente: false })).toBe('sin-conexion')
  })
  it('con el token vencido, lo renueva', () => {
    expect(accionAlAbrir({ ...base, tokenVigente: false })).toBe('renovar')
  })
  it('lee Drive, salvo que haya cambios del teléfono sin subir: esos son lo más nuevo y se suben', () => {
    expect(accionAlAbrir(base)).toBe('leer')
    expect(accionAlAbrir({ ...base, cambiosSinSubir: true })).toBe('subir')
  })
})
