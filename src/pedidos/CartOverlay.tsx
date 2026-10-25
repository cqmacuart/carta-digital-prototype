import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, Clock, Minus, Pencil, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { money } from '../lib/format'
import { useOpenStatus } from '../lib/useOpenStatus'
import type { Menu } from '../types'
import { clearCart, describe, setCartOpen, setForm, setQty, totals, unitPrice, updateLine, useCart, type Form, type Line } from './cart'
import { ItemOptions } from './ItemOptions'
import { MODE_LABEL, orderMessage, PAYMENT_LABEL, whatsappLink } from './message'

type Props = {
  menu: Menu
  /** the overlay covers the screen: the carta underneath can stop painting */
  onOpened: () => void
  onClosed: () => void
}

const TAP = { type: 'spring', stiffness: 520, damping: 15 } as const

/** data policy: absolute URL as is, a relative one next to the carta (themes/<slug>/public/) */
const policyHref = (url: string) => (/^https?:\/\//.test(url) ? url : `${import.meta.env.BASE_URL}${url.replace(/^\.?\//, '')}`)

const field =
  'w-full rounded-2xl bg-white/85 px-4 py-3 text-[16px] font-semibold text-espresso outline-none ring-1 ring-white shadow-[0_6px_18px_-12px_rgba(42,26,18,.45)] placeholder:font-medium placeholder:text-cocoa/70 focus:ring-2 focus:ring-espresso/30'

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={on}
      whileTap={{ scale: 0.93 }}
      transition={TAP}
      onClick={onClick}
      className={`min-h-11 rounded-full px-4 text-[14px] font-bold transition-colors ${on ? 'bg-espresso text-cream' : 'bg-white/70 text-espresso ring-1 ring-white/80'}`}
    >
      {children}
    </motion.button>
  )
}

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="px-1 pb-2 pt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-cocoa">{children}</h2>
}

/** What is still missing before the order can go, in the customer's words; null = ready to send. */
function blocker(menu: Menu, lines: Line[], form: Form, subtotal: number) {
  const o = menu.order!
  if (!lines.length) return 'Tu pedido está vacío'
  if (o.minOrder && subtotal < o.minOrder) return `El pedido mínimo es ${money(o.minOrder)}`
  if (!form.mode) return 'Elige cómo lo quieres'
  if (!form.name.trim()) return 'Escribe tu nombre'
  if (form.mode === 'domicilio' && !form.address.trim()) return 'Escribe la dirección'
  if (form.mode === 'mesa' && !form.table.trim()) return 'Escribe el número de mesa'
  if (o.payments.length && !form.payment) return 'Elige cómo pagas'
  if (!form.consent) return 'Autoriza el uso de tus datos'
  return null
}

/** The order: lines to review and edit, how it is served and paid, then off to WhatsApp. Rises from the bottom. */
export function CartOverlay({ menu, onOpened, onClosed }: Props) {
  const { open } = useCart()
  return (
    <AnimatePresence onExitComplete={onClosed}>
      {open && <Panel key="cart" menu={menu} onOpened={onOpened} />}
    </AnimatePresence>
  )
}

