// Lecture et affichage des nombres « à la française » (virgule décimale).

/**
 * Lit un nombre saisi : accepte « 76,5 », « 76.5 », « 76 » et les espaces.
 * Renvoie null si le champ est vide ou invalide.
 */
export function lireNombre(texte: string | number | null | undefined): number | null {
  if (texte === null || texte === undefined) return null
  if (typeof texte === 'number') return Number.isFinite(texte) ? texte : null
  const propre = texte.replace(/\s/g, '').replace(',', '.')
  if (propre === '') return null
  const n = Number(propre)
  return Number.isFinite(n) ? n : null
}

/** Affiche un nombre avec la virgule : 76.5 → « 76,5 ». */
export function formatNombre(n: number | null | undefined, decimales = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: decimales })
}

/** Texte pour un champ de saisie (vide si pas de valeur). */
export function versChamp(n: number | null | undefined): string {
  return n === null || n === undefined ? '' : String(n).replace('.', ',')
}

/** Arrondi à n décimales. */
export function arrondir(n: number, decimales = 1): number {
  const f = 10 ** decimales
  return Math.round(n * f) / f
}

/** Moyenne d'une liste (null si vide). */
export function moyenne(valeurs: number[]): number | null {
  if (valeurs.length === 0) return null
  return valeurs.reduce((a, b) => a + b, 0) / valeurs.length
}

/** Prix : 3.5 → « 3,50 € ». */
export function formatPrix(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}
