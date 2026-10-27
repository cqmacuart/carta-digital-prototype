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
- Barrio: ya existe `theme.json` → `labels` (rama `demo-perfumeria`); evaluar `topping: ["salsa", "salsas"]` para las alitas en vez de dejarlas en la descripción.
- Catálogo (perfumería, desayunos sorpresa, floristerías), pendiente de un cliente real que lo pida:
  - Agotado **por presentación** (hoy `available` es por producto): `Variant.available`, tachada en la hoja y no elegible al pedir.
  - Negocio **sin sede** ni horario (vende por Instagram): el encabezado no mostraría "Abierto · hasta…".
  - Pedidos con **envío nacional por transportadora** (tarifa por ciudad + una para el resto del país, o "a convenir") y **pago anticipado** (Nequi/transferencia con los datos de la cuenta en el carrito y "envío comprobante" en el mensaje). Datos del cliente sin cédula. Ya acordado con Cesar.
  - Campos propios (marca, género, familia, concentración, pirámide salida/corazón/fondo) como facetas genéricas en `menu.json`, si los filtros llegan a hacer falta. Hoy Nácar lo resuelve con categorías = familia, subcategorías = género, notas en ingredientes y la pirámide en la descripción.
- Vista de lista o cuadrícula por categoría (`layout` en `theme.json`) para cartas grandes: en Nami (48 productos, 8 rolls clásicos) evaluar si pasar de uno en uno cansa.
- V2 · combos y alitas de Barrio y mitad y mitad de Forno: ya se pueden modelar con `optionGroups` (acompañamiento **y** bebida, "elige 2 salsas"); falta pasarlos a sus `menu.json` y activar `ordering` en esas demos (hoy son productos con el detalle en el texto).
- V2 · mitad y mitad que cobra la mitad más cara: hoy cada opción suma un precio fijo; si un negocio lo pide, agregar una regla de precio por grupo (`pricing: "max"`).
- La Sablée (fuera de git): sigue en `schemaVersion` 2, sin ingredientes fijos; marcarlos si activa pedidos.
- V2 · pedidos fuera de horario: hoy se avisa "Cerrado… te responden cuando abran" pero se puede enviar; decidir con cada negocio si se bloquea.
- V2 · validar en el celular de Cesar el envío real a WhatsApp (en el navegador del PC se probó hasta armar el enlace `wa.me`).
- Fotos subidas por el dueño (V3; las locales en `themes/<slug>/assets/` ya funcionan): subida desde el editor a un CDN con recorte y desenfoque por URL (Cloudinary/ImageKit) o a Hostinger con PHP.
- La Sablée: horarios reales (en su historia destacada de Instagram) y paletas de categoría según su marca (café oscuro + crema); hoy usa las de Terra.
- (1583 Café Origen, oct 2026) Enlace directo a una categoría (p. ej. `?cat=licores`) para QR por zona (barra, vitrina) en una carta unificada. Hoy no existe: no prometerlo hasta hacerlo en un chat de Producto.
- (1583 Café Origen) Si un negocio separa sus cartas porque cada área recibe sus pedidos (cocina/barra/repostería), V2 hoy manda todo a un solo WhatsApp. Confirmar con el cliente antes de diseñar algo.
- (1583 Café Origen) Carta grande (~124 productos, 30 botellas de licor): reforzar el punto de vista lista/cuadrícula de arriba antes de armarla.
- (1583 Café Origen, 2026-10-26) Encabezado a 360 px: "1583 Café Origen" se corta ("1583 Café Origer") junto a la píldora "Abierto"; y un lema largo ("Crea momentos con los que más quieres.") se corta también a 390 px. Nombres de ~16+ caracteres necesitan otro layout (reducir la fuente, ocultar la píldora o pasarla a otra línea).
- (1583 Café Origen) Ícono de botella para un riel de licores por botella: hoy se usa `wine` (copa). Tampoco hay ícono de cóctel distinto de `martini` ni de cerveza de barril.
- (1583 Café Origen) Carta grande (225 productos; Bar 84 con 29 clásicos, Licores 42): confirma la necesidad de la vista lista/cuadrícula por categoría (ver arriba).
- (1583 Café Origen) Micheladas como precio por michelar una cerveza: se modeló con un `optionGroup` de precio variable en el producto "Cerveza". Si se repite en otro bar, documentarlo como patrón en `themes/README.md`.
