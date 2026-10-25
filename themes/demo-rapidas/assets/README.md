# assets

Fotos propias del negocio. Cada producto puede usar una foto de aquí o una de Unsplash; las dos fuentes conviven en la misma carta.

1. Pon el original aquí, p. ej. `croissant-clasico.jpg` (JPG, PNG o WebP, lo más grande que haya; las fotos de celular giradas salen derechas).
2. En `menu.json`, en el producto:
   `"image": { "source": "local", "file": "croissant-clasico.jpg", "focal": { "x": 0.5, "y": 0.5, "zoom": 1.1 }, "alt": "Croissant clásico" }`
   - `focal.x` / `focal.y` (0–1): dónde está el centro del plato en la foto. `zoom`: 1 = todo el lado corto; 2 = la mitad.
3. `npm run dev -- <slug>` o `npm run build -- <slug>`: se generan las 4 versiones (640 nítida, 120 miniatura, 320 y 96 desenfocadas) en WebP, en `media/` del build.

- Si falta un archivo, el build se detiene y dice qué producto lo pide.
- Al cambiar una foto o su `focal`, el nombre generado cambia: nadie ve la versión vieja en caché.
- Fotos reales del negocio, con luz coherente entre sí. Las elige y recorta Cesar.
