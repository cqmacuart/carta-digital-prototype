import { motion, useAnimationControls } from 'motion/react'
import { Check, Lock, Minus, Plus, Pointer, Undo2, X } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { money } from '../lib/format'
import { cap, count, L } from '../lib/labels'
import { DEFAULT_LABELS } from '../lib/vocabulary'
import type { OptionGroup } from '../models/db'
import type { Category, MenuItem } from '../types'
import { defaultChoice, missing, unitPrice, type Choice } from './cart'

type Props = {
  item: MenuItem
  category: Category
  /** editing a line already in the cart */
  initial?: { choice: Choice; qty: number }
  /** "Agregar" or "Guardar" */
  verb: string
  /** `from`: where the add button is, for the photo that flies to the bag */
  onSubmit: (choice: Choice, qty: number, from: DOMRect) => void
}

const TAP = { type: 'spring', stiffness: 520, damping: 15 } as const
/** the section that still needs a pick shakes when the customer tries to add */
const SHAKE = { x: [0, -7, 7, -5, 5, 0], transition: { duration: 0.4 } }

const limit = (g: { min: number; max: number }) =>
  g.max === 1 ? 'elige 1' : g.min === g.max ? `elige ${g.max}` : g.min ? `elige de ${g.min} a ${g.max}` : `hasta ${g.max}`

/** A chip that toggles; picked = filled with the sheet's ink, so it reads on light and dark sheets alike. */
function Pick({ on, onClick, category, children, label }: { on: boolean; onClick: () => void; category: Category; children: ReactNode; label?: string }) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      whileTap={{ scale: 0.92 }}
      transition={TAP}
      onClick={onClick}
      className={`flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold transition-colors duration-200 ${
        on ? 'shadow-[0_4px_10px_-5px_rgba(0,0,0,.5)]' : 'bg-current/10 ring-1 ring-current/15'
      }`}
      style={on ? { backgroundColor: category.ink, color: category.sheet } : undefined}
    >
      {children}
    </motion.button>
  )
}

function Section({ title, hint, children, sectionRef }: { title: string; hint?: ReactNode; children: ReactNode; sectionRef?: (el: HTMLElement | null) => void }) {
  return (
    <section ref={sectionRef} className="mt-6">
      <h2 className="mb-2.5 flex items-baseline gap-2 font-display text-lg font-semibold">
        {title}
        {hint && <span className="font-sans text-[12px] font-bold uppercase tracking-[0.12em] opacity-70">{hint}</span>}
      </h2>
      {children}
    </section>
  )
}

/**
 * The dish's choices made tappable: variant (one), option groups (min/max), included toppings (up to N), paid
 * add-ons, ingredients to leave out, a note; then quantity and the add button, pinned to the bottom of the sheet.
 */
