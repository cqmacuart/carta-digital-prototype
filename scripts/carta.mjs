// Runs the menu for one business: its data comes from themes/<slug>/ (business.json + menu.json + theme.json).
//
//   node scripts/carta.mjs dev [slug] [--port 5173] [--host]
//   node scripts/carta.mjs build [slug | --all]      → dist/<slug>/
//   node scripts/carta.mjs preview [slug] [--port 4173] [--host]
//   node scripts/carta.mjs new <slug> [--from demo]  → copies a theme with a fresh tenantId
//
// Without a slug it uses `demo` (Terra, a fictional business).
import { randomUUID } from 'node:crypto'
import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const themesDir = resolve(root, 'themes')

const [cmd = 'dev', ...rest] = process.argv.slice(2)
const flag = (name) => rest.includes(`--${name}`)
const option = (name) => {
  const i = rest.indexOf(`--${name}`)
  return i >= 0 ? rest[i + 1] : undefined
}
const valueOf = new Set(['--port', '--from'].map((f) => rest.indexOf(f) + 1).filter((i) => i > 0))
const named = rest.find((a, i) => !a.startsWith('--') && !valueOf.has(i))
const slug = named ?? 'demo'
const port = option('port') ? Number(option('port')) : undefined
const host = flag('host') || undefined

process.chdir(root)

if (cmd === 'new') {
  // a copy keeps the template's tenantId, and two businesses must never share one: stamp a new id on all three files
  const from = option('from') ?? 'demo'
  const fromDir = resolve(themesDir, from)
  const to = resolve(themesDir, slug)
  if (!named) throw new Error('Uso: npm run new -- <slug> [--from demo]')
  if (existsSync(to)) throw new Error(`themes/${slug} ya existe`)
  if (!existsSync(resolve(fromDir, 'business.json'))) throw new Error(`No hay plantilla themes/${from}`)
  // the template's photos stay behind; only the assets README comes along
  cpSync(fromDir, to, {
    recursive: true,
    filter: (src) => {
      const parts = relative(fromDir, src).split(sep)
      return parts[0] !== 'assets' || parts.length === 1 || parts[1] === 'README.md'
    },
  })
  const tenantId = randomUUID()
  for (const file of ['business.json', 'menu.json', 'theme.json']) {
    const path = resolve(to, file)
    const data = JSON.parse(readFileSync(path, 'utf8'))
    data.tenantId = tenantId
    writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
  }
  console.log(`themes/${slug} creada desde ${from} · tenantId ${tenantId}`)
  console.log('Sigue: business.json (datos del negocio), theme.json (marca y "proposal") y menu.json (la carta).')
  process.exit(0)
}

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
  console.error(`Comando desconocido: ${cmd}. Usa dev, build, preview o new.`)
  process.exit(1)
}
