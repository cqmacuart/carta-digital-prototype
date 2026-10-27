import type { ImageShape } from '../models/business'

/** business.json → `imageShape`, injected by vite.config.ts: how every product photo is framed. */
export const SHAPE: ImageShape = __IMAGE_SHAPE__

/** Cutouts are transparent PNGs: nothing is cropped or framed, the product sits whole inside its square. */
export const CUTOUT = SHAPE === 'cutout'

/** Corners of a product photo's frame (and of the box shadow that follows it). */
export const rounding = SHAPE === 'circle' ? 'rounded-full' : SHAPE === 'rounded' ? 'rounded-[22%]' : ''

/** Rounding + fit for a product photo <img> (thumbnails, the photo that flies to the bag). */
export const photoClass = `${rounding} ${CUTOUT ? 'object-contain' : 'object-cover'}`

/** Small shadow for thumbnails: a box shadow around a frame, or one that follows the outline of a cutout. */
export const thumbShadow = CUTOUT ? 'drop-shadow-[0_4px_4px_rgba(42,26,18,.35)]' : 'shadow-[0_4px_10px_-4px_rgba(74,36,16,.5)]'
