# CLAUDE.md

Carta digital **mobile-first** para un café restaurante, pensada como **plantilla** (hoy con datos de ejemplo de "Terra · café · cocina"). La interfaz está en español; responde en español.

## Comandos

```bash
npm install
npm run dev -- la-sablee --host   # carta de un cliente (sin slug: demo) + IP de la red para el celular
npx tsc -b                 # tipos
npx oxlint src             # lint (reglas de React Compiler: nada de setState en effects, refs en render, etc.)
npm run build -- la-sablee # dist/la-sablee/ estático
npm run build -- --all     # un dist/<slug>/ por cada cliente con carta
npm run preview -- la-sablee --port 4173   # para medir rendimiento sobre el build de producción
npm run pages              # _site/: las demos (themes/demo*/) + portada, lo que publica GitHub Pages
```

## Demos públicas

GitHub Pages: https://cqmacuart.github.io/carta-digital-prototype/ (portada) y una subcarpeta por demo (`demo/`, `demo-sushi/`…). `.github/workflows/pages.yml` corre `npm run pages` y publica `_site/` en cada push a `main`. Solo entran carpetas `themes/demo*/`: las cartas de clientes nunca se publican ahí (van a Hostinger, con `noindex` mientras sean propuesta).

## Un build por cliente

El código no tiene datos de ningún negocio: cada carta sale de `themes/<slug>/`. Cómo agregar un negocio: `themes/README.md` (local, fuera de git).
- `business.json`: el negocio (esquema en `src/models/business.ts`): `tenantId`, nombre, lema, tipo, datos legales (razón social, NIT, política de datos), contacto, redes, medios de pago, sedes con dirección, coordenadas, servicios y horarios. Sale en el encabezado y como JSON-LD de Schema.org en el `<head>`.
- `business.json` → `imageShape` (opcional): marco de **todas** las fotos de producto. `"circle"` (por defecto: plato redondo), `"rounded"` (cuadrado con bordes redondeados) o `"cutout"` (sin recorte, para PNG con fondo transparente: comidas rápidas, pizzas, cócteles, frascos). En `cutout` el build no recorta por punto focal: quita el margen transparente, apoya el producto en el borde de abajo y la app le pone una sombra en el piso (degradado, sin `filter`) en vez de marco; las fotos de Unsplash son JPG con fondo, así que `cutout` pide fotos locales: el CDN de Unsplash les quita el fondo con `https://images.unsplash.com/photo-<id>?w=1000&bg-remove=true&fm=png` (elegir fotos donde el producto no se salga del encuadre: si no, queda con bordes rectos). `vite.config.ts` lo inyecta como `__IMAGE_SHAPE__` y `src/lib/shape.ts` da las clases (plato, thumbs del buscador y del pedido, foto que vuela a la bolsa): foto de producto nueva = sus clases salen de ahí, no `rounded-full` fijo. Cambiarlo pide reiniciar `npm run dev`.
- `menu.json`: la carta (esquema en `src/models/db.ts`, `schemaVersion` 2, o 3 si usa `optionGroups` o ingredientes fijos `{ name, removable: false }`; las demos ya van en 3), sin datos del negocio.
- **`tenantId`**: UUID inmutable del negocio (no es el slug: el slug es la carpeta y puede cambiar). Va en los tres JSON y el build falla si no coinciden. En V4 es `tenant_id`. Negocio nuevo: `npm run new -- <slug> [--from demo]`, que copia una plantilla con un `tenantId` nuevo; nunca copiar una carpeta a mano.
- `assets/`: fotos propias del negocio (`image.source: "local"`). El plugin las recorta por punto focal y genera las 4 versiones de `src/lib/media.ts` en `media/` con sharp (caché en `node_modules/.carta-media/`). Cómo usarlas: `themes/<slug>/assets/README.md`.
- `theme.json`: título, fuentes, tokens de color (pisan los `--color-*` de `@theme` en `src/index.css`), `proposal`: con texto, el build lleva `noindex` y el aviso "Propuesta de diseño para …"; `null` cuando el cliente paga; y `labels` (opcional): el vocabulario del negocio ("productos", "el catálogo", "Notas olfativas", "Presentación", "Extras"…). Lo que no ponga usa los textos de la carta, así que las cartas sin `labels` no cambian.
- `scripts/carta.mjs` elige el cliente (`CARTA_CLIENT`) y el plugin `carta-client` de `vite.config.ts` valida los tres JSON, sirve/emite `data/business.json` y `data/menu.json` y arma el `<head>`.
- `themes/<slug>/public/`: archivos que se publican tal cual junto a la carta (p. ej. `politica-datos.html`).
- `base: './'`: el mismo build funciona en la raíz de un dominio o en una subcarpeta (GitHub Pages, Hostinger).
- Demos ficticias, versionadas y públicas (`themes/demo*/`, sin direcciones ni teléfonos reales, salvo el WhatsApp de pedidos de `demo` y `demo-perfumeria`, que es el de Cesar a propósito): `demo` = Terra (café), `demo-sushi` = Nami (sushi bar), `demo-rapidas` = Barrio (burgers y perros; `imageShape: "cutout"` con fotos locales sin fondo, fuentes en `assets/FUENTES.md`), `demo-pizzeria` = Forno (pizzas, panzerottis, pastas) y `demo-perfumeria` = Nácar (perfumería: familias olfativas en el riel, Ella/Él/Unisex como subcategoría, presentaciones decant 5 ml–100 ml como variantes, notas como ingredientes, `labels` propios). **Perfumería**: nada de réplicas, "inspirados en" ni nombres, marcas, frascos o fotos de perfumes reales (CP art. 306, Decisión 486 CAN); las fotos de Unsplash se revisan una por una. Las demás carpetas de `themes/` quedan fuera de git.
- **Excepción: `demo-1583`** = 1583 Café Origen, negocio **real** (Pamplona). Cesar decidió publicarla en Pages como propuesta (oct 2026) para no gastar hosting: lleva datos reales, `proposal` (aviso + `noindex`) y pedidos al WhatsApp de Cesar, como las otras demos (el contacto sigue siendo el del negocio). Si el negocio dice que no, se borra la carpeta y se republica (el historial de git la conserva). Su sitio (`clients/1583-cafe-origen/sitio`) enlaza "Ver carta" a esta URL de Pages.

