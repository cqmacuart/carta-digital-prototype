import type { Focal, ProductImage } from '../models/db'
import { mediaName, RENDITIONS, type Rendition } from './media'

/** Colombian pesos: $17.000 */
export const money = (v: number) => `$${Math.round(v).toLocaleString('es-CO')}`

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Unsplash (imgix) square crop around a focal point, so each dish fills its circle. */
const unsplash = (id: string, { x, y, zoom }: Focal, w: number, blur: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${w}&fit=crop&crop=focalpoint&fp-x=${x}&fp-y=${y}&fp-z=${zoom}&auto=format&q=${blur ? 50 : 80}${blur ? `&blur=${blur}` : ''}`

/**
 * Sharp photo plus pre-blurred copies (see RENDITIONS): from Unsplash's CDN, or from media/ for the
 * business's own photos, which the build renders from themes/<slug>/assets/.
 */
export const photo = (image: ProductImage): Record<Rendition, string> => {
  const url = (r: Rendition) =>
    image.source === 'local'
      ? `${import.meta.env.BASE_URL}media/${mediaName(image.file, image.version ?? 'dev', r)}`
      : unsplash(image.photoId, image.focal, RENDITIONS[r].size, RENDITIONS[r].blur)
  return { img: url('img'), imgBlur: url('imgBlur'), imgBack: url('imgBack'), imgThumb: url('imgThumb') }
}
