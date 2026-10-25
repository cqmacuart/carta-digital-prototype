# Backlog — carta digital

## Roadmap
| Versión | Qué es | Condición para pasar a la siguiente |
|---|---|---|
| **V1** · Carta | Carta por cliente, build estático, QR. Datos en `themes/<slug>/`. | 1–3 clientes pagando. |
| **V2** · Pedido por WhatsApp | Carrito en JS que arma el mensaje (`wa.me/?text=`). Activable por cliente (`business.json` → `ordering`), aislado en build, sin pagos ni POS. **Hecho en la rama `v2-pedidos`** (demo: Terra). | Clientes pidiendo cambios de precio seguido. |
| **V3** · Manager | El cliente edita precios, disponible/agotado, horario y alta/baja de productos. Escribe el mismo `menu.json` (o una API con su forma). | ~10+ clientes: editar JSON a mano deja de escalar. |
| **V4** · Multitenancy | Un solo despliegue; el cliente sale del subdominio y `fetchMenu(slug)` llama a la API. | El costo de desplegar uno por uno supera el de operar un servidor. |

Fuera de alcance: POS, pagos en línea, inventario.

## Pendiente
- Vocabulario por negocio en `theme.json`: hoy la hoja dice "Ingredientes", "Incluye N toppings", "Adiciones". En Barrio las salsas de las alitas van en la descripción porque "toppings" no encaja; desayunos sorpresa o arreglos dirían "Incluye".
- Vista de lista o cuadrícula por categoría (`layout` en `theme.json`) para cartas grandes: en Nami (48 productos, 8 rolls clásicos) evaluar si pasar de uno en uno cansa.
- V2 · combos y alitas de Barrio y mitad y mitad de Forno: ya se pueden modelar con `optionGroups` (acompañamiento **y** bebida, "elige 2 salsas"); falta pasarlos a sus `menu.json` y activar `ordering` en esas demos (hoy son productos con el detalle en el texto).
- V2 · mitad y mitad que cobra la mitad más cara: hoy cada opción suma un precio fijo; si un negocio lo pide, agregar una regla de precio por grupo (`pricing: "max"`).
- La Sablée (fuera de git): sigue en `schemaVersion` 2, sin ingredientes fijos; marcarlos si activa pedidos.
- V2 · pedidos fuera de horario: hoy se avisa "Cerrado… te responden cuando abran" pero se puede enviar; decidir con cada negocio si se bloquea.
- V2 · validar en el celular de Cesar el envío real a WhatsApp (en el navegador del PC se probó hasta armar el enlace `wa.me`).
- Fotos subidas por el dueño (V3; las locales en `themes/<slug>/assets/` ya funcionan): subida desde el editor a un CDN con recorte y desenfoque por URL (Cloudinary/ImageKit) o a Hostinger con PHP.
- La Sablée: horarios reales (en su historia destacada de Instagram) y paletas de categoría según su marca (café oscuro + crema); hoy usa las de Terra.
