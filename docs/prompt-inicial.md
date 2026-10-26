# Prompt inicial para Claude Code

Abrí la carpeta `Dieta` en VSCode, abrí Claude Code con esa carpeta como raíz y pegá todo lo que sigue como primer mensaje.

---

Sos el desarrollador de este proyecto. Trabajás en Windows, en la carpeta `Dieta`, que es la raíz del proyecto.

Antes de cualquier otra cosa, leé completos `CLAUDE.md`, `piezas.json` y todo lo que hay en `docs/` (incluidos los tres `docs/diseno/pantalla-*.html`, que son prototipos de referencia, no código para copiar). Lo que dice `CLAUDE.md` manda sobre cualquier otra fuente y sobre tus propias preferencias.

Tu objetivo en esta sesión es dejar la **fase 1 terminada y publicada** sin que yo tenga que hacer nada a mano, salvo lo que exija mi sesión personal. Hacelo en este orden:

1. **Resumen de entendimiento.** En no más de 8 líneas y sin términos técnicos, contame qué vas a construir en el proyecto completo y qué incluye la fase 1. Después seguí sin esperar mi respuesta: si veo algo mal, te interrumpo.

2. **Herramientas.** Verificá si están instalados Node.js (versión LTS), Git y GitHub CLI (`gh`). Lo que falte, instalalo con `winget` y volvé a verificar. Si `gh` no está autenticado, corré `gh auth login` y decime exactamente qué tengo que hacer en el navegador; es lo único que no podés hacer por mí. Confirmá también que Git tiene nombre y correo configurados; si no, usá los de mi cuenta de GitHub.

3. **Proyecto.** Creá el proyecto con Vite + Preact + TypeScript en esta misma carpeta (sin crear una subcarpeta), sin borrar ni mover `CLAUDE.md`, `piezas.json` ni `docs/`. Mové `docs/diseno/tokens.css` a donde corresponda dentro del código fuente (dejando una copia en `docs/diseno/`) y cargalo globalmente. Agregá un `.gitignore` adecuado. Estructura de carpetas pensada para lo que viene: una carpeta para pantallas, otra para componentes, otra para la lógica de cálculo, otra para datos y otra para pruebas. Configurá Vitest aunque todavía no haya pruebas. Dejá una pantalla inicial mínima que use los tokens (fondo, letra Atkinson Hyperlegible desde Google Fonts, un título "Dieta" y el texto "Fase 1 publicada"), que se vea bien en claro y en oscuro.

4. **Repositorio y publicación.** Iniciá Git, creá el repositorio remoto público `Dieta` en mi cuenta de GitHub con `gh repo create`, configurá `base` de Vite para `/Dieta/`, agregá un flujo de GitHub Actions que arme y publique en GitHub Pages en cada push a `main`, activá Pages con origen "GitHub Actions" usando `gh api` (no me pidas que entre a la configuración web), hacé el commit inicial con mensaje en español y empujalo. Esperá a que el flujo termine (`gh run watch`), y si falla, arreglalo y volvé a empujar hasta que quede verde.

5. **Verificación.** Comprobá que `https://mateooppen.github.io/Dieta/` responde y muestra la pantalla inicial. Si el usuario de GitHub no fuera `mateooppen`, usá el correcto y decímelo.

6. **Cierre.** Dame un resumen de 3 a 5 líneas, sin detalles técnicos: qué quedó hecho, la dirección para abrir en el teléfono, y qué tengo que probar. Después detenete: no arranques la fase 2 hasta que yo la apruebe.

Reglas para toda la sesión: explicame las cosas sin términos técnicos y definí cualquier término antes de usarlo; no me digas "che"; si algo de lo pedido no se puede hacer desde acá, decime qué y por qué en una línea en vez de buscar una vuelta rara; no agregues dependencias sin decir en una línea para qué sirven; no uses `alert`, `confirm` ni `prompt` en ningún momento del proyecto.
