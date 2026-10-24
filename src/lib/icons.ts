import { CakeSlice, Coffee, Croissant, EggFried, Flame, IceCreamBowl, Leaf, Sandwich, ShoppingBag, Sparkles, Sprout, Star, Users, WheatOff, type LucideIcon } from 'lucide-react'
import type { IconKey } from '../models/db'

/** The database stores icon keys; the UI renders these components. */
export const ICONS: Record<IconKey, LucideIcon> = {
  'egg-fried': EggFried,
  sandwich: Sandwich,
  croissant: Croissant,
  'ice-cream-bowl': IceCreamBowl,
  'cake-slice': CakeSlice,
  coffee: Coffee,
  'shopping-bag': ShoppingBag,
  star: Star,
  sparkles: Sparkles,
  leaf: Leaf,
  sprout: Sprout,
  'wheat-off': WheatOff,
  flame: Flame,
  users: Users,
}
