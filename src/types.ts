import type { LucideIcon } from 'lucide-react'
import type { OpeningHours } from './models/business'
import type { TagId } from './models/db'

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
export type Variant = { name: string; detail?: string; price: number }

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
  /** included toppings, chosen from the shared pool */
  toppings?: { count: number; options: string[] }
  /** paid add-ons */
  modifiers?: { name: string; price: number }[]
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

export type Menu = {
  business: Business
  categories: Category[]
  /** sorted by category, subcategory, then product order */
  items: MenuItem[]
}