export function ItemOptions({ item, category, initial, verb, onSubmit }: Props) {
  const [choice, setChoice] = useState<Choice>(() => initial?.choice ?? defaultChoice(item))
  const [qty, setQty] = useState(initial?.qty ?? 1)
  const [done, setDone] = useState(false)
  /** the last fixed ingredient tapped, and how many taps so far (to replay its shake) */
  const [locked, setLocked] = useState<{ name: string; n: number } | null>(null)
  const accent = { color: category.accent }
  const need = missing(item, choice)
  const price = unitPrice(item, choice) * qty

  // where to take the customer when something is still missing
  const sections = useRef(new Map<string, HTMLElement>())
  const button = useRef<HTMLButtonElement>(null)
  const shake = useAnimationControls()
  const [shaking, setShaking] = useState<string | null>(null)
  const firstMissing = () => {
    if (item.variants && !choice.variantId) return 'variant'
    return item.optionGroups?.find((g) => (choice.options[g.id]?.length ?? 0) < g.min)?.id ?? null
  }

  const toggle = (list: string[], id: string, max = Infinity) =>
    list.includes(id) ? list.filter((x) => x !== id) : max === 1 ? [id] : list.length < max ? [...list, id] : list

  const pickOption = (g: OptionGroup, id: string) => {
    const now = choice.options[g.id] ?? []
    const next = toggle(now, id, g.max)
    if (next === now) {
      // full: say so instead of silently ignoring the tap
      setShaking(g.id)
      shake.start(SHAKE)
      return
    }
    setChoice({ ...choice, options: { ...choice.options, [g.id]: next } })
  }

  const submit = () => {
    if (need) {
      const at = firstMissing()
      const el = at ? sections.current.get(at) : undefined
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setShaking(at)
      shake.start(SHAKE)
      return
    }
    onSubmit(choice, qty, button.current!.getBoundingClientRect())
    if (initial) return
    // a quick "agregado", then a fresh dish for the next one
    setDone(true)
    setTimeout(() => {
      setDone(false)
      setChoice(defaultChoice(item))
      setQty(1)
    }, 900)
  }

  const register = (id: string) => (el: HTMLElement | null) => {
    if (el) sections.current.set(id, el)
    else sections.current.delete(id)
  }
  const hintFor = (id: string, text: string) => (
    <motion.span animate={shaking === id ? shake : undefined} className="inline-block">
      {text}
    </motion.span>
  )

  return (
    <div className="flex min-h-full flex-col">
      {item.variants && item.variants.length > 1 && (
        // "Elige · una"; a noun heading ("Presentación") needs the verb in its hint
        <Section title={L.choose} hint={hintFor('variant', L.choose === DEFAULT_LABELS.choose ? 'una' : 'elige una')} sectionRef={register('variant')}>
          <div role="radiogroup" aria-label="Variantes" className="divide-y divide-current/10">
            {item.variants.map((v) => {
              const on = v.id === choice.variantId
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setChoice({ ...choice, variantId: v.id })}
                  className="flex min-h-12 w-full items-center gap-3 py-2.5 text-left"
                >
                  <span
                    aria-hidden
                    className={`grid size-[22px] shrink-0 place-items-center rounded-full ring-2 transition-colors ${on ? '' : 'ring-current/30'}`}
                    style={on ? { backgroundColor: category.ink, boxShadow: `0 0 0 2px ${category.ink}` } : undefined}
                  >
                    {on && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={TAP}>
                        <Check size={14} strokeWidth={3.2} style={{ color: category.sheet }} />
                      </motion.span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] leading-snug">
                    <span className="font-semibold">{v.name}</span>
                    {v.detail && <span className="block text-[13px] opacity-75">{v.detail}</span>}
                  </span>
                  <span className="shrink-0 font-display text-[17px] font-semibold tabular-nums" style={accent}>
                    {money(v.price)}
                  </span>
                </button>
              )
            })}
          </div>
        </Section>
      )}

      {item.optionGroups?.map((g) => {
        const picked = choice.options[g.id] ?? []
        return (
          <Section key={g.id} title={g.name} hint={hintFor(g.id, limit(g))} sectionRef={register(g.id)}>
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => {
                const on = picked.includes(o.id)
                return (
                  <Pick key={o.id} on={on} category={category} onClick={() => pickOption(g, o.id)}>
                    {on && <Check size={15} strokeWidth={3} aria-hidden />}
                    {o.name}
                    {o.price > 0 && <span className="tabular-nums opacity-80">+{money(o.price)}</span>}
                  </Pick>
                )
              })}
            </div>
          </Section>
        )
      })}

      {item.toppings && (
        <Section title={`Incluye ${count(item.toppings.count, L.topping)}`} hint={hintFor('toppings', `hasta ${item.toppings.count}`)}>
          <div className="flex flex-wrap gap-2">
            {item.toppings.options.map((t) => {
              const on = choice.toppingIds.includes(t.id)
              return (
                <Pick
                  key={t.id}
                  on={on}
                  category={category}
                  onClick={() => {
                    const next = toggle(choice.toppingIds, t.id, item.toppings!.count)
                    if (next === choice.toppingIds) {
                      setShaking('toppings')
                      shake.start(SHAKE)
                    } else setChoice({ ...choice, toppingIds: next })
                  }}
                >
                  {on && <Check size={15} strokeWidth={3} aria-hidden />}
                  {t.name}
                </Pick>
              )
            })}
          </div>
        </Section>
      )}

      {item.modifiers && (
        <Section title={cap(L.modifier[1])}>
          <div className="flex flex-wrap gap-2">
            {item.modifiers.map((m) => {
              const on = choice.modifierIds.includes(m.id)
              return (
                <Pick key={m.id} on={on} category={category} onClick={() => setChoice({ ...choice, modifierIds: toggle(choice.modifierIds, m.id) })}>
                  {on ? <Check size={15} strokeWidth={3} aria-hidden /> : <Plus size={15} strokeWidth={2.6} aria-hidden />}
                  {m.name}
                  <span className="tabular-nums opacity-80">+{money(m.price)}</span>
                </Pick>
              )
            })}
          </div>
        </Section>
      )}

      {item.ingredients && item.ingredients.every((ing) => item.fixedIngredients?.includes(ing)) && (
        // nothing to take out (a perfume's notes, a croissant): they read like the carta's, with no locks to tap
        <Section title={cap(L.ingredient[1])}>
          <ul className="flex flex-wrap gap-2">
            {item.ingredients.map((ing) => (
              <li key={ing} className="rounded-full bg-current/10 px-3.5 py-2 text-[14px] font-semibold ring-1 ring-current/15">
                {ing}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {item.ingredients && !item.ingredients.every((ing) => item.fixedIngredients?.includes(ing)) && (
        <Section title={cap(L.ingredient[1])}>
          {/* most people only read the heading: the instruction gets its own line, in the accent, with a tapping finger */}
          {item.ingredients.some((ing) => !item.fixedIngredients?.includes(ing)) && (
            <p className="-mt-1 mb-3 flex items-center gap-2 text-[15px] font-bold" style={accent}>
              <motion.span
                aria-hidden
                animate={{ scale: [1, 0.8, 1], y: [0, 2, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2.2 }}
                className="grid size-7 place-items-center rounded-full bg-current/12"
              >
                <Pointer size={15} strokeWidth={2.6} />
              </motion.span>
              Toca los que no quieras
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {item.ingredients.map((ing) => {
              const fixed = item.fixedIngredients?.includes(ing)
              const out = choice.without.includes(ing)
              if (fixed)
                return (
                  <motion.button
                    // a new key per tap replays the shake
                    key={locked?.name === ing ? `${ing}-${locked.n}` : ing}
                    type="button"
                    aria-disabled
                    aria-label={`${ing}: va siempre en este ${L.item[0]}`}
                    initial={false}
                    animate={locked?.name === ing ? { x: [0, -5, 5, -3, 3, 0] } : undefined}
                    transition={{ duration: 0.35 }}
                    onClick={() => setLocked({ name: ing, n: (locked?.n ?? 0) + 1 })}
                    // looks disabled (it can't change), yet a tap still says why
                    className="flex min-h-11 cursor-not-allowed items-center gap-1.5 rounded-full bg-current/6 px-3.5 text-[14px] font-semibold opacity-45"
                  >
                    <Lock size={13} strokeWidth={2.6} aria-hidden />
                    {ing}
                  </motion.button>
                )
              return (
                <motion.button
                  key={ing}
                  type="button"
                  aria-pressed={out}
                  aria-label={out ? `${ing}: quitado, toca para volver a ponerlo` : `${ing}: toca para quitarlo`}
                  whileTap={{ scale: 0.92 }}
                  transition={TAP}
                  onClick={() => setChoice({ ...choice, without: toggle(choice.without, ing) })}
                  className={`flex min-h-11 items-center gap-1.5 rounded-full text-[14px] font-semibold transition-opacity duration-200 ${
                    out ? 'border-[1.5px] border-dashed border-current/45 pl-2.5 pr-3.5 opacity-60' : 'bg-current/10 pl-3.5 pr-1.5 ring-1 ring-current/15'
                  }`}
                >
                  {out && <Undo2 size={15} strokeWidth={2.6} aria-hidden />}
                  {out ? `Sin ${ing.toLowerCase()}` : ing}
                  {!out && (
                    // the × on every removable one says "this can go" before any instruction is read
                    <span aria-hidden className="grid size-[22px] place-items-center rounded-full bg-current/15">
                      <X size={13} strokeWidth={3} />
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>
          {locked && (
            <motion.p
              key={locked.n}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 0.8, y: 0 }}
              className="mt-2.5 flex items-center gap-1.5 text-[13px] font-semibold"
              role="status"
            >
              <Lock size={14} strokeWidth={2.6} aria-hidden />
              {locked.name} va siempre en este {L.item[0]}
            </motion.p>
          )}
        </Section>
      )}

      <Section title="Nota">
        <textarea
          value={choice.note}
          onChange={(e) => setChoice({ ...choice, note: e.target.value.slice(0, 140) })}
          onPointerDown={(e) => e.stopPropagation()}
          rows={2}
          placeholder={L.notePlaceholder}
          aria-label={`Nota para este ${L.item[0]}`}
          className="w-full resize-none rounded-2xl bg-current/8 px-4 py-3 text-[16px] font-medium leading-snug outline-none ring-1 ring-current/15 placeholder:opacity-60 focus:ring-2 focus:ring-current/40"
        />
      </Section>

      {/* quantity + add, pinned to the bottom of the sheet while the choices scroll under it */}
      <div
        className="sticky bottom-0 -mx-6 mt-auto flex items-center gap-3 px-6 pb-[max(14px,env(safe-area-inset-bottom))] pt-4"
        style={{ background: `linear-gradient(to bottom, transparent, ${category.sheet} 22%)` }}
      >
        <div className="flex shrink-0 items-center rounded-full bg-current/10 ring-1 ring-current/15">
          <motion.button
            type="button"
            aria-label="Uno menos"
            whileTap={{ scale: 0.85 }}
            transition={TAP}
            disabled={qty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid size-11 place-items-center disabled:opacity-35"
          >
            <Minus size={18} strokeWidth={2.6} />
          </motion.button>
          <span className="w-6 text-center font-display text-[18px] font-semibold tabular-nums" aria-live="polite">
            {qty}
          </span>
          <motion.button
            type="button"
            aria-label="Uno más"
            whileTap={{ scale: 0.85 }}
            transition={TAP}
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            className="grid size-11 place-items-center"
          >
            <Plus size={18} strokeWidth={2.6} />
          </motion.button>
        </div>
        <motion.button
          ref={button}
          type="button"
          whileTap={{ scale: 0.95 }}
          transition={TAP}
          onClick={submit}
          aria-disabled={!!need}
          className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 text-[15px] font-bold shadow-[0_8px_18px_-8px_rgba(0,0,0,.55)] ${need ? 'opacity-70' : ''}`}
          style={{ backgroundColor: category.ink, color: category.sheet }}
        >
          {done ? (
            <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={TAP} className="flex items-center gap-1.5">
              <Check size={18} strokeWidth={3} aria-hidden /> Agregado
            </motion.span>
          ) : need ? (
            `Elige ${need}`
          ) : (
            <>
              {verb} <span className="tabular-nums opacity-85">· {money(price)}</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
