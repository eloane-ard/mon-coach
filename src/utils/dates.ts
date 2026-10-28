// Outils pour les dates. Les jours sont stockés au format « AAAA-MM-JJ » (heure locale),
// ce qui évite les décalages de fuseau horaire.

/** Jour au format AAAA-MM-JJ (heure locale). */
export function versJour(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Date (à midi, heure locale) correspondant à un jour AAAA-MM-JJ. */
export function depuisJour(jour: string): Date {
  const [a, m, j] = jour.split('-').map(Number)
  return new Date(a, m - 1, j, 12)
}

export function aujourdhui(): string {
  return versJour(new Date())
}

export function ajouterJours(jour: string, n: number): string {
  const d = depuisJour(jour)
  d.setDate(d.getDate() + n)
  return versJour(d)
}

/** Nombre de jours entre deux dates (b − a). */
export function ecartJours(a: string, b: string): number {
  return Math.round((depuisJour(b).getTime() - depuisJour(a).getTime()) / 86_400_000)
}

/** Lundi de la semaine contenant ce jour. */
export function lundiDe(jour: string): string {
  const d = depuisJour(jour)
  const decalage = (d.getDay() + 6) % 7 // lundi = 0 … dimanche = 6
  return ajouterJours(jour, -decalage)
}

/** Jour de la semaine : 0 = lundi … 6 = dimanche. */
export function jourSemaine(jour: string): number {
  return (depuisJour(jour).getDay() + 6) % 7
}

export const NOMS_JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
export const NOMS_JOURS_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

/** « mercredi 29 octobre 2026 » */
export function formatJourLong(jour: string): string {
  return depuisJour(jour).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** « 29 oct. 2026 » */
export function formatJour(jour: string): string {
  return depuisJour(jour).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** « mer. 29 oct. » */
export function formatJourCourt(jour: string): string {
  return depuisJour(jour).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Date et heure à partir d'une date ISO : « 29 oct. 2026 à 18:30 » */
export function formatDateHeure(iso: string | null | undefined): string {
  if (!iso) return 'jamais'
  const d = new Date(iso)
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}
