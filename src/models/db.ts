import type { TenantId } from './business.ts'

/**
 * Persistence models: the menu as a database would store it.
 * Normalised like tables (one entity per array, relations by id, explicit sort order),
 * so themes/<slug>/menu.json can later be swapped for an API or a real database.
 */

export type ID = string

/** Icons are stored as keys; the UI maps them to components. */
export type IconKey =
  | 'egg-fried'
  | 'egg'
  | 'sandwich'
  | 'hamburger'
  | 'pizza'
  | 'beef'
  | 'ham'
  | 'drumstick'
  | 'fish'
  | 'shrimp'
  | 'cylinder'
  | 'salad'
  | 'leafy-green'
  | 'soup'
  | 'cooking-pot'
  | 'popcorn'
  | 'utensils'
  | 'utensils-crossed'
  | 'chef-hat'
  | 'hand-platter'
  | 'croissant'
  | 'wheat'
  | 'cookie'
  | 'donut'
  | 'cake'
  | 'cake-slice'
  | 'dessert'
  | 'candy'
  | 'ice-cream-bowl'
  | 'ice-cream-cone'
  | 'popsicle'
  | 'apple'
  | 'banana'
  | 'cherry'
  | 'grape'
  | 'citrus'
  | 'carrot'
  | 'nut'
  | 'bean'
  | 'coffee'
  | 'cup-soda'
  | 'glass-water'
  | 'milk'
  | 'beer'
  | 'wine'
  | 'martini'
  | 'leaf'
  | 'vegan'
  | 'sprout'
  | 'wheat-off'
  | 'milk-off'
  | 'flame'
  | 'snowflake'
  | 'star'
  | 'sparkles'
  | 'crown'
  | 'award'
  | 'users'
  | 'gift'
  | 'heart'
  | 'flower'
  | 'flower-2'
  | 'party-popper'
  | 'baby'
  | 'gem'
  | 'spray-can'
  | 'shopping-bag'
  | 'package'
  | 'truck'
  | 'store'
  | 'clock'

export type TagId = 'casa' | 'nuevo' | 'vegano' | 'vegetariano' | 'sin-gluten' | 'picante' | 'compartir' | 'crudo' | 'tempura'

/** The menu (themes/<slug>/menu.json). Who sells it lives in business.json (models/business.ts). */
export interface MenuDatabase {
  /** 3 adds the optional `optionGroups` and fixed ingredients (V2); a 2 file is still valid */
  schemaVersion: 2 | 3
  /** must match business.json and theme.json; the build checks it */
  tenantId: TenantId
  /** ISO date of the last export */
  updatedAt: string
  categories: Category[]
  subcategories: Subcategory[]
  groups: Group[]
  tags: Tag[]
  toppings: Topping[]
  modifiers: Modifier[]
  /** V2: choices with a minimum and maximum (half-and-half, "pick 2 sauces", the combo's drink); V1 ignores them */
  optionGroups?: OptionGroup[]
  products: Product[]
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

/** A choice made when ordering: `min` 0 = optional, `max` 1 = pick one. */
export interface OptionGroup {
  id: ID
  name: string
  min: number
  max: number
  options: OptionChoice[]
}

export interface OptionChoice {
  id: ID
  name: string
  /** added to the product's price (0 = included) */
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
  /** a plain name can be left out when ordering; `{ name, removable: false }` always goes (the eggs of scrambled eggs) */
  ingredients: Ingredient[]
  /** how many toppings from the shared pool come included */
  includedToppings: number
  modifierIds: ID[]
  /** V2: option groups the customer fills in when ordering, in this order */
  optionGroupIds?: ID[]
  tagIds: TagId[]
  note: string | null
  image: ProductImage
  available: boolean
  sortOrder: number
}

/** Schema 3: an object marks an ingredient the customer can't take out. */
export type Ingredient = string | { name: string; removable: false }

/** One card = one base product; sizes, flavours and versions are variants. */
export interface Variant {
  id: ID
  name: string
  detail: string | null
  price: number
}

/** focal-point crop so the dish fills its circle: centre (0–1) and zoom (1 = whole short side) */
export interface Focal {
  x: number
  y: number
  zoom: number
}

export type ProductImage = UnsplashImage | LocalImage

/** Reference photo from Unsplash, cropped and blurred by its CDN */
export interface UnsplashImage {
  source: 'unsplash'
  photoId: string
  focal: Focal
  alt: string
}

/** The business's own photo in themes/<slug>/assets/; the build renders its sizes into media/ */
export interface LocalImage {
  source: 'local'
  /** file name inside themes/<slug>/assets/ */
  file: string
  focal: Focal
  alt: string
  /** set by the build (hash of the file and its crop); part of the rendered file names */
  version?: string
}
