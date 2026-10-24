/** Colombian pesos: $17.000 */
export const money = (v: number) => `$${Math.round(v).toLocaleString('es-CO')}`

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

type Crop = [id: string, x?: number, y?: number, z?: number]

/** Unsplash (imgix) square crop around a focal point, so each dish fills its circle. */
export const unsplash = ([id, x = 0.5, y = 0.5, z = 1]: Crop, w = 640, blur = 0) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${w}&fit=crop&crop=focalpoint&fp-x=${x}&fp-y=${y}&fp-z=${z}&auto=format&q=${blur ? 50 : 80}${blur ? `&blur=${blur}` : ''}`

/**
 * Sharp photo plus pre-blurred copies from the CDN: a tiny heavy one for side plates (cross-fading
 * is far cheaper than animating `filter: blur()`) and a softer, still recognisable one for the backdrop.
 */
export const photo = (crop: Crop) => ({
  img: unsplash(crop),
  imgBlur: unsplash(crop, 96, 30),
  imgBack: unsplash(crop, 320, 24),
})