function Panel({ menu, onOpened }: { menu: Menu; onOpened: () => void }) {
  const order = menu.order!
  const { lines, form } = useCart()
  const items = useMemo(() => new Map(menu.items.map((m) => [m.id, m])), [menu.items])
  const cats = useMemo(() => new Map(menu.categories.map((c) => [c.id, c])), [menu.categories])
  const status = useOpenStatus(menu.business.hours, menu.business.timezone)
  // a single way to be served needs no question
  const mode = form.mode ?? (order.modes.length === 1 ? order.modes[0] : null)
  const t = totals(menu, lines, mode)
  const filled = { ...form, mode }
  const stop = blocker(menu, lines, filled, t.subtotal)
  const [editing, setEditing] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [sent, setSent] = useState(false)
  const close = () => setCartOpen(false)
  const editLine = lines.find((l) => l.key === editing)

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Tu pedido"
      initial={{ y: '102%' }}
      animate={{ y: '0%' }}
      exit={{ y: '102%', transition: { duration: 0.32, ease: [0.55, 0, 0.8, 0.3] } }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      onAnimationComplete={(def) => (def as { y?: unknown }).y === '0%' && onOpened()}
      onKeyDown={(e) => e.key === 'Escape' && (editing ? setEditing(null) : close())}
      style={{ willChange: 'transform', visibility: 'visible' }}
      className="absolute inset-0 z-50 flex flex-col bg-canvas"
    >
      <div className="flex shrink-0 items-center gap-2 px-4 pb-2 pt-4">
        {editLine ? (
          <button type="button" onClick={() => setEditing(null)} className="flex min-h-11 items-center gap-1 pr-2 text-[14px] font-bold text-espresso">
            <ChevronLeft size={20} strokeWidth={2.6} aria-hidden /> Tu pedido
          </button>
        ) : (
          <h1 className="flex items-center gap-2 whitespace-nowrap font-display text-[24px] font-semibold text-espresso">
            Tu pedido
            {t.count > 0 && <span className="rounded-full bg-espresso px-2.5 py-0.5 font-sans text-[13px] font-bold tabular-nums text-cream">{t.count}</span>}
          </h1>
        )}
        <span className="flex-1" />
        <button type="button" onClick={close} className="min-h-11 px-2 text-[14px] font-bold text-espresso">
          Cerrar
        </button>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
        {editLine ? (
          (() => {
            const item = items.get(editLine.productId)!
            const category = cats.get(item.category)!
            return (
              <div className="rounded-[28px] px-6 pt-5" style={{ backgroundColor: category.sheet, color: category.ink }}>
                <div className="flex items-center gap-3">
                  <img src={item.imgThumb} alt="" className="size-14 rounded-full object-cover shadow-[0_4px_10px_-4px_rgba(0,0,0,.5)]" />
                  <h2 className="font-display text-[24px] font-semibold leading-tight">{item.name}</h2>
                </div>
                <ItemOptions
                  item={item}
                  category={category}
                  initial={{ choice: editLine, qty: editLine.qty }}
                  verb="Guardar"
                  onSubmit={(choice, qty) => {
                    updateLine(editLine.key, choice, qty)
                    setEditing(null)
                  }}
                />
              </div>
            )
          })()
        ) : !lines.length ? (
          <div className="grid place-items-center pt-16 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-white/70 text-cocoa ring-1 ring-white/80">
              <ShoppingBag size={28} strokeWidth={2} aria-hidden />
            </span>
            <p className="mt-4 font-display text-xl font-semibold text-espresso">Aún no has agregado nada</p>
            <p className="mt-1 text-[14px] text-cocoa">Abre un plato y toca “Agregar”.</p>
            <button type="button" onClick={close} className="mt-6 min-h-11 rounded-full bg-espresso px-6 text-[14px] font-bold text-cream">
              Ver la carta
            </button>
          </div>
        ) : (
          <>
            {!status.open && (
              <p className="mb-3 flex items-start gap-2 rounded-2xl bg-white/70 px-4 py-3 text-[13px] font-semibold text-espresso ring-1 ring-white/80">
                <Clock size={16} strokeWidth={2.4} className="mt-px shrink-0 text-terra" aria-hidden />
                {status.label}. Puedes enviar tu pedido y te responden cuando abran.
              </p>
            )}
            <ul className="overflow-hidden rounded-[22px] bg-white/70 ring-1 ring-white/80">
              <AnimatePresence initial={false}>
                {lines.map((l) => {
                  const item = items.get(l.productId)!
                  const d = describe(item, l)
                  const details = [
                    ...d.groups.map((g) => `${g.name}: ${g.values.join(', ')}`),
                    d.toppings.length ? `Toppings: ${d.toppings.join(', ')}` : '',
                    ...d.extras.map((e) => `+ ${e.name}`),
                    ...d.without.map((w) => `Sin ${w.toLowerCase()}`),
                    d.note ? `“${d.note}”` : '',
                  ].filter(Boolean)
                  return (
                    <motion.li
                      key={l.key}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, transition: { duration: 0.22 } }}
                      className="overflow-hidden border-b border-espresso/8 last:border-0"
                    >
                      <div className="flex gap-3 px-3 pb-2 pt-3">
                        <img src={item.imgThumb} alt="" loading="lazy" className="size-12 shrink-0 rounded-full object-cover shadow-[0_4px_10px_-4px_rgba(74,36,16,.5)]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="text-[15px] font-bold leading-snug text-espresso">
                              {item.name}
                              {d.variant && <span className="font-semibold text-cocoa"> · {d.variant}</span>}
                            </p>
                            <p className="shrink-0 font-display text-[16px] font-semibold tabular-nums text-terra">{money(unitPrice(item, l) * l.qty)}</p>
                          </div>
                          {details.length > 0 && (
                            <ul className="mt-0.5 text-[13px] leading-snug text-cocoa">
                              {details.map((x) => (
                                <li key={x}>{x}</li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-1.5 flex items-center justify-between">
                            <div className="flex items-center rounded-full bg-espresso/6 ring-1 ring-espresso/10">
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.85 }}
                                transition={TAP}
                                aria-label={l.qty === 1 ? `Quitar ${item.name}` : 'Uno menos'}
                                onClick={() => setQty(l.key, l.qty - 1)}
                                className="grid size-11 place-items-center text-espresso"
                              >
                                {l.qty === 1 ? <Trash2 size={17} strokeWidth={2.4} /> : <Minus size={17} strokeWidth={2.6} />}
                              </motion.button>
                              <span className="w-6 text-center text-[15px] font-bold tabular-nums text-espresso">{l.qty}</span>
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.85 }}
                                transition={TAP}
                                aria-label="Uno más"
                                onClick={() => setQty(l.key, Math.min(99, l.qty + 1))}
                                className="grid size-11 place-items-center text-espresso"
                              >
                                <Plus size={17} strokeWidth={2.6} />
                              </motion.button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditing(l.key)}
                              className="flex min-h-11 items-center gap-1.5 px-2 text-[13px] font-bold text-espresso"
                            >
                              <Pencil size={15} strokeWidth={2.4} aria-hidden /> Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>

            <div className="flex justify-end pt-1">
              <AnimatePresence mode="popLayout" initial={false}>
                {confirmClear ? (
                  <motion.div key="ask" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                    <span className="px-1 text-[13px] font-semibold text-cocoa">¿Vaciar el pedido?</span>
                    <button
                      type="button"
                      onClick={() => {
                        clearCart()
                        setConfirmClear(false)
                      }}
                      className="min-h-11 px-3 text-[13px] font-bold text-[#B4463A]"
                    >
                      Sí, vaciar
                    </button>
                    <button type="button" onClick={() => setConfirmClear(false)} className="min-h-11 px-3 text-[13px] font-bold text-espresso">
                      No
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="clear"
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setConfirmClear(true)}
                    className="flex min-h-11 items-center gap-1.5 px-2 text-[13px] font-bold text-cocoa"
                  >
                    <Trash2 size={15} strokeWidth={2.4} aria-hidden /> Vaciar pedido
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {order.modes.length > 1 && (
              <>
                <Heading>¿Cómo lo quieres?</Heading>
                <div role="radiogroup" aria-label="Entrega" className="flex flex-wrap gap-2">
                  {order.modes.map((m) => (
                    <Choice key={m} on={mode === m} onClick={() => setForm({ mode: m })}>
                      {MODE_LABEL[m]}
                    </Choice>
                  ))}
                </div>
              </>
            )}

            <Heading>Tus datos</Heading>
            <div className="flex flex-col gap-2">
              <input className={field} value={form.name} onChange={(e) => setForm({ name: e.target.value })} placeholder="Tu nombre" aria-label="Tu nombre" autoComplete="name" />
              {mode === 'domicilio' && (
                <input
                  className={field}
                  value={form.address}
                  onChange={(e) => setForm({ address: e.target.value })}
                  placeholder="Dirección y barrio"
                  aria-label="Dirección y barrio"
                  autoComplete="street-address"
                />
              )}
              {mode === 'mesa' && (
                <input
                  className={field}
                  value={form.table}
                  onChange={(e) => setForm({ table: e.target.value })}
                  placeholder="Número de mesa"
                  aria-label="Número de mesa"
                  inputMode="numeric"
                />
              )}
            </div>

            {order.payments.length > 0 && (
              <>
                <Heading>¿Cómo pagas?</Heading>
                <div role="radiogroup" aria-label="Medio de pago" className="flex flex-wrap gap-2">
                  {order.payments.map((p) => (
                    <Choice key={p} on={form.payment === p} onClick={() => setForm({ payment: p })}>
                      {PAYMENT_LABEL[p]}
                    </Choice>
                  ))}
                </div>
                {form.payment === 'efectivo' && mode === 'domicilio' && (
                  <input
                    className={`${field} mt-2`}
                    value={form.cashFor}
                    onChange={(e) => setForm({ cashFor: e.target.value })}
                    placeholder="¿Con cuánto pagas? (para el cambio)"
                    aria-label="Con cuánto pagas"
                    inputMode="numeric"
                  />
                )}
              </>
            )}

            <Heading>Nota para el negocio</Heading>
            <textarea
              className={`${field} resize-none`}
              rows={2}
              value={form.note}
              onChange={(e) => setForm({ note: e.target.value.slice(0, 200) })}
              placeholder="Ej.: timbre dañado, llamar al llegar"
              aria-label="Nota para el negocio"
            />

            {/* Ley 1581: explicit, unticked consent with the policy one tap away */}
            <label className="mt-4 flex cursor-pointer items-start gap-3 px-1 text-[13px] leading-snug text-espresso">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setForm({ consent: e.target.checked })}
                className="mt-0.5 size-5 shrink-0 accent-[var(--color-espresso)]"
              />
              <span>
                Autorizo a {menu.business.name} a usar mis datos solo para atender este pedido, según su{' '}
                <a href={policyHref(order.dataPolicyUrl)} target="_blank" rel="noopener" className="font-bold underline">
                  política de tratamiento de datos
                </a>
                . Quedan guardados solo en este teléfono.
              </span>
            </label>
          </>
        )}
      </div>

      {/* totals and send, always in reach */}
      {!editLine && lines.length > 0 && (
        <div className="shrink-0 rounded-t-[28px] bg-white/80 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_24px_-14px_rgba(42,26,18,.4)] ring-1 ring-white">
          <dl className="space-y-0.5 px-1 text-[14px] text-cocoa">
            {t.delivery !== 0 && (
              <>
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{money(t.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Domicilio</dt>
                  <dd className="tabular-nums">{t.delivery === null ? 'Por confirmar' : money(t.delivery)}</dd>
                </div>
              </>
            )}
            <div className="flex items-baseline justify-between pt-0.5 text-espresso">
              <dt className="font-display text-[19px] font-semibold">Total</dt>
              <dd className="font-display text-[22px] font-semibold tabular-nums">{money(t.total)}</dd>
            </div>
          </dl>
          <AnimatePresence mode="popLayout" initial={false}>
            {sent ? (
              <motion.div key="sent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                <p className="px-1 text-center text-[13px] font-semibold text-cocoa">¿Ya enviaste el mensaje en WhatsApp?</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => setSent(false)} className="min-h-12 flex-1 rounded-full bg-espresso/8 text-[14px] font-bold text-espresso">
                    Aún no
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearCart()
                      setSent(false)
                      close()
                    }}
                    className="min-h-12 flex-1 rounded-full bg-espresso text-[14px] font-bold text-cream"
                  >
                    Sí, vaciar pedido
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="send" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                {stop && <p className="px-1 pb-1.5 text-center text-[13px] font-bold text-[#B4463A]">{stop}</p>}
                <motion.a
                  href={stop ? undefined : whatsappLink(order.whatsapp, orderMessage(menu, lines, filled))}
                  target="_blank"
                  rel="noopener"
                  aria-disabled={!!stop}
                  whileTap={stop ? undefined : { scale: 0.96 }}
                  transition={TAP}
                  onClick={(e) => {
                    if (stop) e.preventDefault()
                    else window.setTimeout(() => setSent(true), 600)
                  }}
                  className={`flex min-h-13 items-center justify-center gap-2 rounded-full text-[16px] font-bold text-white shadow-[0_10px_20px_-10px_rgba(18,90,50,.8)] ${
                    stop ? 'bg-[#1E7A46]/45' : 'bg-[#1E7A46]'
                  }`}
                >
                  <WhatsAppGlyph />
                  Enviar pedido por WhatsApp
                </motion.a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

/** WhatsApp's speech bubble, drawn as a plain SVG (lucide has no brand icons). */
function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3Z" />
    </svg>
  )
}
