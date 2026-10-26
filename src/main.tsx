import { render } from 'preact'
import './estilos/tokens.css'
import './estilos/base.css'
import { almacen } from './datos/almacen.ts'
import { Enrutador } from './componentes/Enrutador.tsx'
import { aplicarTema } from './logica/tema.ts'
import { Hoy } from './pantallas/Hoy.tsx'
import { Pendiente } from './pantallas/Pendiente.tsx'

// El tema se aplica antes de dibujar y cada vez que cambia, para que no parpadee.
aplicarTema(almacen.obtener().ajustes.tema, document.documentElement)
almacen.suscribir(() => aplicarTema(almacen.obtener().ajustes.tema, document.documentElement))

const rutas = [
  { camino: '/', pantalla: Hoy },
  { camino: '/otra', pantalla: Pendiente },
  { camino: '/piezas', pantalla: Pendiente },
  { camino: '/ajustes', pantalla: Pendiente },
]

render(<Enrutador rutas={rutas} porDefecto={Hoy} />, document.getElementById('app')!)
