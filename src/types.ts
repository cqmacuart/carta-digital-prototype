import type { LucideIcon } from 'lucide-react'

export type Tag = 'casa' | 'nuevo' | 'vegano' | 'vegetariano' | 'sin-gluten' | 'picante' | 'compartir'

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
}

/** One card = one base product; sizes, flavours and add-ons are its variants. */
export type Variant = { name: string; price: number }

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
  note?: string
  tags?: Tag[]
  img: string
  imgBlur: string
  imgBack: string
}
