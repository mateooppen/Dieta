import { render } from 'preact'
import './estilos/tokens.css'
import './estilos/base.css'
import { almacen } from './datos/almacen.ts'
import { sincronizador } from './datos/sincronizacion.ts'
import { Enrutador } from './componentes/Enrutador.tsx'
import { aplicarTema } from './logica/tema.ts'
import { Ajustes } from './pantallas/Ajustes.tsx'
import { Hoy } from './pantallas/Hoy.tsx'
import { MisPiezas } from './pantallas/MisPiezas.tsx'
import { OtraComida } from './pantallas/OtraComida.tsx'

// El tema se aplica antes de dibujar y cada vez que cambia, para que no parpadee.
aplicarTema(almacen.obtener().ajustes.tema, document.documentElement)
almacen.suscribir(() => aplicarTema(almacen.obtener().ajustes.tema, document.documentElement))

const rutas = [
  { camino: '/', pantalla: Hoy },
  { camino: '/otra', pantalla: OtraComida },
  { camino: '/piezas', pantalla: MisPiezas },
  { camino: '/ajustes', pantalla: Ajustes },
]

render(<Enrutador rutas={rutas} porDefecto={Hoy} />, document.getElementById('app')!)

// Con sesión de Google, lee Drive al abrir (la pantalla ya está dibujada con la caché local).
void sincronizador.iniciar()
