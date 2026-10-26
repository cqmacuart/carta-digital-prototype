import { useSyncExternalStore } from 'react'
import type { PaymentMethod, Service } from '../models/business'
import type { Menu, MenuItem } from '../types'

/** What the customer picked for one dish. Ids only: prices always come from the current menu, never from storage. */
export type Choice = {
  variantId: string | null
  /** option group id → chosen option ids */
  options: Record<string, string[]>
  toppingIds: string[]
  modifierIds: string[]
  /** ingredients taken out ("sin cebolla") */
  without: string[]
  note: string
}

export type Line = Choice & { key: string; productId: string; qty: number }

/** Checkout details; kept on this phone only, so the next order is quicker. */
export type Form = {
  mode: Service | null
  name: string
  address: string
  table: string
  payment: PaymentMethod | null
  /** cash on delivery: what the customer pays with, for the change (digits only) */
  cashFor: string
  note: string
  consent: boolean
}

/** A dish's photo flying from the add button to the bag; it lands, the bag hops. */
export type Flight = { id: number; from: Point; to: Point; img: string }
type Point = { x: number; y: number }

type State = {
  lines: Line[]
  form: Form
  open: boolean
  /** bumps whenever something lands in the bag, so it can hop */
  added: number
  flights: Flight[]
}

const EMPTY_FORM: Form = { mode: null, name: '', address: '', table: '', payment: null, cashFor: '', note: '', consent: false }
/** a cart left this long is stale (yesterday's order): its lines go, the customer's details stay */
const CART_TTL = 12 * 60 * 60 * 1000

let state: State = { lines: [], form: EMPTY_FORM, open: false, added: 0, flights: [] }
let storageKey: string | null = null
const listeners = new Set<() => void>()

function set(next: Partial<State>, persist = true) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
  if (!persist || !storageKey) return
  try {
    localStorage.setItem(storageKey, JSON.stringify({ v: 1, savedAt: Date.now(), lines: state.lines, form: state.form }))
  } catch {
    // private mode or full storage: the cart still works for this visit
  }
}

export function useCart() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

/** Restores this business's cart (once), dropping lines whose dish or options left the menu. */
export function loadCart(menu: Menu) {
  const key = `carta-pedido:${menu.tenantId}`
  if (storageKey === key) return
  storageKey = key
  // back from the data policy page: the cart opens where the customer left it
  try {
    if (sessionStorage.getItem(REOPEN)) state = { ...state, open: true }
    sessionStorage.removeItem(REOPEN)
  } catch {
    // no session storage: the carta just opens as usual
  }
  let saved: { v: number; savedAt: number; lines: Line[]; form: Form } | null = null
  try {
    saved = JSON.parse(localStorage.getItem(key) ?? 'null')
  } catch {
    saved = null
  }
  if (saved?.v !== 1) return
  const items = new Map(menu.items.map((m) => [m.id, m]))
  const fresh = Date.now() - saved.savedAt < CART_TTL
  const lines = fresh ? saved.lines.filter((l) => { const item = items.get(l.productId); return item && isValid(item, l) }) : []
  const form = { ...EMPTY_FORM, ...saved.form }
  if (form.mode && !menu.order?.modes.includes(form.mode)) form.mode = null
  if (form.payment && !menu.order?.payments.includes(form.payment)) form.payment = null
  state = { ...state, lines, form }
}

