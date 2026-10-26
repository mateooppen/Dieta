# Dieta — instrucciones del proyecto

App personal (un solo usuario: Mateo) que propone qué comer en cada momento del día con los carbohidratos ya contados, a partir de un sistema de **piezas** combinables. Se usa en el teléfono, con una mano, en los minutos previos a comer. El usuario calcula su insulina por su cuenta: **la app nunca sugiere dosis ni da consejos médicos**; solo cuenta carbohidratos de forma consistente.

Todo lo que no esté decidido acá, preguntar antes de asumir. Explicar las cosas en términos simples: el usuario no es programador de profesión y pide definiciones antes de los términos técnicos. Hablarle en español rioplatense, sin "che".

## Material de referencia (leer antes de empezar)

- `piezas.json` — la fuente de datos: momentos del día con rangos, tipos, reglas de combinación, criterios y las 96 piezas. Es la tabla inicial que viaja dentro de la app. No inventar piezas ni cambiar valores.
- `docs/diseno/sistema-de-diseno.md` — reglas visuales y de voz. Cumplirlas.
- `docs/diseno/tokens.css` — variables CSS listas (colores claro/oscuro, espaciado, radios, sombras, estilos de texto). Usar siempre `var(--token)`, nunca un color literal.
- `docs/diseno/tokens.json` — los mismos tokens como datos.
- `docs/diseno/pantalla-*.html` — las tres pantallas prototipadas (Hoy, Otra comida, Mis piezas). Son referencia visual y de comportamiento, con datos de ejemplo embebidos; **no copiar el código**, reproducir el diseño con los componentes de la app.

## Arquitectura (aprobada)

- **Preact + Vite**, TypeScript. Una pantalla por archivo, un componente por archivo. Sin frameworks de UI ni librerías de componentes; CSS propio con los tokens (CSS modules o un `.css` por componente).
- **GitHub Pages** con **GitHub Actions**: cada push a `main` arma y publica. Configurar `base` de Vite para el nombre del repositorio.
- **PWA**: manifest + service worker (vite-plugin-pwa). Instalable, funciona sin internet salvo la estimación con IA.
- **Persistencia en Google Drive**, carpeta privada de la app (`appDataFolder`), un solo archivo `dieta.json`. Login con Google Identity Services (token OAuth en el navegador, mismo esquema que la app Registro-financiero del usuario). Drive es la fuente de verdad; una copia en `localStorage` sirve de caché para abrir rápido y sin conexión. Escribir en Drive después de cada cambio (con un pequeño retardo para agrupar), leer al abrir. Un solo usuario: el último que escribe gana.
- **IA**: API de Anthropic, modelo Haiku, llamada directa desde el navegador con la clave del usuario (header `anthropic-dangerous-direct-browser-access: true`). La clave se ingresa en Ajustes y se guarda dentro de `dieta.json`; nunca en el código ni en el repositorio. Sin clave o sin internet, la función se deshabilita con un aviso claro; el resto de la app funciona.
- **Pruebas**: Vitest para toda la lógica de cálculo (sumas, estado de rango, alternativas, armado de propuestas, importación del JSON). Sin pruebas de interfaz por ahora.

## Modelo de datos

`dieta.json` (en Drive) = `{ version, piezas[], historial[], ajustes }`.

- `piezas[]`: la misma forma que `piezas.json`, más `validada: boolean` (las 96 iniciales nacen con `validada: true`; las creadas por IA o a mano, `false`) y `creadaEl`. El `id` es la clave estable; no renumerar.
- `historial[]`: `{ fecha, momento, piezas: [{ id, nombre, carbohidratos }], total, origen: "propuesta" | "otra-comida" }`. Se guarda al tocar "Voy a comer esto". **No hay pantalla de historial** en esta versión; se guarda igual para variar propuestas y para mostrarle a la nutricionista.
- `ajustes`: `{ tema: "sistema" | "claro" | "oscuro", claveIA }`.

Al primer inicio, si Drive no tiene `dieta.json`, se crea desde `piezas.json`. Si una versión nueva de la app trae piezas nuevas en `piezas.json`, se agregan las que falten por `id` sin tocar las existentes (las ediciones del usuario mandan).

## Reglas de cálculo (probar con Vitest)

1. Total del plato = suma de `carbohidratos` de sus piezas. Enteros, en gramos.
2. Estado del plato respecto del rango del momento (`carbMin`–`carbMax`): `ok` dentro, `over` por encima, `under` por debajo.
3. Un **plato** de almuerzo/cena tiene 4 lugares: `principal` (obligatorio), `acompanamiento`, `verdura`, `postre` (los tres opcionales, pueden quedar vacíos).
   - `acompanamiento`: piezas de tipo `acompanamiento` con carbohidratos > 10.
   - `verdura`: piezas de tipo `acompanamiento` con carbohidratos ≤ 10.
   - `postre`: piezas de tipo `fruta` o `extra` cuyos `momentos` incluyan el momento actual.
   - Si el principal tiene `traeCarbohidratos: true`, el lugar `acompanamiento` queda vacío.
