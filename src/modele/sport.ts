// Données et calculs du sport : courses, séances de musculation, progression des charges.
import { exercice, type Exercice, type TypeSeance } from '../contenu/exercices'
import { arrondir } from '../utils/nombres'

// ---------- Course à pied ----------

export type TypeCourse = 'facile' | 'fractionne' | 'longue' | 'autre'

export const NOMS_TYPES_COURSE: Record<TypeCourse, string> = {
  facile: 'Facile',
  fractionne: 'Fractionné',
  longue: 'Sortie longue',
  autre: 'Autre',
}

export interface Course {
  date: string
  type: TypeCourse
  distance_km: number
  duree_s: number
  /** Allure en secondes par km (calculée à l'enregistrement). */
  allure_s_km: number
  /** 1 (très mauvaises) à 5 (excellentes). */
  sensations: number | null
  /** Difficulté ressentie de 1 (très facile) à 10 (maximale). */
  difficulte: number | null
  fc_moyenne: number | null
  fc_max: number | null
  /** Gêne au genou de 0 (aucune) à 10. */
  gene_genou: number | null
  version_courte: boolean
  note?: string
}

/**
 * Lit une durée saisie : « 30 », « 30:15 », « 1:05:30 », « 30'15 », « 30 min 15 » ou « 1h05 ».
 * Un nombre seul = des minutes. Renvoie des secondes, ou null si invalide.
 */