## V2 · Pedidos por WhatsApp

Activable por negocio con `business.json` → `ordering.enabled` (formato en `themes/README.md`). Hoy en `demo` (Terra) y `demo-perfumeria` (Nácar: domicilio y para recoger), con el número de Cesar.
- **Aislado en build**: `vite.config.ts` define `__PEDIDOS__` desde `business.json`. Todo V2 vive en `src/pedidos/` y `src/lib/pedidos.ts` lo carga con `import()` detrás de esa constante: en un negocio V1 la rama es código muerto, no hay chunk `pedidos-*` y el JS pesa lo mismo que en V1 (+0,2 kB gzip de props opcionales). Sus estilos van en `src/pedidos/pedidos.css` (`src/index.css` excluye la carpeta con `@source not`), así el CSS de V1 tampoco crece. Verificarlo en `dist/<slug>/assets/` tras tocar algo de V1 que importe de pedidos: **nunca** importar `src/pedidos/` desde V1 si no es por `usePedidos()` o `import type`.
- El build falla si `ordering.enabled` va sin `legal.dataPolicyUrl` (Ley 1581), sin WhatsApp válido o con modos que la sede no ofrece, y si un producto usa un `optionGroup` inexistente.
- Flujo: se agrega **solo desde la hoja abierta** (nada en su borde: con variantes, agregar sin elegir era ruido). `ItemOptions` reemplaza variantes, toppings, adiciones e ingredientes por chips tocables + nota + cantidad + "Agregar · $X" fijo abajo; con varias variantes ninguna viene marcada ("Elige una opción"). En ingredientes, "Toca los que no quieras" va en su propia línea con el acento (casi nadie lee más que el título) y cada quitable lleva "×"; los fijos no, y al tocarlos avisan "… va siempre en este plato". Si **todos** son fijos (las notas de un perfume, un croissant) no hay nada que quitar: se leen como chips normales, sin candados. Agregar **no cierra la hoja**: muestra "Agregado" y la deja lista para otro (revueltos y luego benedictinos sin reabrir). La foto del plato vuela del botón a la bolsa en arco (`flyToCart`, x con ease-in e y con ease-out) y la bolsa rebota al llegar.
- La bolsa **flota a la derecha**, a la altura del riel (no en el encabezado: el de V1 no tiene espacio); con la hoja abierta se encoge (0.8) y sube lo justo para no quedar encima de la hoja. → `CartOverlay` (sube desde abajo): líneas con cantidad, papelera y "Editar" (reabre las opciones ahí mismo), "Vaciar pedido" con confirmación, entrega, datos, pago, nota, autorización de datos, totales y "Enviar pedido por WhatsApp" (`wa.me/<número>?text=`).
- `cart.ts`: estado global (`useSyncExternalStore`), guardado en `localStorage` por `tenantId`. Guarda **ids**, no precios: al cargar se recalcula con la carta actual y se descartan líneas cuyo plato u opción ya no existe. Mismo plato con las mismas elecciones = sube la cantidad.
- `message.ts`: el mensaje (negritas de WhatsApp, un bloque por plato con sus elecciones sangradas, totales, nombre, dirección, pago).

