# Carta digital · rama `carta-la-sablee`

Versión para **La Sablée (Calle Real)**: 64 productos en dos niveles de navegación, sobre la base de la carta Terra (`main`).

- **Riel lateral de íconos = categorías**, siguiendo las secciones de la carta impresa (Desayunos, Sándwiches, Panadería, Waffles y bowls, Postres, Bebidas, Para llevar). Es vertical, como el gesto que las cambia: deslizar ↑ ↓.
- **Chips = subcategorías**, con su conteo ("Frías (8)"), en un panel centrado bajo el nombre de la categoría. Deslizar ← → recorre los productos y cruza de subcategoría en subcategoría; el chip activo se actualiza solo y tocar uno salta ahí con un rodado corto. Una categoría con una sola subcategoría no muestra chips.
- **Etiquetas = tercer nivel** (por ejemplo Aves · Res · Cerdo, o Jugos y limonadas · Sodas · Alcohol), en chips claros bajo el panel. Siguen al plato y tocar una salta al primero de su grupo. Los productos de un grupo van juntos (`group` en `src/data/menu.ts`).
- Si chips, etiquetas o riel no caben, se desplazan entre carets pulsantes que tienen su propio espacio (`ScrollStrip` en `src/components/ScrollCaret.tsx`); nunca se montan sobre los ítems.
- El plato se corre a la derecha para dejar sitio al riel; el fondo desenfocado sigue centrado.
- **Una tarjeta = un producto base**: tamaños, sabores y adiciones son variantes, con precio "desde" y la lista en la hoja. Precios en COP.
- Las fotos son de Unsplash como referencia; hay que reemplazarlas por fotos reales del negocio.

### Datos (simulación de base de datos)

La carta vive en **`public/data/la-sablee.json`**, normalizada como tablas de una base de datos. Los modelos están en **`src/models/db.ts`**:

| Tabla | Qué guarda |
|---|---|
| `business` | nombre, lema, moneda, sucursales (`branches`) y contacto |
| `categories` | nivel 1 (riel): nombre, ícono, orden, paleta |
| `subcategories` | nivel 2 (chips), con `categoryId` |
| `groups` | nivel 3 (etiquetas), con `subcategoryId` |
| `tags` | insignias: De la casa, Vegano, Sin gluten… |
| `toppings` | el pool de toppings de la carta |
| `modifiers` | adiciones pagas (leche de almendras +$3.000) |
| `products` | nombre, frase, descripción, precio base, `variants`, ingredientes, `includedToppings`, `modifierIds`, `tagIds`, nota, imagen (id + recorte), `available`, orden |

Flujo: `src/data/repository.ts` hace `fetch` del JSON (el día que haya backend, solo cambia esta función) → `src/data/adapter.ts` une las tablas y arma lo que pintan las pantallas (`src/types.ts`). Un producto con `available: false` no aparece. Las direcciones y el teléfono vienen de la carta impresa: verificarlos con el negocio.

---

Carta descriptiva, mobile-first, para un café restaurante. Inspirada en el "Food App Challenge" de Flutter, pero hecha como web.

## Stack

- **Vite + React 19 + TypeScript**: SPA estática, sin servidor.
- **Motion** (`motion/react`): springs, pan con bloqueo de eje, arrastre de la hoja, `layoutId` en el chip activo.
- **Tailwind CSS v4**: tokens base en `src/index.css`. Las paletas por categoría están en `src/data/menu.ts`.
- **lucide-react**: íconos SVG.
- Fotos: Unsplash, recortadas en círculo con el focal-point de imgix. Cada plato tiene además dos copias ya desenfocadas por el CDN (96 px para los platos laterales, 320 px para el fondo).

## Cómo funciona

| Pieza | Dónde |
|---|---|
| Escena por categoría: rueda de platos (órbita, giro, enfoque por fundido) y foto de fondo desenfocada que se desliza y gira | `src/components/RadialCarousel.tsx` |
| Pista vertical de categorías, gestos, chips, superficie con grano, hoja arrastrable | `src/components/MenuScreen.tsx` |
| Hoja descriptiva: pestaña con caret, nombre, precio, etiquetas, descripción, ingredientes, nota | `src/components/DishSheet.tsx` |

- **Navegación**: deslizar ← → cambia de plato; deslizar ↑ ↓ (o tocar un chip) cambia de categoría. El gesto bloquea su eje al empezar. Al pasar el último plato de una categoría se entra en la siguiente. Teclado: flechas.
- **Categorías como pista vertical**: las 5 escenas quedan montadas una debajo de otra y cambiar de categoría es un solo `translateY` de la pista; no se monta ni repinta nada. Cada rueda solo monta el plato enfocado y sus dos vecinos, y recuerda en qué plato quedaste.
- **Color**: cada categoría tiene su paleta dentro de la familia terracota (armonía análoga del círculo cromático): café = moka, panadería = corteza dorada, brunch = terracota, platos = ladrillo, postres = rosa arcilla. La hoja cambia de color con capas que se funden (solo `opacity`), y los pares texto/fondo cumplen 4.5:1.
- **Rendimiento**: solo se animan `transform` y `opacity`. El desenfoque es un fundido entre la foto nítida y la copia ya desenfocada (nunca se anima `filter: blur()`), no hay `backdrop-filter` sobre contenido en movimiento y las fotos se pre-decodifican al cargar.

El menú se edita en `src/data/menu.ts`.

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173 (agrega --host para probar en tu celular)
npm run build    # genera dist/ para Vercel, Netlify, etc.
```
