# Cómo arrancar el desarrollo con Claude Code

## Qué hay en la carpeta Dieta

- `CLAUDE.md` — las instrucciones del proyecto. Claude Code lo lee solo al abrir la carpeta; ahí está todo lo decidido en las etapas 1 y 2.
- `piezas.json` — la tabla de piezas.
- `docs/diseno/` — tokens del sistema de diseño (CSS y JSON), reglas visuales y las tres pantallas prototipadas como referencia.
- `docs/como-empezar-con-claude-code.md` — este archivo.

## Pasos

1. Abrí la carpeta `Dieta` en VSCode y abrí Claude Code ahí (la carpeta tiene que ser la raíz).
2. Pegá como primer mensaje el contenido de `docs/prompt-inicial.md` (todo lo que está debajo de la línea). Ese prompt le pide a Claude Code que instale lo que falte, cree el proyecto, cree el repositorio en GitHub, active la publicación y la verifique, sin pasos manuales tuyos.
3. Lo único que puede pedirte es iniciar sesión en GitHub desde el navegador (`gh auth login`), si tu computadora todavía no está autorizada. Te va a decir exactamente qué tocar.
4. Al final de cada fase, Claude Code se detiene y te dice qué probar. Probalo en el teléfono (la dirección de GitHub Pages) antes de aprobar la siguiente. Para seguir, alcanza con "Aprobada la fase N, arrancá la N+1".

## Mensajes útiles durante el desarrollo

- "Explicame eso sin términos técnicos."
- "No cambies eso, está decidido en CLAUDE.md."
- "Antes de agregar una librería, decime en una línea para qué sirve."
- "Mostrame qué probar en el teléfono."

## Qué vas a tener que hacer vos (Claude Code te avisa cuándo)

- Crear el repositorio en GitHub y activar Pages (fase 1).
- Agregar `https://mateooppen.github.io` como origen autorizado en tu cliente OAuth de Google Cloud, o crear un cliente nuevo (fase 5).
- Pegar tu clave de la IA en Ajustes de la app, no en el código (fase 6).
