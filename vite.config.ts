import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { defineConfig, type Plugin } from 'vite'
import { mediaName, RENDITIONS, type Rendition } from './src/lib/media.ts'
import type { BusinessKind, BusinessProfile, TenantId } from './src/models/business.ts'
import type { LocalImage, MenuDatabase } from './src/models/db.ts'

const root = fileURLToPath(new URL('.', import.meta.url))
const themesDir = resolve(root, 'themes')

/** Which business this build is for; its data lives in themes/<slug>/. Set by scripts/carta.mjs. */
const client = process.env.CARTA_CLIENT || 'demo'
const cartaDir = resolve(themesDir, client)
/** the business's own photos (`image.source: "local"`) */
const assetsDir = resolve(cartaDir, 'assets')
/** rendered photos persist between runs; names carry the version, so a new file or crop renders again */
const cacheDir = resolve(root, 'node_modules/.carta-media', client)

/** themes/<slug>/theme.json: what changes per business besides the menu itself. */
interface Theme {
  tenantId: TenantId
  title: string
  themeColor: string
  /** "Propuesta de diseño para X": shows the banner and adds noindex; null once the client has paid */
  proposal: string | null
  fontsHref: string
  fonts: { display: string; sans: string }
  /** overrides the `--color-*` tokens of the `@theme` block in src/index.css */
  colors: Record<string, string>
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function readCarta() {
  if (!existsSync(resolve(cartaDir, 'menu.json'))) {
    const available = readdirSync(themesDir).filter((d) => existsSync(resolve(themesDir, d, 'menu.json')))
    throw new Error(`No hay carta para "${client}" (falta themes/${client}/menu.json). Cartas: ${available.join(', ')}`)
  }
  const read = <T,>(file: string) => {
    if (!existsSync(resolve(cartaDir, file))) throw new Error(`Falta themes/${client}/${file}`)
    return JSON.parse(readFileSync(resolve(cartaDir, file), 'utf8')) as T
  }
  const business = read<BusinessProfile>('business.json')
  const db = read<MenuDatabase>('menu.json')
  const theme = read<Theme>('theme.json')

  // the three files must describe the same business: a carta never ships with another tenant's menu or look
  if (!UUID.test(business.tenantId ?? '')) throw new Error(`themes/${client}/business.json: tenantId debe ser un UUID`)
  for (const [file, data] of [['menu.json', db], ['theme.json', theme]] as const) {
    if (data.tenantId !== business.tenantId) throw new Error(`themes/${client}/${file}: tenantId no coincide con business.json`)
  }
  if (!business.branches.some((b) => b.id === business.defaultBranchId)) {
    throw new Error(`themes/${client}/business.json: defaultBranchId "${business.defaultBranchId}" no es una sede`)
  }

  // stamp each local photo with a version and list the files the app will ask for under media/
  const photos = new Map<string, { image: LocalImage; rendition: Rendition }>()
  for (const p of db.products) {
    if (p.image.source !== 'local') continue
    const image = p.image
    const file = resolve(assetsDir, image.file)
    if (!existsSync(file)) throw new Error(`Falta la foto de "${p.name}": themes/${client}/assets/${image.file}`)
    const { size, mtimeMs } = statSync(file)
    const { x, y, zoom } = image.focal
    image.version = createHash('sha1').update(`${image.file}|${size}|${mtimeMs}|${x}|${y}|${zoom}`).digest('hex').slice(0, 8)
    for (const r of Object.keys(RENDITIONS) as Rendition[]) photos.set(mediaName(image.file, image.version, r), { image, rendition: r })
  }
  return { menu: JSON.stringify(db), business, theme, photos }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const SCHEMA_TYPE: Record<BusinessKind, string> = {
  cafeteria: 'CafeOrCoffeeShop',
  panaderia: 'Bakery',
  restaurante: 'Restaurant',
  'sushi-bar': 'Restaurant',
  'comidas-rapidas': 'FastFoodRestaurant',
  pizzeria: 'Restaurant',
  heladeria: 'IceCreamShop',
  bar: 'BarOrPub',
  catalogo: 'Store',
}
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Schema.org LocalBusiness for the branch the carta shows: what Google reads for local search. */
function jsonLd(b: BusinessProfile) {
  const branch = b.branches.find((x) => x.id === b.defaultBranchId)!
  const prune = (o: object): object =>
    Object.fromEntries(
      Object.entries(o)
        .filter(([, v]) => v != null && !(Array.isArray(v) && !v.length))
        .map(([k, v]) => [k, v && typeof v === 'object' && !Array.isArray(v) ? prune(v) : v]),
    )
  const { taxId } = b.legal
  return prune({
    '@context': 'https://schema.org',
    '@type': SCHEMA_TYPE[b.kind] ?? 'LocalBusiness',
    name: b.name,
    slogan: b.tagline,
    legalName: b.legal.name,
    taxID: taxId && (taxId.dv ? `${taxId.number}-${taxId.dv}` : taxId.number),
    telephone: branch.phone ?? b.contact.phone,
    email: b.contact.email,
    url: b.contact.website,
    sameAs: [
      b.social.instagram && `https://www.instagram.com/${b.social.instagram}/`,
      b.social.facebook && `https://www.facebook.com/${b.social.facebook}`,
      b.social.tiktok && `https://www.tiktok.com/@${b.social.tiktok}`,
    ].filter(Boolean),
    address: {
      '@type': 'PostalAddress',
      streetAddress: branch.address,
      addressLocality: branch.city,
      addressRegion: branch.region,
      addressCountry: branch.country,
    },
    geo: branch.geo && { '@type': 'GeoCoordinates', latitude: branch.geo.lat, longitude: branch.geo.lng },
    hasMap: branch.mapsUrl,
    openingHoursSpecification: branch.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${WEEKDAYS[h.day]}`,
      opens: h.open,
      closes: h.close,
    })),
    currenciesAccepted: b.currency,
    paymentAccepted: b.payments.length ? b.payments.join(', ') : null,
  })
}

/** One rendition of a local photo: square crop around the focal point (like imgix's crop=focalpoint), resized, optionally blurred, as WebP. */
async function renderPhoto(image: LocalImage, r: Rendition) {
  const cached = resolve(cacheDir, mediaName(image.file, image.version!, r))
  if (existsSync(cached)) return readFileSync(cached)

  // rotate() applies the EXIF orientation first, so phone photos come out upright and the focal point means what it shows
  const { data, info } = await sharp(resolve(assetsDir, image.file)).rotate().toBuffer({ resolveWithObject: true })
  const side = Math.round(Math.min(info.width, info.height) / Math.max(1, image.focal.zoom))
  const at = (centre: number, full: number) => Math.min(full - side, Math.max(0, Math.round(centre * full - side / 2)))
  const { size, blur } = RENDITIONS[r]
  let out = sharp(data)
    .extract({ left: at(image.focal.x, info.width), top: at(image.focal.y, info.height), width: side, height: side })
    .resize(size, size)
  // imgix blur units → Gaussian sigma, scaled to the output so both blurred sizes read like the CDN's
  if (blur) out = out.blur((size * blur) / 1000)
  const buf = await out.webp({ quality: blur ? 50 : 80 }).toBuffer()

  mkdirSync(cacheDir, { recursive: true })
  writeFileSync(cached, buf)
  return buf
}

/** Head tags for the business: title, fonts, color tokens, Schema.org data and, for proposals, noindex. */
function head(theme: Theme, business: BusinessProfile) {
  const vars = [
    `--font-display: ${theme.fonts.display}`,
    `--font-sans: ${theme.fonts.sans}`,
    ...Object.entries(theme.colors).map(([k, v]) => `--color-${k}: ${v}`),
  ].join('; ')
  return [
    `<title>${esc(theme.title)}</title>`,
    `<meta name="theme-color" content="${esc(theme.themeColor)}" />`,
    theme.proposal && `<meta name="robots" content="noindex, nofollow" />`,
    `<link rel="preconnect" href="https://fonts.googleapis.com" />`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`,
    `<link rel="stylesheet" href="${esc(theme.fontsHref)}" />`,
    // unlayered, so it wins over Tailwind's @layer theme
    `<style>:root { ${vars} }</style>`,
    // < escaped so the JSON can never close the script tag
    `<script type="application/ld+json">${JSON.stringify(jsonLd(business)).replace(/</g, '\\u003c')}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ')
}

/** Small dismissible note so nobody mistakes a demo for the official menu. */
const proposalBanner = (text: string) => `<div class="proposal" role="note">
      <span>${esc(text)}</span>
      <button type="button" aria-label="Ocultar aviso" onclick="this.parentElement.remove()">×</button>
    </div>`

/** Serves (dev) or emits (build) the client's business.json, menu.json and photos, and themes index.html. */
function cartaClient(): Plugin {
  return {
    name: 'carta-client',
    configureServer(server) {
      server.watcher.add(cartaDir)
      server.watcher.on('change', (file) => {
        if (resolve(file).startsWith(cartaDir)) server.ws.send({ type: 'full-reload' })
      })
      server.middlewares.use('/data/menu.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(readCarta().menu)
      })
      server.middlewares.use('/data/business.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(readCarta().business))
      })
      server.middlewares.use('/media', (req, res, next) => {
        const hit = readCarta().photos.get(decodeURIComponent((req.url ?? '').slice(1).split('?')[0]))
        if (!hit) return next()
        renderPhoto(hit.image, hit.rendition)
          .then((buf) => {
            res.setHeader('Content-Type', 'image/webp')
            res.end(buf)
          })
          .catch(next)
      })
    },
    transformIndexHtml(html) {
      const { theme, business } = readCarta()
      return html
        .replace('<!-- carta:head -->', head(theme, business))
        .replace('<!-- carta:body -->', theme.proposal ? proposalBanner(theme.proposal) : '')
    },
    async generateBundle() {
      const { menu, business, photos } = readCarta()
      this.emitFile({ type: 'asset', fileName: 'data/menu.json', source: menu })
      this.emitFile({ type: 'asset', fileName: 'data/business.json', source: JSON.stringify(business) })
      const rendered = await Promise.all([...photos].map(async ([name, { image, rendition }]) => [name, await renderPhoto(image, rendition)] as const))
      for (const [name, source] of rendered) this.emitFile({ type: 'asset', fileName: `media/${name}`, source })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // relative, so the same build works from a subfolder (GitHub Pages, Hostinger) or a domain root
  base: './',
  plugins: [react(), tailwindcss(), cartaClient()],
  define: {
    'import.meta.env.VITE_CARTA_NAME': JSON.stringify(readCarta().business.name),
  },
  build: {
    outDir: `dist/${client}`,
    emptyOutDir: true,
  },
})
