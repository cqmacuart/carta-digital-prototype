import type { Menu, MenuItem } from '../types'

/** Accent- and case-insensitive form used for matching ("Café" ≈ "cafe"). */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

type Field = { kind: string; text: string; folded: string; weight: number }
type Entry = { item: MenuItem; order: number; fields: Field[] }
export type SearchIndex = Entry[]

/** Why a dish matched, when it was not by its name: shown under the result. */
export type Reason = { kind: string; text: string }
export type SearchHit = { item: MenuItem; score: number; reason?: Reason }

/** Every searchable datum of each dish, weighted: name first, then navigation and tags, then details. */
export function buildIndex(menu: Menu): SearchIndex {
  const cats = new Map(menu.categories.map((c) => [c.id, c]))
  return menu.items.map((item, order) => {
    const cat = cats.get(item.category)!
    const sub = cat.subcategories.find((s) => s.id === item.sub)
    const field = (kind: string, text: string | undefined, weight: number): Field[] =>
      text ? [{ kind, text, folded: fold(text), weight }] : []
    return {
      item,
      order,
      fields: [
        ...field('Nombre', item.name, 6),
        ...field('Categoría', cat.name, 3),
        ...(cat.subcategories.length > 1 ? field('Subcategoría', sub?.name, 3) : []),
        ...field('Grupo', item.group, 3),
        ...(item.tags ?? []).flatMap((t) => field('Etiqueta', t.label, 3)),
        ...(item.ingredients ?? []).flatMap((i) => field('Ingrediente', i, 2.5)),
        ...(item.variants ?? []).flatMap((v) => [...field('Variante', v.name, 2.5), ...field('Variante', v.detail, 2)]),
        ...(item.modifiers ?? []).flatMap((m) => field('Adición', m.name, 1.5)),
        ...field('Descripción', item.tagline, 1.2),
        // toppings are left out on purpose: the same pool is on every dish that has toppings,
        // so "chocolate" would list every waffle instead of the dishes made with chocolate
        ...field('Descripción', item.description, 1),
      ],
    }
  })
}

/** How well one query word matches one field: whole word > start of a word > anywhere. */
function wordScore(folded: string, token: string) {
  const at = folded.indexOf(token)
  if (at < 0) return 0
  const startOfWord = at === 0 || /[^a-z0-9]/.test(folded[at - 1])
  const end = at + token.length
  const wholeWord = startOfWord && (end === folded.length || /[^a-z0-9]/.test(folded[end]))
  return wholeWord ? 1 : startOfWord ? 0.8 : 0.4
}

/** Every word of the query must match some field (AND); the best field per word counts. */
export function search(index: SearchIndex, query: string, limit = 40): SearchHit[] {
  const tokens = fold(query).split(/\s+/).filter((t) => t.length > 0)
  if (!tokens.length) return []
  const hits: (SearchHit & { order: number })[] = []
  for (const { item, order, fields } of index) {
    let score = 0
    let reason: Reason | undefined
    let byName = true
    let ok = true
    for (const token of tokens) {
      let best = 0
      let bestField: Field | undefined
      for (const f of fields) {
        const s = wordScore(f.folded, token) * f.weight
        if (s > best) {
          best = s
          bestField = f
        }
      }
      if (!best) {
        ok = false
        break
      }
      score += best
      if (bestField!.kind !== 'Nombre') {
        byName = false
        if (!reason || bestField!.weight > 1.2) reason = { kind: bestField!.kind, text: bestField!.text }
      }
    }
    if (ok) hits.push({ item, score, reason: byName ? undefined : reason, order })
  }
  return hits.sort((a, b) => b.score - a.score || a.order - b.order).slice(0, limit)
}

/** Split `text` around the parts that match the query words, for highlighting. */
export function highlight(text: string, query: string): { text: string; match: boolean }[] {
  const tokens = fold(query).split(/\s+/).filter((t) => t.length > 1)
  const folded = fold(text)
  const marks = new Array(text.length).fill(false)
  for (const t of tokens) {
    let i = folded.indexOf(t)
    while (i >= 0) {
      for (let k = i; k < i + t.length; k++) marks[k] = true
      i = folded.indexOf(t, i + t.length)
    }
  }
  const parts: { text: string; match: boolean }[] = []
  for (let i = 0; i < text.length; i++) {
    const last = parts.at(-1)
    if (last && last.match === marks[i]) last.text += text[i]
    else parts.push({ text: text[i], match: marks[i] })
  }
  return parts
}