## Stack

Vite 8 · React 19 · TypeScript · **Motion** (`motion/react`) · Tailwind CSS v4 (`@theme` en `src/index.css`) · lucide-react. Sin backend: SPA estática.

## Ramas

- `main`: V1: 3 niveles de navegación, buscador y build por cliente desde `themes/<slug>/` (`carta-la-sablee` ya está fusionada).
- `v2-pedidos`: V2, pedidos por WhatsApp (ya fusionada en `main`).
- `demo-perfumeria`: vocabulario por negocio (`labels`) + demo Nácar (sin fusionar; Cesar decide cuándo).

## Estructura

| Ruta | Qué es |
|---|---|
| `themes/<slug>/business.json` | El negocio y sus sedes con horarios (`src/models/business.ts`). Se sirve como `data/business.json`. |
| `themes/<slug>/menu.json` | **La carta** de cada negocio: tablas normalizadas (categories, subcategories, groups, tags, toppings, modifiers, products). Se sirve como `data/menu.json`. |
| `src/data/repository.ts` | `fetchCarta()` carga los dos y verifica versión y `tenantId`; con API, solo cambia esto. |
| `vite.config.ts` · `scripts/carta.mjs` | Build por cliente (ver arriba). |
| `src/models/db.ts` | Interfaces de persistencia (lo que guardaría una BBDD). |
| `src/data/repository.ts` | `fetchMenu()` — hoy hace `fetch` del JSON; el día que haya API solo cambia esto. |
| `src/data/adapter.ts` | `toMenu()` — une tablas, ordena, resuelve íconos, arma URLs de fotos y el color `strong` por categoría. |
| `src/types.ts` | Modelos de vista (lo que pintan las pantallas). |
| `src/components/MenuScreen.tsx` | Pantalla principal: pista vertical de categorías, gestos, encabezado, panel de subcategorías, etiquetas, riel, hoja. |
| `src/components/RadialCarousel.tsx` | `CategoryScene`: rueda de platos de una categoría + fondo desenfocado. Expone una API imperativa (`step`, `roll`, `jump`, `pan*`, `nudge`). |
| `src/components/DishSheet.tsx` | Hoja inferior: caret que late mientras está cerrada, badge "N variantes" dentro de la hoja en la fila del caret (abre la hoja), ruta "categoría · subcategoría · etiqueta" en una línea, frase, precio ("desde"), insignias, descripción, variantes ("Elige"), toppings incluidos, adiciones, ingredientes, nota. |
| `src/components/SearchOverlay.tsx` | Buscador en overlay tipo persiana. |
| `src/components/ScrollCaret.tsx` | `ScrollStrip`: contenedor desplazable con carets que tienen su propio espacio (nunca encima de los ítems). |
| `src/lib/search.ts` | Índice y motor de búsqueda (sin tildes, AND de palabras, pesos por campo, motivo de coincidencia). |
| `src/lib/hours.ts` · `useOpenStatus.ts` | "Abierto · hasta 21:00" / "Cerrado · abre …" según horario y zona de la sede. |
| `src/lib/format.ts` | `money()` en COP, `photo()` (URLs de las 4 versiones de cada foto: Unsplash o `media/` local), `clamp`. |
| `src/lib/media.ts` | Las 4 versiones de cada foto (tamaño, desenfoque, nombre de archivo); la usan la app y el build. |
| `src/lib/vocabulary.ts` · `labels.ts` | Vocabulario por negocio: `vocabulary.ts` tiene el tipo `Labels` y los textos por defecto (lo usa también el build para validar `theme.json` → `labels`); `labels.ts` exporta `L` (defecto + `__LABELS__`, que inyecta `vite.config.ts`), `cap()` y `count()`. Texto nuevo de la interfaz que nombre la cosa ("plato", "carta", "ingredientes"…) = sale de `L`, no fijo. |
| `src/lib/pedidos.ts` | `usePedidos()`: carga `src/pedidos/` solo si `__PEDIDOS__`; en V1 siempre `null`. |
| `src/pedidos/` | V2: `cart.ts` (estado, precios, reglas), `message.ts` (texto de WhatsApp), `ItemOptions.tsx` (opciones tocables del plato), `CartButton.tsx` (bolsa flotante y la foto que vuela hacia ella), `CartOverlay.tsx` (pedido y envío), `pedidos.css`. |

