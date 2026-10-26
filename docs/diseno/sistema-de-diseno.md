Sistema de diseño de **Dieta**, una app personal que propone qué comer en cada momento del día con los carbohidratos ya contados. Se usa en el teléfono, con una mano, en los dos minutos antes de comer. Todo lo que sigue está al servicio de una sola lectura: *cuántos carbohidratos tiene lo que voy a comer, y si está en rango*.

## Principios

- **Un número manda.** Cada pantalla tiene un solo dato grande (`carb-xl`): el total de carbohidratos del plato. Lo demás lo acompaña en tamaños menores. Nunca dos números grandes compitiendo.
- **Calmo, no clínico.** Verdes apagados y ámbar, nunca rojo. La app no alarma: informa. Un plato por encima del rango se muestra en `state-over` con la palabra "por encima", no con un ícono de peligro.
- **Se opera con el pulgar derecho.** Todo lo que se toca vive en el 40 % inferior de la pantalla (`thumb-zone`), con la acción principal abajo a la derecha. Lo que solo se lee va arriba. Ningún elemento tocable mide menos de `touch-min` (48 px).
- **Nada por debajo de 15 px.** El texto corriente es `body` (17 px). `label` y `meta` (15 px) son el piso, y `label` siempre va en negrita.
- **Sin decoración.** Sin ilustraciones, sin degradados, sin sombras salvo las dos definidas. El aire entre elementos (`space-6` entre secciones) hace el trabajo visual.

## Voz y texto

- Español rioplatense, tuteo en segunda persona ("Confirmá", "Elegí otra variante"). Oraciones cortas. Sin signos de exclamación.
- Los nombres de piezas se escriben como se dicen en la mesa: "Milanesa de pollo", "½ plato de arroz", nunca en mayúsculas ni abreviados.
- El número de carbohidratos siempre lleva su unidad pegada con `space-1`: **52 g**. Nunca "52" solo ni "52 gr".
- Estados, siempre con palabra además de color: "En rango", "Por encima", "Por debajo", "Sin validar".
- Términos que la app usa y define en su ayuda: *pieza*, *plato*, *momento*, *rango*, *colación*, *meal prep*.

## Color

- Fondo de pantalla `surface`; tarjetas y barra de acciones `surface-raised`; campos y pistas vacías `surface-sunken`.
- Texto en `ink`; secundario en `ink-muted`. Ambos cumplen 4.5:1 sobre `surface` y `surface-raised` en los dos temas.
- `accent` (verde salvia) es la única tinta de acción: botón principal con texto `on-accent`, chip de momento activo sobre `accent-soft`, variante seleccionada con borde `accent`. Como texto va solo sobre `surface` y `surface-raised`.
- Estados del plato: `state-ok`, `state-over`, `state-under` con sus `-soft` como fondo del chip. Se distinguen por luminosidad y por palabra, no solo por tono.
- Indicadores de absorción: `fibra` / `fibra-soft` para el badge **Fibra** y `grasa` / `grasa-soft` para **Grasa**, siempre con la palabra completa. Ciruela para Grasa, para que no se confunda con el ámbar de "por encima".
- Modo claro y oscuro definidos token por token. La app sigue el sistema del teléfono (`prefers-color-scheme`) y ofrece un interruptor manual que fija `data-theme="light"` o `"dark"` en el elemento raíz. Nunca un color literal en un componente: siempre `var(--token)`.
- Anillo de foco: 2 px sólidos en `focus`, desplazado 2 px del borde, en todo lo que recibe foco.

## Tipografía

- Una sola familia, **Atkinson Hyperlegible** (`sans`), elegida porque sus letras y números no se confunden entre sí (0 y O, 1 e l, 3 y 8) incluso con el teléfono lejos o con poca luz. Se carga desde Google Fonts en pesos 400 y 700; el stack cae a la fuente del sistema si no carga.
- Escala: `carb-xl` (56) para el total del plato, `carb-lg` (32) para el carbohidrato de una pieza, `title` (24) para el momento del día, `heading` (19) para nombres de pieza, `body` (17) para todo lo que se lee, `label` (15, negrita, mayúsculas con 0.04em) para chips y badges, `meta` (15) para horas del historial.
- Los números que se comparan en columna (tabla de piezas, historial) llevan `font-variant-numeric: tabular-nums`.

## Espaciado, radios y toque

- Escala de 4 px: `space-1` a `space-8`. Margen lateral de pantalla `space-4`; relleno de tarjeta `space-4`; entre tarjetas `space-3`; entre secciones `space-6`.
- Radios por rol: `radius-sm` badges y campos, `radius-md` tarjetas de pieza y botones, `radius-lg` tarjeta de plato y hojas inferiores, `radius-pill` chips y barra de rango.
- Alturas de toque: `touch-min` 48 px para todo; `touch-primary` 56 px para el botón principal y la barra de acciones inferior, que queda fija al pie con `shadow-bar`.
- Las hojas inferiores (bottom sheets: paneles que suben desde abajo) son el patrón para cambiar una pieza y para editar una. Siempre se cierran de tres formas: deslizando hacia abajo, tocando el velo oscuro de arriba o con la × del encabezado; nunca hace falta llegar al pie de la hoja para salir.

## Iconografía

- Set: **Lucide** (lucide.dev, licencia ISC), trazo de 2 px, caja de 24 px, color `currentColor`. Sirve de apoyo visual para encontrar la pieza antes de leerla; nunca reemplaza el nombre.
- Un ícono por pieza, elegido por tipo y afinidad: principales `utensils`, `drumstick`, `fish`, `egg`, `soup`, `pizza`, `sandwich`; acompañamientos `salad`, `wheat`, `carrot`; desayuno/merienda `croissant`, `cookie`, `milk`; frutas `apple`, `banana`, `cherry`, `citrus`; bebidas `coffee`, `cup-soda`, `glass-water`, `wine`; extras `ice-cream-cone`, `candy`, `popcorn`. Una pieza nueva sin ícono asignado usa `utensils`.
- El ícono va a la izquierda del nombre, en `ink-muted`, 24 px, con `space-3` de separación. En la tarjeta de plato no se repiten íconos: ya se vieron al elegir.
- Los íconos nunca llevan significado solos. Fibra y Grasa son palabras en badge, no íconos.

## Componentes

`SelectorMomento`, `PiezaCard`, `PlatoCard`, `BarraRango`, `Badge`, `Boton`, `CampoBusqueda`, `BarraAcciones`, `Icono`. Cada uno tiene su vista previa y sus reglas de uso en su propia ficha. Un plato se compone con `PlatoCard`, cuyas filas se cambian una por una desde una hoja inferior de alternativas (misma categoría, carbohidratos parecidos, total recalculado); `BarraRango` aparece solo cuando el plato se arma a mano; una lista o tabla de piezas con `PiezaCard` repetida; toda pantalla termina en `BarraAcciones`.