4. Desayuno y merienda: 1 bebida + 1 o 2 piezas de tipo `desayuno_merienda` o `fruta`. Colación: 1 pieza de `fruta`, `desayuno_merienda` o `extra` dentro del rango.
5. **Proponer un plato**: elegir al azar piezas válidas para cada lugar de modo que el total caiga en el rango; intentar hasta 50 combinaciones y quedarse con la primera en rango; si ninguna, devolver la más cercana al rango y marcar su estado. Evitar repetir el principal de las últimas 3 entradas del historial para ese momento, si es posible. Solo piezas cuyos `momentos` incluyan el momento actual.
6. **Alternativas para un lugar**: todas las piezas válidas para ese lugar excepto la actual, cada una con `totalNuevo` y su estado, ordenadas por cercanía en carbohidratos a la pieza actual. Para lugares opcionales, la primera opción es "Sin <rol>" (vacío) con su total resultante.
7. Marcas: `altaFibra` y `altaGrasa` se muestran como badges "Fibra" y "Grasa" (palabra completa). `mealPrep` como "Meal prep". `validada: false` como "Sin validar" en color ámbar.
8. "Para tener a mano": unir las `nota` de las piezas del plato actual que las tengan; si ninguna, "Nada que preparar de antes."

## Pantallas (ver prototipos)

1. **Hoy** (`/`): fecha, selector de momento (preseleccionado por hora: desayuno < 11, almuerzo < 16:30, merienda < 20, cena después; colación nunca por defecto), tarjeta del plato (nombre del momento, chip de estado, total grande, rango, 4 filas tocables con rol + pieza + badges + carbohidratos + flecha), "Proponer otro plato" como acción liviana al pie de la tarjeta, bloque "Para tener a mano", barra inferior con "Otra comida" (secundario) y "Voy a comer esto" (principal; al guardar pasa a "Guardado" y queda deshabilitado hasta que algo cambie). Tocar una fila abre la hoja inferior de alternativas. Íconos arriba a la derecha: Mis piezas, Ajustes, tema. **Todo entra sin desplazamiento vertical en un teléfono de 390×844.**
2. **Otra comida** (`/otra`): tarjeta "Lo que voy a comer" (total, chip, barra de rango, piezas agregadas con ×), buscador en mis piezas con resultados y botón +, cuadro "No está en la lista: describila" + "Estimar carbohidratos" → tarjeta de estimación (número, rango probable, badges, explicación corta, campo para corregir el número, casilla "Guardar como pieza nueva" marcada por defecto, "Agregar a lo que voy a comer"). Barra: "Cancelar", "Voy a comer esto" (deshabilitado si no hay nada).
3. **Mis piezas** (`/piezas`): subtítulo "N piezas · M sin validar", buscador, chips de filtro **siempre visibles** (Todas, por tipo, Sin validar), lista de tarjetas de pieza, botón principal "Agregar pieza". Tocar una pieza abre la hoja de edición: nombre, porción casera, carbohidratos (− / +), tipo, momentos, interruptores alta fibra / alta grasa / meal prep / ya trae sus carbohidratos / validada por la nutricionista, nota, Eliminar (con confirmación dentro de la hoja, no `confirm()`), Cancelar, Guardar.
4. **Ajustes** (`/ajustes`, mínima): cuenta de Google (entrar / salir, estado de sincronización), clave de la IA (campo tipo contraseña, "Probar"), tema, "Exportar respaldo" (descarga `dieta.json`) e "Importar".

Hojas inferiores: se cierran tocando el velo, con la × del encabezado y deslizando hacia abajo. Nunca `alert()`, `confirm()` ni `prompt()`.

## Estimación con IA

Prompt al modelo: la descripción del usuario, el momento del día y el rango, y las piezas existentes más parecidas (por nombre) como referencia de escala. Pedir respuesta en JSON estricto: `{ carbohidratos: entero, rangoMin, rangoMax, altaFibra, altaGrasa, porcion: texto corto, explicacion: una o dos oraciones en español, nombreSugerido }`. Mostrar siempre el rango de incertidumbre. Si la respuesta no es JSON válido, reintentar una vez y después mostrar un error claro. La pieza nueva nace con `validada: false` y `nota: "Estimada con IA el <fecha>"`.

## Forma de trabajar

- Avanzar por fases y **detenerse al final de cada una** para que el usuario pruebe y apruebe:
  1. Esqueleto: Vite + Preact + TypeScript, tokens.css, estructura de carpetas, GitHub Actions publicando una página "Hola" en Pages. **Hacer todo lo que se pueda sin intervención del usuario**: verificar e instalar herramientas (Node LTS, Git, GitHub CLI) con `winget` si faltan, iniciar el repositorio local, crear el repositorio remoto con `gh repo create` (público, nombre `Dieta`), activar Pages con origen "GitHub Actions" vía `gh api`, hacer el primer push y esperar a que el despliegue termine. Solo pedir al usuario lo que requiera su sesión personal (por ejemplo, `gh auth login` si no está autenticado), indicando exactamente qué tocar.
  2. Datos y lógica: carga de `piezas.json`, modelo, reglas de cálculo con pruebas Vitest. Sin interfaz todavía más que una lista de verificación de pruebas pasando.
  3. Pantalla Hoy completa, con caché local.
  4. Otra comida (sin IA) y Mis piezas.
  5. Google Drive + Ajustes. Indicar al usuario el paso exacto en Google Cloud (origen autorizado) en el momento en que haga falta.
  6. Estimación con IA.
  7. PWA, modo oscuro verificado en todas las pantallas, revisión final.
- Al cerrar cada fase: resumen de 3 a 5 líneas, sin detalles técnicos, de qué se hizo y qué probar. El usuario pide más detalle si lo necesita.
- Commits chicos con mensajes en español. No agregar dependencias sin decir para qué sirven en una línea.
- Si algo del diseño no se puede cumplir, decirlo antes de cambiarlo.

## Ideas anotadas para más adelante (no implementar ahora)

- Pantalla de historial.
- Lista de compras a partir de las piezas de la semana y las marcas de meal prep.
- Compartir con la nutricionista (requeriría otro esquema de datos).