## Navegación (no romper)

- **Riel de íconos (izq.) = categoría** → deslizar ↑↓ sobre el plato. **Chips = subcategoría** y **etiquetas = grupo** (3er nivel) → deslizar ←→ recorre platos y cruza subcategorías; chips y etiquetas siguen al plato y tocarlos salta con `roll()`.
- El eje del gesto se fija a los 10 px y los empates van a platos (`AXIS_LOCK_PX`). Cambiar de categoría pide 110 px o un flick claramente vertical.
- El plato y el fondo tienen **posición fija** sin importar la altura de la hoja (`open` se mide contra `MAX_PEEK`, no contra la altura actual).
- Indicadores de deslizar (`SwipeHint`): flechas a la derecha mientras haya platos adelante y a la izquierda (junto al riel) cuando haya atrás. Siempre laten; la palabra "desliza" solo hasta el primer gesto de la visita. Son botones: tocarlas avanza o retrocede un plato con `step()` y cruzan de categoría en los extremos. En pruebas con usuarios nadie descubría el deslizar lateral sin ellas.
- En el buscador, Enter / la tecla "buscar" del teléfono solo quita el foco (cierra el teclado) y deja los resultados; el overlay se cierra con "Cerrar", Escape o eligiendo un resultado.
- La hoja se arrastra desde cualquier parte; si su cuerpo hace scroll, al jalar hacia abajo estando arriba del todo se cierra.
- Dentro de una subcategoría, los productos de un mismo grupo deben ir **contiguos** (ordenar por `sortOrder`).
- Las escenas de categoría están a una pantalla completa de distancia (`pitch = height`): si la siguiente espera más arriba, su fondo asoma por las esquinas redondeadas de la hoja.
- `useScrollEdges` mide el contenido con la caja de layout de los hijos, **no** con `scrollWidth`: los `transform` (la píldora `layoutId` que viaja o rebota) inflan `scrollWidth` y dejaban carets pegados.

## Rendimiento (aprendido a golpes)

- Anima solo `transform` y `opacity`. **Nunca** `filter: blur()` animado (se usa fundido entre foto nítida y copia ya desenfocada del CDN) ni `backdrop-filter` sobre contenido en movimiento (fue la causa del jitter del buscador).
- Cambiar de categoría = un solo `translateY` de la pista; las escenas están memoizadas y cada rueda monta solo el plato enfocado y sus 2 vecinos.
- La raíz de la carta y el marco usan `overflow: clip`, no `hidden`: los platos vecinos sobresalen y un `hidden` se puede desplazar por foco o `scrollIntoView`, dejando toda la carta corrida de lado.
- Con un overlay a pantalla completa, oculta lo de abajo (`visibility: hidden` en la raíz; el overlay se pone `visible`).
- Al saltar una MotionValue usa `.jump()`, no `.set()`: `set` deja velocidad y el spring se pasa de largo.
- No crees objetos caros en render (p. ej. `Intl.DateTimeFormat`): cachéalos o `useMemo`.
- Mide en el build de producción con CPU frenada 4× antes de afirmar mejoras, y compara contra una línea base (otro commit en un `git worktree`) antes de culpar a un cambio.

