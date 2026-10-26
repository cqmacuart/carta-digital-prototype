import type { LucideIcon } from 'lucide-react'
import type { OpeningHours, PaymentMethod, Service } from './models/business'
import type { OptionGroup, TagId } from './models/db'

// View models: what the screens render, built from the database by src/data/adapter.ts.

export type Subcategory = { id: string; name: string }

/** Every category owns a palette from the terracotta family (analogous hues, 350°–40°). */
export type Category = {
  id: string
  name: string
  icon: LucideIcon
  subcategories: Subcategory[]
  /** dish sheet surface */
  sheet: string
  /** text on the sheet */
  ink: string
  /** price + icons on the sheet */
  accent: string
  /** the palette's colour that reads on the light page (outlined chips, highlights) */
  strong: string
}

/** One card = one base product; sizes, flavours and add-ons are its variants. */
export type Variant = { id: string; name: string; detail?: string; price: number }

export type Badge = { id: TagId; label: string; icon: LucideIcon }

export type MenuItem = {
  id: string
  category: string
  sub: string
  /** third level inside a subcategory (e.g. Jugos, Cerdo); items of one group sit together */
  group?: string
  name: string
  /** base price; with variants it is the lowest one ("desde") */
  price: number
  tagline: string
  description: string
  variants?: Variant[]
  ingredients?: string[]
  /** V2: the ones that can't be taken out when ordering */
  fixedIngredients?: string[]
  /** included toppings, chosen from the shared pool */
  toppings?: { count: number; options: { id: string; name: string }[] }
  /** paid add-ons */
  modifiers?: { id: string; name: string; price: number }[]
  /** V2: choices made when ordering (min/max) */
  optionGroups?: OptionGroup[]
  note?: string
  tags?: Badge[]
  img: string
  imgBlur: string
  imgBack: string
  /** small sharp copy for lists (search results) */
  imgThumb: string
}

export type Business = {
  name: string
  tagline: string
  branch: string
  /** to tell whether it is open right now */
  hours: OpeningHours[]
  timezone: string
}

/** V2: what the cart needs to take an order; only present when the business takes orders */
export type OrderConfig = {
  /** E.164 without the "+", as wa.me wants it */
  whatsapp: string
  modes: Service[]
  minOrder: number | null
  deliveryFee: number | null
  payments: PaymentMethod[]
  dataPolicyUrl: string
}

export type Menu = {
  /** the cart is stored per business */
  tenantId: string
  business: Business
  order?: OrderConfig
  categories: Category[]
  /** sorted by category, subcategory, then product order */
  items: MenuItem[]
}
