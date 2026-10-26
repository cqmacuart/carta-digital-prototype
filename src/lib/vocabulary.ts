/**
 * The words a business uses for its things. A pizzería sells "platos" from its "carta"; a perfumería sells "productos"
 * from its "catálogo", whose ingredients are "notas olfativas". themes/<slug>/theme.json → `labels` overrides any of
 * these. Shared by the build (vite.config.ts checks the keys) and the app (src/lib/labels.ts merges them).
 * Pairs are [singular, plural], lowercase; headings capitalise them.
 */
export interface Labels {
  /** one thing on the list: "plato" (the UI says "un plato", "este plato") */
  item: [string, string]
  /** the whole list, with its article: "la carta" ("Buscar en la carta", "Cargando la carta") */
  menu: string
  /** heading over the variants on the open sheet */
  choose: string
  /** the "N variantes" badge and search hints */
  variant: [string, string]
  ingredient: [string, string]
  modifier: [string, string]
  /** "Incluye 2 toppings" */
  topping: [string, string]
  /** V2: hint inside the note field of an order line */
  notePlaceholder: string
}

export const DEFAULT_LABELS: Labels = {
  item: ['plato', 'platos'],
  menu: 'la carta',
  choose: 'Elige',
  variant: ['variante', 'variantes'],
  ingredient: ['ingrediente', 'ingredientes'],
  modifier: ['adición', 'adiciones'],
  topping: ['topping', 'toppings'],
  notePlaceholder: 'Ej.: bien asado, sin hielo…',
}
