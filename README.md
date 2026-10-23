# Terra · Carta digital

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
