import { motion, type Variants } from 'motion/react'
import { Search, X } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { money } from '../lib/format'
import { highlight, search, type SearchIndex } from '../lib/search'
import type { Menu, MenuItem } from '../types'

type Props = {
  menu: Menu
  /** built once when the menu loads, not when the overlay opens */
  index: SearchIndex
  onClose: () => void
  onSelect: (item: MenuItem) => void
  /** the open animation finished: whatever is underneath can stop painting */
  onOpened: () => void
}

/** How far the blind extends above the screen to hide its bounce. */
const BLIND_OVERSHOOT = 96
const POP ={ type: 'spring', stiffness: 520, damping: 22 } as const
const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.025, delayChildren: 0.06 } } }
const pop: Variants = {
  hidden: { opacity: 0, scale: 0.85, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: POP },
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
export function SearchOverlay({ menu, index, onClose, onSelect, onOpened }: Props) {
  const [query, setQuery] = useState('')
  // the field updates on every key; the result list follows when the main thread is free
  const deferred = useDeferredValue(query)
  const hits = useMemo(() => search(index, deferred), [index, deferred])
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
      // a roller blind: drops from the top and overshoots a little (boing); on close it dips, then rolls up.
      // Opaque and transform-only: a backdrop blur here was re-rendered every frame over the animated carta.
      initial={{ y: '-102%' }}
      animate={{ y: '0%' }}
      exit={{ y: ['0%', '3%', '-102%'], transition: { duration: 0.42, times: [0, 0.22, 1], ease: ['easeOut', [0.55, 0, 0.8, 0.3]] } }}
      transition={{ type: 'spring', stiffness: 240, damping: 19, mass: 0.9 }}
      onAnimationComplete={(def) => (def as { y?: unknown }).y === '0%' && onOpened()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      // the blind reaches above the screen, so its overshoot never uncovers a gap at the top
      style={{ top: -BLIND_OVERSHOOT, paddingTop: BLIND_OVERSHOOT, height: `calc(100% + ${BLIND_OVERSHOOT}px)`, willChange: 'transform', visibility: 'visible' }}
      className="absolute inset-x-0 z-50 flex flex-col rounded-b-[28px] bg-[#F1E6DA] shadow-[0_18px_36px_-14px_rgba(42,26,18,.55)]"
    >
      {/* the blind's bottom bar */}
      <span aria-hidden className="absolute inset-x-0 bottom-2 mx-auto h-1.5 w-12 rounded-full bg-espresso/20" />
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
            // Enter (or the phone's "search" key) only puts the keyboard away, leaving the results to browse
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
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
        {!deferred.trim() ? (
          <Suggestions suggestions={suggestions} onPick={setQuery} />
        ) : sections.length === 0 ? (
          <div className="pt-10 text-center">
            <p className="font-display text-xl font-semibold text-espresso">Sin resultados para “{deferred.trim()}”</p>
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
                              <Marked text={item.name} query={deferred} />
                            </span>
                            <span className="block truncate text-[12px] text-cocoa">
                              {reason ? (
                                <>
                                  {reason.kind} · <Marked text={reason.text} query={deferred} />
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

/** One quick-search suggestion. */
function Chip({ label, icon: Icon, onPick }: { label: string; icon: Menu['categories'][number]['icon']; onPick: (q: string) => void }) {
  return (
    <motion.button
      variants={pop}
      whileTap={{ scale: 0.9 }}
      type="button"
      onClick={() => onPick(label)}
      className="flex min-h-10 items-center gap-1.5 rounded-full bg-white/70 px-3.5 text-[13px] font-bold text-espresso ring-1 ring-white/80"
    >
      <Icon size={15} strokeWidth={2.2} aria-hidden className="text-cocoa" />
      {label}
    </motion.button>
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
  // chips pop in one after another, with a little bounce
  return (
    <motion.div variants={list} initial="hidden" animate="show" className={compact ? 'flex flex-wrap justify-center gap-2' : 'pt-2'}>
      {!compact && <h2 className="px-1 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cocoa">Categorías</h2>}
      <motion.div variants={list} className={compact ? 'contents' : 'flex flex-wrap gap-2'}>
        {suggestions.categories.map(({ id, name, icon }) => (
          <Chip key={id} label={name} icon={icon} onPick={onPick} />
        ))}
      </motion.div>
      {!compact && <h2 className="px-1 pb-2 pt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-cocoa">Preferencias</h2>}
      <motion.div variants={list} className={compact ? 'contents' : 'flex flex-wrap gap-2'}>
        {suggestions.tags.map(({ id, label, icon }) => (
          <Chip key={id} label={label} icon={icon} onPick={onPick} />
        ))}
      </motion.div>
    </motion.div>
  )
}
