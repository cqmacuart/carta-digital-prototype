import { motion } from 'motion/react'
import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { money } from '../lib/format'
import { buildIndex, highlight, search } from '../lib/search'
import type { Menu, MenuItem } from '../types'

type Props = {
  menu: Menu
  onClose: () => void
  onSelect: (item: MenuItem) => void
}

/** Words in the result that match the query, emphasised. */
function Marked({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlight(text, query).map((p, i) =>
        p.match ? (
          <mark key={i} className="rounded-[3px] bg-clay/35 px-px text-inherit">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  )
}

/**
 * Full-screen search over every datum of the menu: names, categories, subcategories, groups,
 * tags, ingredients, variants, descriptions. Picking a result takes the carousel to that dish.
 */
export function SearchOverlay({ menu, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const index = useMemo(() => buildIndex(menu), [menu])
  const hits = useMemo(() => search(index, query), [index, query])
  const cats = useMemo(() => new Map(menu.categories.map((c) => [c.id, c])), [menu.categories])

  // grouped by category; the category holding the best match comes first, best matches first inside each
  const sections = useMemo(() => {
    const byCat = new Map<string, typeof hits>()
    for (const h of hits) byCat.set(h.item.category, [...(byCat.get(h.item.category) ?? []), h])
    return [...byCat.entries()]
      .map(([id, rows]) => ({ category: cats.get(id)!, hits: rows }))
      .sort((a, b) => b.hits[0].score - a.hits[0].score)
  }, [hits, cats])

  // quick searches before typing: the categories, then every badge used in the carta
  const suggestions = useMemo(() => {
    const tags = [...new Map(menu.items.flatMap((m) => m.tags ?? []).map((t) => [t.id, t])).values()]
    return { categories: menu.categories, tags }
  }, [menu])

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Buscar en la carta"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, transition: { duration: 0.16 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      className="absolute inset-0 z-50 flex flex-col bg-[#F1E6DA]/97 backdrop-blur-sm"
    >
      {/* search field */}
      <div className="flex shrink-0 items-center gap-2 px-4 pb-3 pt-4">
        <label className="flex min-h-12 flex-1 items-center gap-2 rounded-full bg-white/85 pl-4 pr-1.5 ring-1 ring-white shadow-[0_6px_18px_-10px_rgba(42,26,18,.45)]">
          <Search size={18} strokeWidth={2.4} className="shrink-0 text-cocoa" aria-hidden />
          <input
            autoFocus
            type="search"
            inputMode="search"
            enterKeyHint="search"
            aria-label="Buscar platos, ingredientes o etiquetas"
            placeholder="Platos, ingredientes, etiquetas…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && hits[0]) onSelect(hits[0].item)
            }}
            className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-espresso outline-none placeholder:font-medium placeholder:text-cocoa/70 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" aria-label="Borrar búsqueda" onClick={() => setQuery('')} className="grid size-9 place-items-center rounded-full text-cocoa">
              <X size={17} strokeWidth={2.6} />
            </button>
          )}
        </label>
        <button type="button" onClick={onClose} className="min-h-11 px-2 text-[14px] font-bold text-espresso">
          Cerrar
        </button>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        {!query.trim() ? (
          <Suggestions suggestions={suggestions} onPick={setQuery} />
        ) : sections.length === 0 ? (
          <div className="pt-10 text-center">
            <p className="font-display text-xl font-semibold text-espresso">Sin resultados para “{query.trim()}”</p>
            <p className="mt-1 text-[14px] text-cocoa">Prueba con otra palabra o una de estas:</p>
            <div className="mt-5">
              <Suggestions suggestions={suggestions} onPick={setQuery} compact />
            </div>
          </div>
        ) : (
          <>
            <p className="px-1 pb-2 text-[12px] font-bold text-cocoa" aria-live="polite">
              {hits.length} {hits.length === 1 ? 'resultado' : 'resultados'}
            </p>
            {sections.map(({ category, hits: rows }) => (
              <section key={category.id} className="mb-4">
                <h2 className="flex items-center gap-2 px-1 pb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-cocoa">
                  <span className="size-2 rounded-full" style={{ backgroundColor: category.sheet }} aria-hidden />
                  {category.name}
                  <span className="font-semibold tracking-normal opacity-70">({rows.length})</span>
                </h2>
                <ul className="overflow-hidden rounded-[22px] bg-white/70 ring-1 ring-white/80">
                  {rows.map(({ item, reason }) => {
                    const sub = cats.get(item.category)?.subcategories.find((s) => s.id === item.sub)
                    return (
                      <li key={item.id} className="border-b border-espresso/8 last:border-0">
                        <button type="button" onClick={() => onSelect(item)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-white/60">
                          <img src={item.imgThumb} alt="" loading="lazy" className="size-12 shrink-0 rounded-full object-cover shadow-[0_4px_10px_-4px_rgba(74,36,16,.5)]" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-bold text-espresso">
                              <Marked text={item.name} query={query} />
                            </span>
                            <span className="block truncate text-[12px] text-cocoa">
                              {reason ? (
                                <>
                                  {reason.kind} · <Marked text={reason.text} query={query} />
                                </>
                              ) : (
                                [sub && cats.get(item.category)!.subcategories.length > 1 ? sub.name : null, item.group].filter(Boolean).join(' · ') || item.tagline
                              )}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            {item.variants && <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-cocoa">desde</span>}
                            <span className="font-display text-[15px] font-semibold tabular-nums text-terra">{money(item.price)}</span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </motion.div>
  )
}

function Suggestions({
  suggestions,
  onPick,
  compact = false,
}: {
  suggestions: { categories: Menu['categories']; tags: NonNullable<MenuItem['tags']> }
  onPick: (q: string) => void
  compact?: boolean
}) {
  const chip = 'flex min-h-10 items-center gap-1.5 rounded-full bg-white/70 px-3.5 text-[13px] font-bold text-espresso ring-1 ring-white/80 active:bg-white'
  return (
    <div className={compact ? 'flex flex-wrap justify-center gap-2' : 'pt-2'}>
      {!compact && <h2 className="px-1 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cocoa">Categorías</h2>}
      <div className={compact ? 'contents' : 'flex flex-wrap gap-2'}>
        {suggestions.categories.map(({ id, name, icon: Icon }) => (
          <button key={id} type="button" onClick={() => onPick(name)} className={chip}>
            <Icon size={15} strokeWidth={2.2} aria-hidden className="text-cocoa" />
            {name}
          </button>
        ))}
      </div>
      {!compact && <h2 className="px-1 pb-2 pt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-cocoa">Preferencias</h2>}
      <div className={compact ? 'contents' : 'flex flex-wrap gap-2'}>
        {suggestions.tags.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => onPick(label)} className={chip}>
            <Icon size={15} strokeWidth={2.2} aria-hidden className="text-cocoa" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
