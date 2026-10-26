/** true when this build's business.json has `ordering.enabled` (V2): set by vite.config.ts, so V1 builds drop src/pedidos/ entirely */
declare const __PEDIDOS__: boolean
/** this business's words (theme.json → `labels`), merged over the defaults in src/lib/labels.ts */
declare const __LABELS__: Partial<import('./lib/vocabulary').Labels>
