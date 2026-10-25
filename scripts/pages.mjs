// Builds the public demos site for GitHub Pages into _site/: every themes/demo*/ carta in its own folder,
// plus a cover page linking them. Only demo* themes ever go here, so a real client's carta can't be
// published by accident even if it exists locally.
//
//   node scripts/pages.mjs        (or: npm run pages)
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const themesDir = resolve(root, 'themes')
const site = resolve(root, '_site')

const demos = readdirSync(themesDir)
  .filter((d) => d.startsWith('demo') && existsSync(resolve(themesDir, d, 'menu.json')))
  .sort()

process.chdir(root)
const vite = await import('vite')
rmSync(site, { recursive: true, force: true })
mkdirSync(site)

const cards = []
for (const slug of demos) {
  process.env.CARTA_CLIENT = slug
  console.log(`\n▸ ${slug}`)
  await vite.build({ root, logLevel: 'warn' })
  cpSync(resolve(root, 'dist', slug), resolve(site, slug), { recursive: true })

  const menu = JSON.parse(readFileSync(resolve(themesDir, slug, 'menu.json'), 'utf8'))
  const theme = JSON.parse(readFileSync(resolve(themesDir, slug, 'theme.json'), 'utf8'))
  cards.push({ slug, menu, theme })
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const sorted = (rows) => [...rows].sort((a, b) => a.sortOrder - b.sortOrder)

const card = ({ slug, menu, theme }) => {
  const { name, tagline } = menu.business
  const c = theme.colors
  const categories = sorted(menu.categories)
  return `
      <a class="card" href="./${slug}/" style="--bg:${c.cream};--ink:${c.espresso};--soft:${c.cocoa};--accent:${c.terra};--font:${esc(theme.fonts.display)}">
        <div class="swatches" aria-hidden="true">${categories.map((k) => `<span style="background:${k.palette.sheet}"></span>`).join('')}</div>
        <div class="body">
          <p class="kind">${esc(tagline)}</p>
          <h2>${esc(name)}</h2>
          <p class="cats">${categories.map((k) => esc(k.name)).join(' · ')}</p>
          <p class="meta">${menu.products.length} productos</p>
        </div>
        <span class="go">Ver carta <span aria-hidden="true">→</span></span>
      </a>`
}

const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Carta digital · Demos</title>
    <meta name="description" content="Demos de carta digital para cafés, sushi bars, comidas rápidas y pizzerías. Ábrelas en el celular." />
    <meta name="theme-color" content="#f4ede3" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
${[...new Set(cards.map(({ theme }) => theme.fontsHref))].map((href) => `    <link rel="stylesheet" href="${esc(href)}" />`).join('\n')}
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #f4ede3; color: #221b16; font: 16px/1.5 "Manrope", system-ui, sans-serif; }
      main { max-width: 960px; margin: 0 auto; padding: 40px 16px 56px; }
      header h1 { margin: 0; font: 700 clamp(30px, 7vw, 44px)/1.1 "Fraunces", Georgia, serif; letter-spacing: -0.01em; }
      header p { margin: 10px 0 0; max-width: 34em; color: #6b5c51; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-top: 32px; }
      .card { display: flex; flex-direction: column; min-height: 230px; border-radius: 22px; overflow: hidden; background: var(--bg); color: var(--ink);
        text-decoration: none; box-shadow: 0 1px 0 rgb(0 0 0 / 0.04), 0 14px 30px -18px rgb(40 25 15 / 0.45); transition: transform 0.2s ease, box-shadow 0.2s ease; }
      .card:hover { transform: translateY(-3px); box-shadow: 0 1px 0 rgb(0 0 0 / 0.04), 0 22px 36px -18px rgb(40 25 15 / 0.5); }
      .card:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
      .swatches { display: flex; height: 14px; }
      .swatches span { flex: 1; }
      .body { flex: 1; padding: 18px 20px 0; }
      .kind { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: var(--soft); }
      h2 { margin: 2px 0 8px; font: 700 34px/1.1 var(--font); }
      .cats { margin: 0; font-size: 14px; color: var(--soft); }
      .meta { margin: 6px 0 0; font-size: 13px; font-weight: 700; color: var(--soft); }
      .go { display: flex; align-items: center; justify-content: space-between; min-height: 48px; margin-top: 16px; padding: 0 20px;
        border-top: 1px solid color-mix(in srgb, var(--ink) 12%, transparent); font-weight: 800; color: var(--accent); }
      footer { margin-top: 32px; font-size: 13px; color: #6b5c51; }
      @media (prefers-reduced-motion: reduce) { .card { transition: none; } .card:hover { transform: none; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>Carta digital</h1>
        <p>Demos de carta digital para distintos tipos de negocio. Ábrelas en el celular: es donde se usan, desde el QR de la mesa o el link del Instagram.</p>
      </header>
      <div class="grid">${cards.map(card).join('')}
      </div>
      <footer>Negocios ficticios. Fotos de referencia de Unsplash.</footer>
    </main>
  </body>
</html>
`
writeFileSync(resolve(site, 'index.html'), html, 'utf8')
console.log(`\n${cards.length} demos + portada → _site/`)
