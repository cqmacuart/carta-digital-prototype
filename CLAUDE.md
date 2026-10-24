# CLAUDE.md

Carta digital **mobile-first** para un café restaurante, pensada como **plantilla** (hoy con datos de ejemplo de "Terra · café · cocina"). La interfaz está en español; responde en español.

## Comandos

```bash
npm install
npm run dev -- --host      # http://localhost:5173 (o 5174) y la IP de la red para probar en el celular
npx tsc -b                 # tipos
npx oxlint src             # lint (reglas de React Compiler: nada de setState en effects, refs en render, etc.)
npm run build              # dist/ estático
npx vite preview --port 4173   # para medir rendimiento sobre el build de producción
```

## Stack

Vite 8 · React 19 · TypeScript · **Motion** (`motion/react`) · Tailwind CSS v4 (`@theme` en `src/index.css`) · lucide-react. Sin backend: SPA estática.

## Ramas

- `main`: carta Terra original (una sola rueda por categoría, sin subcategorías).
- `carta-la-sablee`: la versión actual de trabajo: 3 niveles de navegación, datos en JSON, buscador. El nombre de la rama es histórico; el negocio ya se llama Terra.

## Estructura

| Ruta | Qué es |
|---|---|
| `public/data/terra.json` | **La "base de datos"**: tablas normalizadas (business + branches con horarios, categories, subcategories, groups, tags, toppings, modifiers, products). Única fuente de datos. |
| `src/models/db.ts` | Interfaces de persistencia (lo que guardaría una BBDD). |
| `src/data/repository.ts` | `fetchMenu()` — hoy hace `fetch` del JSON; el día que haya API solo cambia esto. |
| `src/data/adapter.ts` | `toMenu()` — une tablas, ordena, resuelve íconos, arma URLs de fotos y el color `strong` por categoría. |
| `src/types.ts` | Modelos de vista (lo que pintan las pantallas). |
| `src/components/MenuScreen.tsx` | Pantalla principal: pista vertical de categorías, gestos, encabezado, panel de subcategorías, etiquetas, riel, hoja. |
| `src/components/RadialCarousel.tsx` | `CategoryScene`: rueda de platos de una categoría + fondo desenfocado. Expone una API imperativa (`step`, `roll`, `jump`, `pan*`, `nudge`). |
| `src/components/DishSheet.tsx` | Hoja inferior: frase, precio ("desde"), etiquetas, descripción, variantes, toppings incluidos, adiciones, ingredientes, nota. |
| `src/components/SearchOverlay.tsx` | Buscador en overlay tipo persiana. |
| `src/components/ScrollCaret.tsx` | `ScrollStrip`: contenedor desplazable con carets que tienen su propio espacio (nunca encima de los ítems). |
| `src/lib/search.ts` | Índice y motor de búsqueda (sin tildes, AND de palabras, pesos por campo, motivo de coincidencia). |
| `src/lib/hours.ts` · `useOpenStatus.ts` | "Abierto · hasta 21:00" / "Cerrado · abre …" según horario y zona de la sede. |
| `src/lib/format.ts` | `money()` en COP, `photo()` (URLs de Unsplash recortadas + copias desenfocadas), `clamp`. |

## Navegación (no romper)

- **Riel de íconos (izq.) = categoría** → deslizar ↑↓ sobre el plato. **Chips = subcategoría** y **etiquetas = grupo** (3er nivel) → deslizar ←→ recorre platos y cruza subcategorías; chips y etiquetas siguen al plato y tocarlos salta con `roll()`.
- El eje del gesto se fija a los 10 px y los empates van a platos (`AXIS_LOCK_PX`). Cambiar de categoría pide 110 px o un flick claramente vertical.
- El plato y el fondo tienen **posición fija** sin importar la altura de la hoja (`open` se mide contra `MAX_PEEK`, no contra la altura actual).
- La hoja se arrastra desde cualquier parte; si su cuerpo hace scroll, al jalar hacia abajo estando arriba del todo se cierra.
- Dentro de una subcategoría, los productos de un mismo grupo deben ir **contiguos** (ordenar por `sortOrder`).

## Rendimiento (aprendido a golpes)

- Anima solo `transform` y `opacity`. **Nunca** `filter: blur()` animado (se usa fundido entre foto nítida y copia ya desenfocada del CDN) ni `backdrop-filter` sobre contenido en movimiento (fue la causa del jitter del buscador).
- Cambiar de categoría = un solo `translateY` de la pista; las escenas están memoizadas y cada rueda monta solo el plato enfocado y sus 2 vecinos.
- Con un overlay a pantalla completa, oculta lo de abajo (`visibility: hidden` en la raíz; el overlay se pone `visible`).
- Al saltar una MotionValue usa `.jump()`, no `.set()`: `set` deja velocidad y el spring se pasa de largo.
- No crees objetos caros en render (p. ej. `Intl.DateTimeFormat`): cachéalos o `useMemo`.
- Mide en el build de producción con CPU frenada 4× antes de afirmar mejoras, y compara contra una línea base (otro commit en un `git worktree`) antes de culpar a un cambio.

## Diseño

- Cada categoría tiene paleta propia (`palette.sheet/ink/accent`) repartida en el círculo cromático (miel, oliva, caramelo, mantequilla, baya, espresso, kraft). **Texto y acento ≥ 4.5:1** sobre la hoja: verifícalo al cambiar colores.
- Etiquetas (3er nivel) con borde, sin relleno; el número de platos va en un círculo.
- Microinteracciones con springs con rebote (`TAP`, `PILL` en `MenuScreen.tsx`). Respeta `prefers-reduced-motion` (`MotionConfig reducedMotion="user"`).
- Botones ≥ 44 px; íconos SVG (lucide), no emojis.

## Cómo trabaja el usuario

- Valida en su teléfono antes de subir: **no hagas commit ni push hasta que lo pida o lo valide**. Trabaja en ramas.
- Verifica con capturas y gestos simulados (puppeteer-core + Chrome del sistema) a 390×844, 390×700, 360×640 y 320×568.

## Trampas de Windows / PowerShell

- `Get-Content`/`Set-Content` sin `-Encoding utf8` **rompen las tildes** (mojibake "Ã©") y agregan BOM. Para editar texto usa la herramienta de edición o scripts de Node (`.mjs` en un archivo, no `node -e` con comillas anidadas).
- En PowerShell, la salida normal de `git push` se pinta como error (NativeCommandError); revisa la línea `a..b  rama -> rama`.

## Pendiente conocido

- Fotos de referencia de Unsplash: reemplazar por fotos reales del negocio (`image.photoId` + `focal`).
- Horarios y direcciones de las sedes son de ejemplo: ponerlos reales en `terra.json`.
- Swipe y cambio de categoría ~40–48 fps con CPU 4× (las capas de navegación sobre el fondo en movimiento cuestan); candidato a optimizar.
- Próximo: más información en la hoja inferior (requisitos por definir).
