import { money } from '../lib/format'
import { cap, L } from '../lib/labels'
import type { PaymentMethod, Service } from '../models/business'
import type { Menu } from '../types'
import { cashAmount, describe, totals, unitPrice, type Form, type Line } from './cart'

export const MODE_LABEL: Record<Service, string> = {
  domicilio: 'Domicilio',
  'para-llevar': 'Para recoger',
  mesa: 'En la mesa',
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  transferencia: 'Transferencia',
  'bre-b': 'Bre-B',
}

/**
 * The order as the business reads it in WhatsApp: one block per dish with its choices indented under it,
 * then the totals and who / where / how to pay. *bold* is WhatsApp's own markup.
 */
export function orderMessage(menu: Menu, lines: Line[], form: Form) {
  const items = new Map(menu.items.map((m) => [m.id, m]))
  const t = totals(menu, lines, form.mode)
  const out: string[] = [`*Pedido · ${menu.business.name}*`]
  if (form.mode) out.push(MODE_LABEL[form.mode] + (form.mode === 'mesa' && form.table.trim() ? ` ${form.table.trim()}` : ''))
  out.push('')

  for (const [i, l] of lines.entries()) {
    const item = items.get(l.productId)!
    const d = describe(item, l)
    if (i) out.push('')
    out.push(`*${l.qty}× ${item.name}${d.variant ? ` (${d.variant})` : ''}* — ${money(unitPrice(item, l) * l.qty)}`)
    for (const g of d.groups) out.push(`   ${g.name}: ${g.values.join(', ')}`)
    if (d.toppings.length) out.push(`   ${cap(L.topping[1])}: ${d.toppings.join(', ')}`)
    for (const e of d.extras) out.push(`   + ${e.name}`)
    for (const w of d.without) out.push(`   Sin ${w.toLowerCase()}`)
    if (d.note) out.push(`   Nota: ${d.note}`)
  }

  out.push('')
  if (t.delivery !== 0) {
    out.push(`Subtotal: ${money(t.subtotal)}`)
    out.push(`Domicilio: ${t.delivery === null ? 'por confirmar' : money(t.delivery)}`)
  }
  out.push(`*Total: ${money(t.total)}*${t.delivery === null ? ' + domicilio' : ''}`)
  out.push('')

  out.push(`Nombre: ${form.name.trim()}`)
  if (form.mode === 'domicilio') out.push(`Dirección: ${form.address.trim()}`)
  if (form.payment) out.push(`Pago: ${PAYMENT_LABEL[form.payment]}`)
  const cash = form.payment === 'efectivo' && form.mode === 'domicilio' ? cashAmount(form) : null
  if (cash) {
    out.push(`Paga con: ${money(cash)}`)
    // with the delivery still to confirm, the change isn't known yet
    if (t.delivery !== null && cash > t.total) out.push(`Cambio: ${money(cash - t.total)}`)
  }
  if (form.note.trim()) out.push(`Nota: ${form.note.trim()}`)
  return out.join('\n')
}

export const whatsappLink = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`
