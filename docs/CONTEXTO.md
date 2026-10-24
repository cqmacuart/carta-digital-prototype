# Contexto para un chat nuevo — Carta digital Terra

> Pega este archivo al iniciar otra conversación (o di "lee docs/CONTEXTO.md y CLAUDE.md"). `CLAUDE.md` tiene las reglas técnicas; aquí va la historia, las decisiones y el estado.

## Qué es

Carta digital **mobile-first** para un café restaurante, hecha como web (no app nativa) para abrirse desde un QR. Funciona como **plantilla**: el negocio de ejemplo es **Terra · café · cocina**; la carta de ejemplo (65 productos, precios en COP) viene de un café real de Pamplona (Colombia) que se usó como caso de estudio.

- Repo: https://github.com/cqmacuart/coffee-menu-prototype — carpeta local `D:\mockupsites\cafe-menu`.
- Rama de trabajo: **`carta-la-sablee`** (la `main` conserva la primera versión, más simple).
- Probar en el celular: `npm run dev -- --host` y abrir la IP de la red (p. ej. `http://192.168.1.43:5174`) con el teléfono en el mismo Wi-Fi.

## Cómo se ve y se usa

- Arriba: logo y nombre, píldora de sede con estado **Abierto · hasta 21:00 / Cerrado · abre …**, y botón 🔍.
- Debajo: panel centrado con el **nombre de la categoría** y sus **subcategorías** como chips (con el número de platos en un círculo); bajo él, **etiquetas** (3er nivel) con borde.
- Izquierda: **riel vertical de íconos** con las 7 categorías.
- Centro: **plato circular** sobre una **foto desenfocada del mismo plato** que ocupa el tercio superior y termina a la altura del centro del plato. Los platos vecinos solo aparecen mientras ruedan por una órbita invisible.
- Abajo: **hoja** con el color de la categoría (nombre, precio o "desde", frase de ≤2 líneas, etiquetas); se arrastra para ver descripción, variantes, toppings, adiciones e ingredientes.
- Gestos: ←→ cambia de plato, ↑↓ cambia de categoría. Aviso "› › › desliza" en el primer plato en cada visita.
- **Buscador** en overlay tipo persiana con rebote: busca en nombre, categoría, subcategoría, grupo, etiquetas, ingredientes, variantes y descripción; elegir un resultado lleva la carta a ese plato.

## Estructura de la carta

| Categoría | Subcategorías | Etiquetas (ejemplos) |
|---|---|---|
| Desayunos | Huevos · Brunch | Pannecook · Cacerolas |
| Sándwiches | — | Aves · Res · Cerdo · Atún · Vegetariano |
| Panadería | Croissants · Dulce y sal | Clásico · Dulce · Con huevo / Panes · Hojaldres · Para mojar |
| Waffles y bowls | Waffles · Bowls | Dulces · Salados |
| Postres | Tortas · Pastelería · Helados | Cremosos · Francesa |
| Bebidas | Calientes · Frías | Café · Chocolate · Infusiones · Con licor / Café frío · Frappés y malteadas · Jugos y limonadas · Sodas · Alcohol |
| Para llevar | Tortas enteras · Panes | — |

"Una tarjeta = un producto base": tamaños y sabores son **variantes** (precio "desde"). Los toppings son un pool compartido con N incluidos; la leche de almendras es una **adición** (+$3.000).

## Decisiones tomadas (y por qué)

- **Web + Vite/React/Motion** en lugar de app nativa: más fácil de implementar y compartir por QR.
- **Menú descriptivo, sin carrito ni pago**: el usuario lo pidió así.
- **Categorías como pista vertical** (un solo `translateY`) tras detectar jitter al encadenar ruedas.
- **Datos normalizados en JSON** (`public/data/terra.json` + `src/models/db.ts`) para simular una base de datos; `repository.ts` es el único punto a cambiar por una API.
- **Paletas por categoría** repartidas en el círculo cromático (antes eran todas terracota y se veía monótono), con contraste ≥4.5:1.
- **Los toppings no cuentan en la búsqueda**: todos los waffles comparten el pool y "chocolate" devolvía todo.
- **Buscador sin `backdrop-filter`**: era la causa del jitter (37→55 fps al abrir).

## Estado

Hecho y probado (tipos, lint, build, capturas, gestos simulados): 3 niveles de navegación, carets, JSON + modelos, buscador, horarios, paletas, microinteracciones.

## Pendiente / siguientes pasos

1. **Más información en la hoja inferior** (el usuario traerá los requisitos).
2. Fotos reales del negocio en lugar de Unsplash.
3. Horarios, direcciones y contacto reales de las sedes.
4. Optimizar el swipe y el cambio de categoría (~40–48 fps con CPU 4×).
5. Opcional, propuesto antes: PWA instalable y publicación con HTTPS (GitHub Pages).

## Forma de trabajo con el usuario

- Escribe en español, directo; le gusta ver capturas y números (fps, contraste).
- Prueba en su teléfono y **valida antes de subir**: no hacer commit/push sin su visto bueno.
- Trabaja en ramas para no tocar la base.
