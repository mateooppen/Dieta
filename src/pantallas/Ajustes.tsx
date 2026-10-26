import './Ajustes.css'
import { useEffect, useRef, useState } from 'preact/hooks'
import { useDieta } from '../datos/almacen.ts'
import { cargarGoogle, googleListo } from '../datos/google.ts'
import { probarClave } from '../datos/ia.ts'
import { sincronizador, useSincronizacion } from '../datos/sincronizacion.ts'
import { Boton } from '../componentes/Boton.tsx'
import { ChipOpcion } from '../componentes/ChipOpcion.tsx'
import { Encabezado } from '../componentes/Encabezado.tsx'
import { importarDieta } from '../logica/dieta.ts'
import { fusionarAjustesAlImportar, nombreDeRespaldo, textoDeRespaldo } from '../logica/respaldo.ts'
import type { Tema } from '../logica/tema.ts'

const TEMAS: { id: Tema; nombre: string }[] = [
  { id: 'sistema', nombre: 'Como el teléfono' },
  { id: 'claro', nombre: 'Claro' },
  { id: 'oscuro', nombre: 'Oscuro' },
]

/** Cuenta de Google, clave de la IA, tema y respaldo. */
export function Ajustes() {
  const [dieta, cambiarDieta] = useDieta()
  const sync = useSincronizacion()
  const [ocupado, setOcupado] = useState(false)
  const [errorCuenta, setErrorCuenta] = useState<string | null>(null)
  const [resultadoClave, setResultadoClave] = useState<string | null>(null)
  const [probando, setProbando] = useState(false)
  const [mensajeRespaldo, setMensajeRespaldo] = useState<string | null>(null)
  const [pendienteImportar, setPendienteImportar] = useState<{ nombre: string; texto: string } | null>(null)
  const selectorArchivo = useRef<HTMLInputElement>(null)

  // La librería de Google se carga al abrir Ajustes, así el toque en "Entrar" abre la ventana al instante.
  const [preparandoGoogle, setPreparandoGoogle] = useState(() => !googleListo())
  useEffect(() => {
    if (!preparandoGoogle) return
    cargarGoogle()
      .catch(() => {
        // Sin internet: el botón queda disponible y el toque reintenta la carga.
      })
      .finally(() => setPreparandoGoogle(false))
  }, [])

  const conSesion = sync.estado !== 'sin-sesion'

  const entrar = async () => {
    setOcupado(true)
    setErrorCuenta(null)
    // Sin esperas antes de esta llamada: la ventana de Google tiene que abrirse dentro del toque.
    const problema = await sincronizador.entrar()
    setErrorCuenta(problema)
    setOcupado(false)
  }
  const salir = async () => {
    setOcupado(true)
    await sincronizador.salir()
    setErrorCuenta(null)
    setOcupado(false)
  }

  const fijarClave = (clave: string) => {
    cambiarDieta((d) => ({ ...d, ajustes: { ...d.ajustes, claveIA: clave } }))
    setResultadoClave(null)
  }
  const probar = async () => {
    setProbando(true)
    const r = await probarClave(dieta.ajustes.claveIA)
    setResultadoClave(r.ok ? 'La clave funciona.' : r.error)
    setProbando(false)
  }

  const fijarTema = (tema: Tema) => cambiarDieta((d) => ({ ...d, ajustes: { ...d.ajustes, tema } }))

  const exportar = () => {
    const blob = new Blob([textoDeRespaldo(dieta)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreDeRespaldo(new Date())
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMensajeRespaldo('Respaldo descargado. La clave de la IA no va en el archivo.')
  }

  const elegirArchivo = async (e: Event) => {
    const archivo = (e.currentTarget as HTMLInputElement).files?.[0]
    ;(e.currentTarget as HTMLInputElement).value = ''
    if (!archivo) return
    const texto = await archivo.text()
    const r = importarDieta(texto)
    if (!r.ok) {
      setMensajeRespaldo(`No se pudo leer el respaldo: ${r.error}`)
      return
    }
    setMensajeRespaldo(null)
    setPendienteImportar({ nombre: archivo.name, texto })
  }

  const confirmarImportar = () => {
    if (!pendienteImportar) return
    const r = importarDieta(pendienteImportar.texto)
    if (r.ok) {
      cambiarDieta((d) => fusionarAjustesAlImportar(r.dieta, d))
      void sincronizador.subirAhora()
      setMensajeRespaldo(`Respaldo importado: ${r.dieta.piezas.length} piezas y ${r.dieta.historial.length} comidas en el historial.`)
    }
    setPendienteImportar(null)
  }

  return (
    <div class="pantalla">
      <div class="pantalla__contenido ajustes">
        <Encabezado titulo="Ajustes" />

        <section class="ajustes__seccion" aria-label="Cuenta de Google">
          <span class="label ajustes__titulo">Cuenta de Google</span>
          <span class="body">{sync.detalle}</span>
          {sync.ultimoGuardado && <span class="meta texto-apagado">Último guardado en Drive: {sync.ultimoGuardado}.</span>}
          {errorCuenta && (
            <span class="body ajustes__error" role="alert">
              {errorCuenta}
            </span>
          )}
          <div class="ajustes__acciones">
            {conSesion && sync.estado !== 'sesion-vencida' ? (
              <Boton tipo="secundario" deshabilitado={ocupado} alTocar={salir}>
                Salir de la cuenta
              </Boton>
            ) : (
              <Boton tipo="primario" deshabilitado={ocupado || preparandoGoogle} alTocar={entrar}>
                {preparandoGoogle ? 'Preparando…' : ocupado ? 'Esperando a Google…' : sync.estado === 'sesion-vencida' ? 'Entrar de nuevo' : 'Entrar con Google'}
              </Boton>
            )}
          </div>
          <span class="meta texto-apagado">Los datos se guardan en una carpeta privada de tu Drive que solo ve esta app.</span>
        </section>

        <section class="ajustes__seccion" aria-label="Clave de la IA">
          <span class="label ajustes__titulo">Clave de la IA</span>
          <div class="ajustes__clave">
            <input
              id="clave-ia"
              class="ajustes__entrada body"
              type="password"
              autocomplete="off"
              placeholder="sk-ant-…"
              aria-label="Clave de la API de Anthropic"
              value={dieta.ajustes.claveIA}
              onInput={(e) => fijarClave((e.currentTarget as HTMLInputElement).value)}
            />
            <Boton tipo="secundario" deshabilitado={probando || dieta.ajustes.claveIA.trim() === ''} alTocar={probar}>
              {probando ? 'Probando…' : 'Probar'}
            </Boton>
          </div>
          {resultadoClave && (
            <span class={`body ${resultadoClave === 'La clave funciona.' ? 'ajustes__ok' : 'ajustes__error'}`} role="status">
              {resultadoClave}
            </span>
          )}
          <span class="meta texto-apagado">Sirve para estimar carbohidratos de comidas que no están en la lista. Sin clave, el resto de la app funciona igual.</span>
        </section>

        <section class="ajustes__seccion" aria-label="Tema">
          <span class="label ajustes__titulo">Tema</span>
          <div class="chips-grupo">
            {TEMAS.map((t) => (
              <ChipOpcion key={t.id} texto={t.nombre} activo={dieta.ajustes.tema === t.id} alTocar={() => fijarTema(t.id)} />
            ))}
          </div>
        </section>

        <section class="ajustes__seccion" aria-label="Respaldo">
          <span class="label ajustes__titulo">Respaldo</span>
          <div class="ajustes__acciones">
            <Boton tipo="secundario" alTocar={exportar}>
              Exportar respaldo
            </Boton>
            <Boton tipo="secundario" alTocar={() => selectorArchivo.current?.click()}>
              Importar
            </Boton>
            <input ref={selectorArchivo} type="file" accept="application/json,.json" class="ajustes__archivo" onChange={elegirArchivo} aria-hidden="true" tabIndex={-1} />
          </div>
          {pendienteImportar && (
            <div class="ajustes__confirmar" role="alert">
              <span class="body">¿Reemplazar todo (piezas, historial) por lo que hay en {pendienteImportar.nombre}? Lo de ahora se pierde.</span>
              <div class="ajustes__acciones">
                <Boton tipo="liviano" alTocar={() => setPendienteImportar(null)}>
                  No
                </Boton>
                <Boton tipo="secundario" alTocar={confirmarImportar}>
                  Sí, reemplazar
                </Boton>
              </div>
            </div>
          )}
          {mensajeRespaldo && (
            <span class="body" role="status">
              {mensajeRespaldo}
            </span>
          )}
          <span class="meta texto-apagado">El respaldo es un archivo que podés guardar donde quieras o mandarle a la nutricionista.</span>
        </section>
      </div>
    </div>
  )
}
