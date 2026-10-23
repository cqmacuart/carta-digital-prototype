export type Tag = 'casa' | 'nuevo' | 'vegano' | 'vegetariano' | 'sin-gluten' | 'picante'

/** Every category owns a palette from the terracotta family (analogous hues, 350°–40°). */
export type Category = {
  id: string
  name: string
  /** page surface */
  bg: string
  /** dish sheet surface */
  sheet: string
  /** text on the sheet */
  ink: string
  /** price + icons on the sheet */
  accent: string
}

export type MenuItem = {
  id: string
  category: string
  name: string
  price: number
  tagline: string
  description: string
  ingredients?: string[]
  note?: string
  tags?: Tag[]
  img: string
  imgBlur: string
  imgBack: string
}
