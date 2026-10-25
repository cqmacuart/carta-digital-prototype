import { photo } from '../lib/format'
import { ICONS } from '../lib/icons'
import type { BusinessProfile } from '../models/business'
import type { MenuDatabase } from '../models/db'
import type { Badge, Category, Menu, MenuItem, OrderConfig } from '../types'

/** WCAG relative luminance of a #RRGGBB colour */
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const bySort =<T extends { sortOrder: number }>(a: T, b: T) => a.sortOrder - b.sortOrder

/** Database rows → what the screens render (sorted, joined, icons resolved, image URLs built). */
export function toMenu(db: MenuDatabase, business: BusinessProfile): Menu {
  const categories: Category[] = [...db.categories].sort(bySort).map((c) => ({
    id: c.id,
    name: c.name,
    icon: ICONS[c.icon],
    subcategories: db.subcategories
      .filter((s) => s.categoryId === c.id)
      .sort(bySort)
      .map((s) => ({ id: s.id, name: s.name })),
    ...c.palette,
    // dark sheets read on cream as they are; light ones lend their (dark) accent instead
    strong: luminance(c.palette.sheet) < 0.2 ? c.palette.sheet : c.palette.accent,
  }))

  const catOrder = new Map(db.categories.map((c) => [c.id, c.sortOrder]))
  const subOrder = new Map(db.subcategories.map((s) => [s.id, s.sortOrder]))
  const groupName = new Map(db.groups.map((g) => [g.id, g.name]))
  const tags = new Map(db.tags.map((t) => [t.id, t]))
  const modifiers = new Map(db.modifiers.map((m) => [m.id, m]))
  const toppingPool = [...db.toppings].sort(bySort).map(({ id, name }) => ({ id, name }))
  const optionGroups = new Map((db.optionGroups ?? []).map((g) => [g.id, g]))

  const items: MenuItem[] = db.products
    .filter((p) => p.available)
    .sort(
      (a, b) =>
        catOrder.get(a.categoryId)! - catOrder.get(b.categoryId)! ||
        subOrder.get(a.subcategoryId)! - subOrder.get(b.subcategoryId)! ||
        a.sortOrder - b.sortOrder,
    )
    .map((p) => ({
      id: p.id,
      category: p.categoryId,
      sub: p.subcategoryId,
      group: p.groupId ? groupName.get(p.groupId) : undefined,
      name: p.name,
      price: p.price,
      tagline: p.tagline,
      description: p.description,
      variants: p.variants.length ? p.variants.map((v) => ({ id: v.id, name: v.name, detail: v.detail ?? undefined, price: v.price })) : undefined,
      ingredients: p.ingredients.length ? p.ingredients.map((i) => (typeof i === 'string' ? i : i.name)) : undefined,
      fixedIngredients: __PEDIDOS__ ? p.ingredients.flatMap((i) => (typeof i === 'string' ? [] : [i.name])) : undefined,
      toppings: p.includedToppings ? { count: p.includedToppings, options: toppingPool } : undefined,
      modifiers: p.modifierIds.length ? p.modifierIds.map((id) => modifiers.get(id)!).map(({ id, name, price }) => ({ id, name, price })) : undefined,
      optionGroups: p.optionGroupIds?.length ? p.optionGroupIds.map((id) => optionGroups.get(id)!) : undefined,
      note: p.note ?? undefined,
      tags: p.tagIds.length
        ? p.tagIds.map((id): Badge => {
            const t = tags.get(id)!
            return { id, label: t.label, icon: ICONS[t.icon] }
          })
        : undefined,
      ...photo(p.image),
    }))

  const branch = business.branches.find((b) => b.id === business.defaultBranchId)
  const { ordering } = business
  // the build has already checked these (number, modes, data policy) for a business that takes orders
  const order: OrderConfig | undefined =
    __PEDIDOS__ && ordering?.enabled
      ? {
          whatsapp: (ordering.whatsapp ?? branch?.whatsapp ?? business.contact.whatsapp ?? '').replace(/\D/g, ''),
          modes: ordering.modes,
          minOrder: ordering.minOrder,
          deliveryFee: ordering.deliveryFee,
          payments: business.payments,
          dataPolicyUrl: business.legal.dataPolicyUrl ?? '',
        }
      : undefined
  return {
    tenantId: business.tenantId,
    order,
    business: {
      name: business.name,
      tagline: business.tagline,
      branch: branch?.name ?? '',
      hours: branch?.hours ?? [],
      timezone: branch?.timezone ?? business.timezone,
    },
    categories,
    items,
  }
}
