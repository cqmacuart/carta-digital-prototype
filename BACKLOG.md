# Backlog — carta digital

## Roadmap
| Versión | Qué es | Condición para pasar a la siguiente |
|---|---|---|
| **V1** · Carta | Carta por cliente, build estático, QR. Datos en `themes/<slug>/`. | 1–3 clientes pagando. |
| **V2** · Pedido por WhatsApp | Carrito en JS que arma el mensaje (`wa.me/?text=`). Activable por cliente (`theme.json`/`menu.json`), sin pagos ni POS. | Clientes pidiendo cambios de precio seguido. |
| **V3** · Manager | El cliente edita precios, disponible/agotado, horario y alta/baja de productos. Escribe el mismo `menu.json` (o una API con su forma). | ~10+ clientes: editar JSON a mano deja de escalar. |
| **V4** · Multitenancy | Un solo despliegue; el cliente sale del subdominio y `fetchMenu(slug)` llama a la API. | El costo de desplegar uno por uno supera el de operar un servidor. |

Fuera de alcance: POS, pagos en línea, inventario.

## Pendiente
- Vocabulario por negocio en `theme.json`: hoy la hoja dice "Ingredientes", "Incluye N toppings", "Adiciones". En Barrio las salsas de las alitas van en la descripción porque "toppings" no encaja; desayunos sorpresa o arreglos dirían "Incluye".
- Vista de lista o cuadrícula por categoría (`layout` en `theme.json`) para cartas grandes: en Nami (48 productos, 8 rolls clásicos) evaluar si pasar de uno en uno cansa.
- Combos con varios grupos de elección (acompañamiento **y** bebida): hoy son productos con el detalle en el texto; el carrito de V2 los necesitará modelados.
- Fotos subidas por el dueño (V3; las locales en `themes/<slug>/assets/` ya funcionan): subida desde el editor a un CDN con recorte y desenfoque por URL (Cloudinary/ImageKit) o a Hostinger con PHP.
- La Sablée: horarios reales (en su historia destacada de Instagram) y paletas de categoría según su marca (café oscuro + crema); hoy usa las de Terra.