export function lireDuree(texte: string): number | null {
  const t = texte.trim().toLowerCase().replace(/\s+/g, '')
  if (!t) return null
  const parties = t
    .replace(/h/g, ':')
    .replace(/min|mn|m|'/g, ':')
    .replace(/s|"/g, '')
    .split(':')
    .filter((p, i, tab) => p !== '' || i < tab.length - 1)
  if (parties.some((p) => !/^\d+([.,]\d+)?$/.test(p))) return null
  const n = parties.map((p) => Number(p.replace(',', '.')))
  let secondes: number
  const avecHeures = t.includes('h')
  if (avecHeures && n.length === 2) secondes = n[0] * 3600 + n[1] * 60 // « 1h05 »
  else if (n.length === 1) secondes = n[0] * (avecHeures ? 3600 : 60)
  else if (n.length === 2) secondes = n[0] * 60 + n[1]
  else if (n.length === 3) secondes = n[0] * 3600 + n[1] * 60 + n[2]
  else return null
  if (n.length >= 2 && n[n.length - 1] >= 60) return null
  return secondes > 0 ? Math.round(secondes) : null
}

/** Durée lisible : 1815 → « 30:15 », 3930 → « 1:05:30 ». */
export function formatDuree(secondes: number): string {
  const s = Math.round(secondes)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  const p = (x: number) => String(x).padStart(2, '0')
  return h > 0 ? `${h}:${p(m)}:${p(r)}` : `${m}:${p(r)}`
}

/** Allure en secondes par km. */
export function calculerAllure(distanceKm: number, dureeS: number): number | null {
  if (!(distanceKm > 0) || !(dureeS > 0)) return null
  return dureeS / distanceKm
}

/** Allure lisible : 433 s/km → « 7'13"/km ». */
export function formatAllure(sParKm: number | null | undefined): string {
  if (!sParKm || !Number.isFinite(sParKm)) return '—'
  let m = Math.floor(sParKm / 60)
  let s = Math.round(sParKm % 60)
  if (s === 60) {
    m += 1
    s = 0
  }
  return `${m}'${String(s).padStart(2, '0')}"/km`
}

/** Vitesse en km/h. */
export function vitesseKmh(distanceKm: number, dureeS: number): number {
  return arrondir(distanceKm / (dureeS / 3600), 1)
}

// ---------- Musculation ----------

export interface Serie {
  /** Répétitions (ou secondes pour les exercices tenus). */
  valeur: number | null
  charge_kg: number | null
}

export interface ExerciceRealise {
  exercice_id: string
  series: Serie[]
  /** Gêne au genou pendant l'exercice, de 0 à 10. */
  gene_genou: number | null
  /** Exercice arrêté (douleur > 3/10 ou instabilité). */
  arrete: boolean
  note?: string
}

export interface SeanceMuscu {
  date: string
  type: TypeSeance
  version: 'complete' | 'courte'
  semaine_legere: boolean
  exercices: ExerciceRealise[]
  duree_min: number | null
  note?: string
}

/** Seuil de gêne au genou au-delà duquel on arrête l'exercice (conception). */
export const SEUIL_DOULEUR = 3

/** Plus grande gêne au genou notée pendant la séance. */
export function geneMaxSeance(s: SeanceMuscu): number | null {
  const v = s.exercices.map((e) => e.gene_genou).filter((g): g is number => g !== null)
  return v.length ? Math.max(...v) : null
}

/** Séance suivante : on alterne A et B à partir de la dernière séance FAITE (une séance ratée se refait). */
export function prochaineSeance(seances: SeanceMuscu[]): TypeSeance {
  const derniere = seances.slice().sort((a, b) => a.date.localeCompare(b.date)).at(-1)
  if (!derniere) return 'A'
  return derniere.type === 'A' ? 'B' : 'A'
}

/** Dernière fois que cet exercice a été fait (séance la plus récente avant « avantLe »). */
export function dernierePerformance(
  seances: SeanceMuscu[],
  exerciceId: string,
  avantLe?: string,
): { date: string; realise: ExerciceRealise; complete: boolean } | null {
  const triees = seances
    .filter((s) => !avantLe || s.date < avantLe)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
  for (const s of triees) {
    const r = s.exercices.find((e) => e.exercice_id === exerciceId && e.series.some((x) => x.valeur !== null))
    if (r) return { date: s.date, realise: r, complete: s.version === 'complete' && !s.semaine_legere }
  }
  return null
}

export interface Suggestion {
  charge_kg: number | null
  /** Valeur visée par série (répétitions ou secondes). */
  objectif: number
  progression: boolean
  message: string
}

/**
 * Double progression : 3 × 12 réussis proprement (sans gêne au genou) → on ajoute la plus
 * petite charge possible. Sinon, même charge et on essaie de faire une répétition de plus.
 * Pour les exercices tenus (secondes) : +5 s quand toutes les séries atteignent le maximum.
 */
export function suggestion(ex: Exercice, seances: SeanceMuscu[], avantLe?: string): Suggestion {
  const derniere = dernierePerformance(seances, ex.id, avantLe)
  if (!derniere) {
    return {
      charge_kg: null,
      objectif: ex.min,
      progression: false,
      message: ex.avecCharge
        ? 'Première fois : trouve une charge où la dernière répétition est difficile mais propre.'
        : `Première fois : tiens ${ex.min} secondes proprement.`,
    }
  }
  const series = derniere.realise.series.filter((s) => s.valeur !== null)
  const charges = series.map((s) => s.charge_kg).filter((c): c is number => c !== null)
  const charge = charges.length ? Math.max(...charges) : null
  const toutesAuMax =
    series.length >= 3 && series.every((s) => (s.valeur ?? 0) >= ex.max) && derniere.complete
  const sansGene = (derniere.realise.gene_genou ?? 0) <= SEUIL_DOULEUR && !derniere.realise.arrete

  if (ex.mesure === 'secondes') {
    const meilleur = Math.max(...series.map((s) => s.valeur ?? 0))
    if (toutesAuMax && sansGene) {
      return { charge_kg: null, objectif: Math.min(meilleur + 5, 90), progression: true, message: 'Objectif atteint : +5 secondes.' }
    }
    return { charge_kg: null, objectif: Math.max(ex.min, meilleur), progression: false, message: `Dernière fois : ${meilleur} s.` }
  }

  if (toutesAuMax && sansGene && charge !== null) {
    return {
      charge_kg: arrondir(charge + ex.incrementKg, 2),
      objectif: ex.min,
      progression: true,
      message: `3 × ${ex.max} réussis : +${String(ex.incrementKg).replace('.', ',')} kg.`,
    }
  }
  const meilleuresReps = Math.max(...series.map((s) => s.valeur ?? 0))
  return {
    charge_kg: charge,
    objectif: Math.min(ex.max, Math.max(ex.min, meilleuresReps)),
    progression: false,
    message: !sansGene
      ? 'Gêne au genou la dernière fois : même charge, amplitude confortable.'
      : `Même charge, vise ${ex.max} répétitions sur chaque série.`,
  }
}

/** Historique d'un exercice : une ligne par séance. */
export function historiqueExercice(
  seances: SeanceMuscu[],
  exerciceId: string,
): { date: string; series: Serie[]; chargeMax: number | null; volume: number; gene: number | null }[] {
  return seances
    .filter((s) => s.exercices.some((e) => e.exercice_id === exerciceId))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => {
      const e = s.exercices.find((x) => x.exercice_id === exerciceId)!
      const series = e.series.filter((x) => x.valeur !== null)
      const charges = series.map((x) => x.charge_kg).filter((c): c is number => c !== null)
      const ex = exercice(exerciceId)
      return {
        date: s.date,
        series,
        chargeMax: charges.length ? Math.max(...charges) : null,
        volume: ex?.avecCharge ? series.reduce((t, x) => t + (x.valeur ?? 0) * (x.charge_kg ?? 0), 0) : 0,
        gene: e.gene_genou,
      }
    })
}

// ---------- Autres activités ----------

export interface SeanceAutre {
  date: string
  activite: 'marche' | 'velo' | 'natation' | 'autre'
  duree_min: number
  note?: string
}

export const NOMS_ACTIVITES: Record<SeanceAutre['activite'], string> = {
  marche: 'Marche active',
  velo: 'Vélo',
  natation: 'Natation',
  autre: 'Autre',
}