let seq = 0
const newKey = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`

const sameChoice = (a: Choice, b: Choice) => {
  const norm = (c: Choice) =>
    JSON.stringify([
      c.variantId,
      Object.keys(c.options).sort().map((k) => [k, [...c.options[k]].sort()]).filter(([, v]) => v.length),
      [...c.toppingIds].sort(),
      [...c.modifierIds].sort(),
      [...c.without].sort(),
      c.note.trim(),
    ])
  return norm(a) === norm(b)
}

/** Adds a dish; the same dish with the same choices just raises its quantity. */
export function addLine(productId: string, choice: Choice, qty: number) {
  const twin = state.lines.find((l) => l.productId === productId && sameChoice(l, choice))
  const lines = twin
    ? state.lines.map((l) => (l === twin ? { ...l, qty: l.qty + qty } : l))
    : [...state.lines, { ...choice, key: newKey(), productId, qty }]
  set({ lines })
}

let flightSeq = 0
/** the bag button; flights are drawn in the carta's frame, which is where the bag floats */
let bag: HTMLElement | null = null
export const setFlightSpace = (el: HTMLElement | null) => {
  bag = el
}

/** Sends the dish's photo from `from` (the add button, in viewport pixels) to the bag. */
export function flyToCart(from: DOMRect, img: string) {
  const frame = bag?.parentElement?.offsetParent
  if (!bag || !frame) return set({ added: state.added + 1 }, false)
  const origin = frame.getBoundingClientRect()
  const to = bag.getBoundingClientRect()
  const centre = (r: DOMRect): Point => ({ x: r.left + r.width / 2 - origin.left, y: r.top + r.height / 2 - origin.top })
  set({ flights: [...state.flights, { id: ++flightSeq, from: centre(from), to: centre(to), img }] }, false)
}
export const land = (id: number) => set({ flights: state.flights.filter((f) => f.id !== id), added: state.added + 1 }, false)

export const updateLine = (key: string, choice: Choice, qty: number) =>
  set({ lines: state.lines.map((l) => (l.key === key ? { ...l, ...choice, qty } : l)) })

export const setQty = (key: string, qty: number) =>
  set({ lines: qty <= 0 ? state.lines.filter((l) => l.key !== key) : state.lines.map((l) => (l.key === key ? { ...l, qty } : l)) })

export const removeLine = (key: string) => set({ lines: state.lines.filter((l) => l.key !== key) })
export const clearCart = () => set({ lines: [] })
export const setForm = (patch: Partial<Form>) => set({ form: { ...state.form, ...patch } })
export function setCartOpen(open: boolean) {
  if (!open) leavingForPolicy(false)
  set({ open }, false)
}

const REOPEN = 'carta-pedido:reabrir'
/** The data policy opens in this same tab; on the way back the cart reopens. */
export function leavingForPolicy(leaving = true) {
  try {
    if (leaving) sessionStorage.setItem(REOPEN, '1')
    else sessionStorage.removeItem(REOPEN)
  } catch {
    // no session storage: the customer reopens the bag by hand
  }
}

/** The cash amount as a number (older carts stored it formatted, "$100.000"); null = not given. */
export const cashAmount = (f: Form) => Number(f.cashFor.replace(/\D/g, '')) || null

// ---- pricing and rules ------------------------------------------------------

/** Nothing comes picked unless there is nothing to pick (a lone variant): the customer chooses on purpose. */
export const defaultChoice = (item: MenuItem): Choice => ({
  variantId: item.variants?.length === 1 ? item.variants[0].id : null,
  options: {},
  toppingIds: [],
  modifierIds: [],
  without: [],
  note: '',
})

export function unitPrice(item: MenuItem, c: Choice) {
  const base = item.variants?.find((v) => v.id === c.variantId)?.price ?? item.price
  const extras = (item.modifiers ?? []).filter((m) => c.modifierIds.includes(m.id)).reduce((s, m) => s + m.price, 0)
  const options = (item.optionGroups ?? [])
    .flatMap((g) => g.options.filter((o) => c.options[g.id]?.includes(o.id)))
    .reduce((s, o) => s + o.price, 0)
  return base + extras + options
}

/** What still has to be picked before the dish can go in the cart (null = ready). */
export function missing(item: MenuItem, c: Choice): string | null {
  if (item.variants && !item.variants.some((v) => v.id === c.variantId)) return 'una opción'
  for (const g of item.optionGroups ?? []) if ((c.options[g.id]?.length ?? 0) < g.min) return g.name.toLowerCase()
  return null
}

/** A stored line still matches the menu: every id it holds exists and the limits hold. */
function isValid(item: MenuItem, l: Line) {
  if (l.qty < 1 || missing(item, l)) return false
  if (l.variantId && !item.variants?.some((v) => v.id === l.variantId)) return false
  const groups = new Map((item.optionGroups ?? []).map((g) => [g.id, g]))
  for (const [gid, ids] of Object.entries(l.options)) {
    const g = groups.get(gid)
    if (!g || ids.length > g.max || ids.some((id) => !g.options.some((o) => o.id === id))) return false
  }
  if (l.toppingIds.length > (item.toppings?.count ?? 0) || l.toppingIds.some((id) => !item.toppings?.options.some((t) => t.id === id))) return false
  if (l.modifierIds.some((id) => !item.modifiers?.some((m) => m.id === id))) return false
  return l.without.every((w) => item.ingredients?.includes(w) && !item.fixedIngredients?.includes(w))
}

/** A line in words, for the cart and for the WhatsApp message. */
export function describe(item: MenuItem, c: Choice) {
  const variant = item.variants?.find((v) => v.id === c.variantId)
  return {
    // a lone variant is just the dish
    variant: item.variants && item.variants.length > 1 ? variant?.name : undefined,
    groups: (item.optionGroups ?? [])
      .map((g) => ({ name: g.name, values: g.options.filter((o) => c.options[g.id]?.includes(o.id)).map((o) => o.name) }))
      .filter((g) => g.values.length),
    toppings: (item.toppings?.options ?? []).filter((t) => c.toppingIds.includes(t.id)).map((t) => t.name),
    extras: (item.modifiers ?? []).filter((m) => c.modifierIds.includes(m.id)),
    without: c.without,
    note: c.note.trim(),
  }
}

export type Totals = { subtotal: number; delivery: number | null; total: number; count: number }

export function totals(menu: Menu, lines: Line[], mode: Service | null): Totals {
  const items = new Map(menu.items.map((m) => [m.id, m]))
  const subtotal = lines.reduce((s, l) => s + unitPrice(items.get(l.productId)!, l) * l.qty, 0)
  const delivery = mode === 'domicilio' ? (menu.order?.deliveryFee ?? null) : 0
  return { subtotal, delivery, total: subtotal + (delivery ?? 0), count: lines.reduce((s, l) => s + l.qty, 0) }
}
