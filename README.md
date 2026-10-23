# Terra · Carta digital

Carta descriptiva, mobile-first, para un café restaurante. Inspirada en el "Food App Challenge" de Flutter, pero hecha como web.

## Stack

- **Vite + React 19 + TypeScript**: SPA estática, sin servidor.
- **Motion** (`motion/react`): springs, pan/drag, `usePresence` para que las categorías entren y salgan rodando, `layoutId` en chips y puntos.
- **Tailwind CSS v4**: tokens base en `src/index.css`. Los tonos por categoría se calculan en `tone` (`src/lib/format.ts`).
- **lucide-react**: íconos SVG.
- Fotos: Unsplash, recortadas en círculo con el focal-point de imgix. Cada plato tiene además una copia de 96 px ya desenfocada por el CDN.

## Cómo funciona

| Pieza | Dónde |
|---|---|
| Carrusel radial por categoría (órbita, giro, enfoque por fundido) y foto de fondo desenfocada que se desliza en horizontal | `src/components/RadialCarousel.tsx` |
| Chips, superficie con grano, hoja arrastrable con el color de la categoría | `src/components/MenuScreen.tsx` |
| Hoja descriptiva: pestaña con caret, nombre, precio, etiquetas, descripción, ingredientes, nota | `src/components/DishSheet.tsx` |

- Navegación: deslizar, tocar un plato lateral o usar ← → con teclado. Al pasar el último plato de una categoría se entra en la siguiente (y al revés).
- **Color**: cada categoría tiene su paleta dentro de la familia terracota (armonía análoga del círculo cromático): café = espresso, panadería = corteza dorada, brunch = terracota, platos = ladrillo, postres = rosa arcilla. La hoja, el chip activo y el fondo cambian con la categoría. Los pares texto/fondo cumplen 4.5:1.
- **Rendimiento**: solo se animan `transform` y `opacity`. El desenfoque es un fundido entre la foto nítida y la copia ya desenfocada (nunca se anima `filter: blur()`), y no hay `backdrop-filter` sobre contenido en movimiento. El carrusel está memoizado, así que cambiar de plato solo re-renderiza la hoja.

El menú se edita en `src/data/menu.ts`.

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173 (agrega --host para probar en tu celular)
npm run build    # genera dist/ para Vercel, Netlify, etc.
```
