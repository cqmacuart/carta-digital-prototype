/**
 * Persistence models: the menu as a database would store it.
 * Normalised like tables (one entity per array, relations by id, explicit sort order),
 * so `public/data/*.json` can later be swapped for an API or a real database.
 */

export type ID = string

/** Icons are stored as keys; the UI maps them to components. */
export type IconKey =
  | 'egg-fried'
  | 'sandwich'
  | 'croissant'
  | 'ice-cream-bowl'
  | 'cake-slice'
  | 'coffee'
  | 'shopping-bag'
  | 'star'
  | 'sparkles'
  | 'leaf'
  | 'sprout'
  | 'wheat-off'
  | 'flame'
  | 'users'

export type TagId = 'casa' | 'nuevo' | 'vegano' | 'vegetariano' | 'sin-gluten' | 'picante' | 'compartir'

export interface MenuDatabase {
  schemaVersion: 1
  /** ISO date of the last export */
  updatedAt: string
  business: Business
  categories: Category[]
  subcategories: Subcategory[]
  groups: Group[]
  tags: Tag[]
  toppings: Topping[]
  modifiers: Modifier[]
  products: Product[]
}

export interface Business {
  id: ID
  name: string
  tagline: string
  currency: 'COP'
  locale: 'es-CO'
  /** the branch this menu is served at */
  branchId: ID
  branches: Branch[]
  contact: {
    deliveryPhone: string | null
    instagram: string | null
  }
}

export interface Branch {
  id: ID
  name: string
  address: string
  city: string
  /** IANA zone the hours are written in */
  timezone: string
  /** one row per opening span; a day without rows is closed */
  hours: OpeningHours[]
}

export interface OpeningHours {
  /** 0 = domingo … 6 = sábado */
  day: number
  /** 24h "HH:MM"; `close` may be after midnight ("01:00") */
  open: string
  close: string
}

/** Level 1 — the rail */
export interface Category {
  id: ID
  name: string
  icon: IconKey
  sortOrder: number
  /** sheet surface, text on it, price/icons on it; pairs are ≥4.5:1 */
  palette: { sheet: string; ink: string; accent: string }
}

/** Level 2 — the chips */
export interface Subcategory {
  id: ID
  categoryId: ID
  name: string
  sortOrder: number
}

/** Level 3 — the tags under the chips */
export interface Group {
  id: ID
  subcategoryId: ID
  name: string
  sortOrder: number
}

/** Badges shown on a product (dietary, house special…) */
export interface Tag {
  id: TagId
  label: string
  icon: IconKey
}

/** Shared pool a product draws its included toppings from */
export interface Topping {
  id: ID
  name: string
  sortOrder: number
}

/** Paid add-on that can apply to several products (e.g. almond milk) */
export interface Modifier {
  id: ID
  name: string
  price: number
}

export interface Product {
  id: ID
  categoryId: ID
  subcategoryId: ID
  groupId: ID | null
  name: string
  /** one line for the collapsed sheet (≤2 lines on a 360px screen) */
  tagline: string
  description: string
  /** base price; with variants, the lowest one ("desde") */
  price: number
  variants: Variant[]
  ingredients: string[]
  /** how many toppings from the shared pool come included */
  includedToppings: number
  modifierIds: ID[]
  tagIds: TagId[]
  note: string | null
  image: ProductImage
  available: boolean
  sortOrder: number
}

/** One card = one base product; sizes, flavours and versions are variants. */
export interface Variant {
  id: ID
  name: string
  detail: string | null
  price: number
}

export interface ProductImage {
  source: 'unsplash'
  photoId: string
  /** focal-point crop so the dish fills its circle */
  focal: { x: number; y: number; zoom: number }
  alt: string
}
