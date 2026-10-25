// Runs the menu for one business: its data comes from themes/<slug>/ (menu.json + theme.json).
//
//   node scripts/carta.mjs dev [slug] [--port 5173] [--host]
//   node scripts/carta.mjs build [slug | --all]      → dist/<slug>/
//   node scripts/carta.mjs preview [slug] [--port 4173] [--host]
//
// Without a slug it uses `demo` (Terra, a fictional business).
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const themesDir = resolve(root, 'themes')

const [cmd = 'dev', ...rest] = process.argv.slice(2)
const flag = (name) => rest.includes(`--${name}`)
const option = (name) => {
  const i = rest.indexOf(`--${name}`)
  return i >= 0 ? rest[i + 1] : undefined
}
const valueOf = new Set(['--port'].map((f) => rest.indexOf(f) + 1).filter((i) => i > 0))
const slug = rest.find((a, i) => !a.startsWith('--') && !valueOf.has(i)) ?? 'demo'
const port = option('port') ? Number(option('port')) : undefined
const host = flag('host') || undefined

process.chdir(root)
const vite = await import('vite')

if (cmd === 'dev') {
  process.env.CARTA_CLIENT = slug
  const server = await vite.createServer({ root, server: { port, host } })
  await server.listen()
  console.log(`\n  Carta de ${slug}`)
  server.printUrls()
} else if (cmd === 'build') {
  const slugs = flag('all')
    ? readdirSync(themesDir).filter((d) => existsSync(resolve(themesDir, d, 'menu.json')))
    : [slug]
  for (const s of slugs) {
    process.env.CARTA_CLIENT = s
    console.log(`\n▸ Carta de ${s} → dist/${s}/`)
    await vite.build({ root })
  }
} else if (cmd === 'preview') {
  process.env.CARTA_CLIENT = slug
  const server = await vite.preview({ root, preview: { port, host } })
  server.printUrls()
} else {
  console.error(`Comando desconocido: ${cmd}. Usa dev, build o preview.`)
  process.exit(1)
}