## Diseño

- Cada categoría tiene paleta propia (`palette.sheet/ink/accent`) acorde con el negocio, alternando hojas claras y oscuras entre vecinas del riel. Terra (café) usa el arco **cálido** de 349° a 41°, sin verdes ni azules; Nami (sushi) usa salmón, atún, wasabi, nori y jengibre; Barrio (comidas rápidas), mostaza, kétchup, papa, BBQ y carbón; Forno (pizzería), tomate, masa dorada, albahaca, mozzarella y vino; Nácar (perfumería), una por familia olfativa: rubor (florales), oliva (cítricas), agua (frescas), madera oscura (amaderadas), miel (orientales), ciruela (sets) y piedra (cuerpo y hogar). **Texto y acento ≥ 4.5:1** sobre la hoja: verifícalo al cambiar colores.
- Etiquetas (3er nivel) con fondo blanco y borde fino (sin él no se leían sobre la foto); la activa lleva un anillo del color `strong`. El número de platos va en un círculo.
- Insignias de producto (`TagChip` en `DishSheet.tsx`): misma forma, color propio por insignia (`TAG_COLORS`: relleno claro opaco + texto del mismo tono ≥5:1 y aro fino, para destacar en hojas claras y oscuras). Entran con rebote escalonado. Solo dos tienen efecto: **Nuevo** (barrido de luz + destellos cada ~4 s) y **Picante** (llama que parpadea con resplandor). El verde de Vegano/Vegetariano es semántico, como el de "Abierto".
- Microinteracciones con springs con rebote (`TAP`, `PILL` en `MenuScreen.tsx`). Respeta `prefers-reduced-motion` (`MotionConfig reducedMotion="user"`).
- Botones ≥ 44 px; íconos SVG (lucide), no emojis. El catálogo de íconos (`src/lib/icons.ts`, ~75, agrupados por uso: platos, panadería, frutas, bebidas, insignias, regalos y catálogo, perfumería, servicio) cubre los nichos en los que estamos; `IconKey` en `db.ts` lista las mismas claves. Ícono nuevo = agregarlo en los dos y en `themes/README.md`.

## Cómo trabaja el usuario

- Valida en su teléfono antes de subir: **no hagas commit ni push hasta que lo pida o lo valide**. Trabaja en ramas.
- Verifica con capturas y gestos simulados (puppeteer-core + Chrome del sistema) a 390×844, 390×700, 360×640 y 320×568.

## Trampas de Windows / PowerShell

- `Get-Content`/`Set-Content` sin `-Encoding utf8` **rompen las tildes** (mojibake "Ã©") y agregan BOM. Para editar texto usa la herramienta de edición o scripts de Node (`.mjs` en un archivo, no `node -e` con comillas anidadas).
- En PowerShell, la salida normal de `git push` se pinta como error (NativeCommandError); revisa la línea `a..b  rama -> rama`.

## Pendiente conocido

- Fotos de referencia de Unsplash: reemplazar por fotos reales del negocio en `themes/<slug>/assets/` (`source: "local"`).
- Horarios de las sedes son de ejemplo, también en `themes/la-sablee/business.json`: ponerlos reales.
- Roadmap (V1 carta → V2 pedido por WhatsApp → V3 manager → V4 multitenant) y pendientes: `BACKLOG.md`.
- Contenido de demo: nombres y precios vienen de la carta impresa, pero descripciones, ingredientes, detalles de variantes, notas y las adiciones (shot de espresso, huevo, aguacate, helado) fueron redactados para que la carta se vea pareja. Validarlos con el negocio. Todo producto debería tener descripción de 2–3 frases, 4–7 ingredientes y detalle en sus variantes.
- Swipe y cambio de categoría ~40–48 fps con CPU 4× (las capas de navegación sobre el fondo en movimiento cuestan); candidato a optimizar.
- Próximo: más información en la hoja inferior (requisitos por definir).
