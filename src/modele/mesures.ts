// Mesures corporelles : poids, tours, masse grasse et masse musculaire estimées.
// Chaque valeur garde sa source, pour distinguer les mesures fiables (balance,
// mètre ruban) des ESTIMATIONS d'impédancemètre.
import { ajouterJours, lundiDe } from '../utils/dates'
import { moyenne } from '../utils/nombres'

export type SourceMesure = 'balance' | 'balance_impedancemetre' | 'metre_ruban' | 'impedancemetre' | 'autre'

export const NOMS_SOURCES: Record<SourceMesure, string> = {
  balance: 'Balance',
  balance_impedancemetre: 'Balance impédancemètre',
  metre_ruban: 'Mètre ruban',
  impedancemetre: 'Impédancemètre',
  autre: 'Autre',
}

export type ChampMesure =
  | 'poids_kg'
  | 'tour_taille_cm'
  | 'tour_hanches_cm'
  | 'tour_cuisse_cm'
  | 'tour_bras_cm'
  | 'tour_poitrine_cm'
  | 'masse_grasse_pct'
  | 'masse_musculaire_kg'

export interface DefinitionChamp {
  champ: ChampMesure
  nom: string
  unite: string
  groupe: 'poids' | 'tours' | 'composition'
  /** Vrai pour les valeurs toujours estimées (impédancemètre). */
  estimation: boolean
  min: number
  max: number
}

export const CHAMPS_MESURE: DefinitionChamp[] = [
  { champ: 'poids_kg', nom: 'Poids', unite: 'kg', groupe: 'poids', estimation: false, min: 30, max: 200 },
  { champ: 'tour_taille_cm', nom: 'Tour de taille', unite: 'cm', groupe: 'tours', estimation: false, min: 40, max: 200 },
  { champ: 'tour_hanches_cm', nom: 'Tour de hanches', unite: 'cm', groupe: 'tours', estimation: false, min: 40, max: 200 },
  { champ: 'tour_cuisse_cm', nom: 'Tour de cuisse', unite: 'cm', groupe: 'tours', estimation: false, min: 20, max: 120 },
  { champ: 'tour_bras_cm', nom: 'Tour de bras', unite: 'cm', groupe: 'tours', estimation: false, min: 10, max: 80 },
  { champ: 'tour_poitrine_cm', nom: 'Tour de poitrine', unite: 'cm', groupe: 'tours', estimation: false, min: 40, max: 200 },
  { champ: 'masse_grasse_pct', nom: 'Masse grasse', unite: '%', groupe: 'composition', estimation: true, min: 3, max: 70 },
  { champ: 'masse_musculaire_kg', nom: 'Masse musculaire', unite: 'kg', groupe: 'composition', estimation: true, min: 10, max: 120 },
]

export const SOURCES_PAR_GROUPE: Record<DefinitionChamp['groupe'], SourceMesure[]> = {
  poids: ['balance_impedancemetre', 'balance', 'autre'],
  tours: ['metre_ruban', 'autre'],
  composition: ['balance_impedancemetre', 'impedancemetre', 'autre'],
}

export const SOURCE_PAR_DEFAUT: Record<DefinitionChamp['groupe'], SourceMesure> = {
  poids: 'balance_impedancemetre',
  tours: 'metre_ruban',
  composition: 'balance_impedancemetre',
}

export interface Mesure {
  date: string // AAAA-MM-JJ
  valeurs: Partial<Record<ChampMesure, number>>
  sources: Partial<Record<ChampMesure, SourceMesure>>
  note?: string
}

/** Une valeur est une estimation si le champ l'est toujours, ou si elle vient d'un impédancemètre. */
export function estEstimation(champ: ChampMesure, source?: SourceMesure): boolean {
  const def = CHAMPS_MESURE.find((c) => c.champ === champ)
  if (def?.estimation) return true
  return source === 'impedancemetre'
}

/** Vérifie les valeurs saisies. Renvoie la liste des problèmes (vide si tout va bien). */
export function verifierMesure(m: Mesure): string[] {
  const erreurs: string[] = []
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date)) erreurs.push('La date est invalide.')
  const remplies = Object.entries(m.valeurs).filter(([, v]) => v !== undefined && v !== null)
  if (remplies.length === 0) erreurs.push('Saisis au moins une valeur.')
  for (const [champ, v] of remplies) {
    const def = CHAMPS_MESURE.find((c) => c.champ === champ)!
    if (v! < def.min || v! > def.max) erreurs.push(`${def.nom} : ${v} ${def.unite} semble incorrect (entre ${def.min} et ${def.max}).`)
  }
  return erreurs
}

export interface PointSerie {
  date: string
  valeur: number
  estimation: boolean
}

/** Série d'un champ, triée par date (plusieurs mesures le même jour : la dernière saisie compte). */
export function serie(mesures: Mesure[], champ: ChampMesure): PointSerie[] {
  const parJour = new Map<string, PointSerie>()
  for (const m of mesures) {
    const v = m.valeurs[champ]
    if (v === undefined || v === null) continue
    parJour.set(m.date, { date: m.date, valeur: v, estimation: estEstimation(champ, m.sources[champ]) })
  }
  return [...parJour.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export interface MoyenneSemaine {
  lundi: string
  moyenne: number
  nombre: number
}

/**
 * Moyennes par semaine (lundi → dimanche).
 * C'est la moyenne de la semaine qui sert de juge, pas une pesée isolée (conception).
 */
export function moyennesHebdo(points: PointSerie[]): MoyenneSemaine[] {
  const groupes = new Map<string, number[]>()
  for (const p of points) {
    const l = lundiDe(p.date)
    groupes.set(l, [...(groupes.get(l) ?? []), p.valeur])
  }
  return [...groupes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([lundi, vals]) => ({ lundi, moyenne: moyenne(vals)!, nombre: vals.length }))
}

/** Moyenne des valeurs des 7 derniers jours (jusqu'à « jour » inclus). */
export function moyenneGlissante7j(points: PointSerie[], jour: string): number | null {
  const debut = ajouterJours(jour, -6)
  return moyenne(points.filter((p) => p.date >= debut && p.date <= jour).map((p) => p.valeur))
}
