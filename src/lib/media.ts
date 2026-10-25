/**
 * The four renditions every dish photo comes in. Shared by the app (photo() in format.ts builds the URLs)
 * and the build (vite.config.ts renders local photos), so both agree on sizes and file names.
 * `blur` is in Unsplash/imgix units; the build maps it to a Gaussian sigma.
 */
export const RENDITIONS = {
  /** the plate on stage */
  img: { size: 640, blur: 0 },
  /** heavy blur for the side plates: cross-fading is far cheaper than animating `filter: blur()` */
  imgBlur: { size: 96, blur: 30 },
  /** softer, still recognisable blur for the backdrop */
  imgBack: { size: 320, blur: 24 },
  /** search results and rails */
  imgThumb: { size: 120, blur: 0 },
} as const

export type Rendition = keyof typeof RENDITIONS

/** media/<stem>-<version>-<size>[b].webp — the version changes with the file or its crop, so caches never go stale */
export const mediaName = (file: string, version: string, r: Rendition) =>
  `${file.replace(/\.[^.]+$/, '')}-${version}-${RENDITIONS[r].size}${RENDITIONS[r].blur ? 'b' : ''}.webp`
