// Fabrique les icônes PNG de l'appli (iPhone, Android, PC) à partir du dessin public/icones/icone.svg.
// À relancer seulement si le dessin change : « npm run icons » (nécessite Playwright).
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

// Playwright n'est pas une dépendance du projet : on utilise celui installé sur l'ordinateur.
const { chromium } = createRequire(import.meta.url)('playwright')

const dossier = new URL('../public/icones/', import.meta.url)
const svg = await readFile(new URL('icone.svg', dossier), 'utf8')

// « plein » : sans coins arrondis (iPhone et Android arrondissent eux-mêmes).
// « marge » : dessin réduit au centre, pour les icônes « maskable » d'Android.
const icones = [
  { fichier: 'apple-touch-icon.png', taille: 180, marge: 1 },
  { fichier: 'icone-192.png', taille: 192, marge: 1 },
  { fichier: 'icone-512.png', taille: 512, marge: 1 },
  { fichier: 'icone-maskable-512.png', taille: 512, marge: 0.78 },
]

const carre = svg.replace('rx="112"', 'rx="0"')
const navigateur = await chromium.launch()
for (const { fichier, taille, marge } of icones) {
  const page = await navigateur.newPage({ viewport: { width: taille, height: taille } })
  const t = Math.round(taille * marge)
  const dessin = carre.replace('<svg ', `<svg width="${t}" height="${t}" `).replace(/<rect[^>]*\/>/, '')
  await page.setContent(`<body style="margin:0;width:${taille}px;height:${taille}px;background:#14614f;display:grid;place-items:center">${dessin}</body>`)
  await page.screenshot({ path: new URL(fichier, dossier).pathname })
  await page.close()
}
await navigateur.close()
console.log('Icônes générées.')
