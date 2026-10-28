// Calculs pour les graphiques et le tableau de bord : périodes, moyennes, régularité.
import { ajouterJours, lundiDe } from '../utils/dates'
import { moyenne } from '../utils/nombres'
import type { Course, SeanceAutre, SeanceMuscu } from './sport'

export type IdPeriode = '7j' | '30j' | '3m' | '6m' | '1an' | 'tout'

export const PERIODES: { id: IdPeriode; nom: string; jours: number | null }[] = [
  { id: '7j', nom: '7 j', jours: 7 },
  { id: '30j', nom: '30 j', jours: 30 },
  { id: '3m', nom: '3 mois', jours: 91 },
  { id: '6m', nom: '6 mois', jours: 182 },
  { id: '1an', nom: '1 an', jours: 365 },
  { id: 'tout', nom: 'Depuis le début', jours: null },
]

export interface Point {
  date: string
  valeur: number
  estimation?: boolean
}

/** Premier jour inclus dans la période (null = depuis le début). */
export function debutPeriode(periode: IdPeriode, aujourdhui: string): string | null {
  const p = PERIODES.find((x) => x.id === periode)!
  return p.jours ? ajouterJours(aujourdhui, -(p.jours - 1)) : null
}

export function dansPeriode<T extends { date: string }>(liste: T[], periode: IdPeriode, aujourdhui: string): T[] {
  const debut = debutPeriode(periode, aujourdhui)
  return liste.filter((x) => (!debut || x.date >= debut) && x.date <= aujourdhui)
}

/** Moyenne mobile sur 7 jours (pour lisser les pesées quotidiennes). */
export function moyenneMobile(points: Point[], jours = 7): Point[] {
  const tries = points.slice().sort((a, b) => a.date.localeCompare(b.date))
  return tries.map((p) => {
    const debut = ajouterJours(p.date, -(jours - 1))
    const fenetre = tries.filter((x) => x.date >= debut && x.date <= p.date).map((x) => x.valeur)
    return { date: p.date, valeur: moyenne(fenetre)! }
  })
}

export interface SemaineSport {
  lundi: string
  courses: number
  muscu: number
  autres: number
  km: number
}

/** Activité par semaine (lundi → dimanche), y compris les semaines sans rien. */
export function activiteParSemaine(
  debut: string,
  fin: string,
  donnees: { courses: Course[]; muscu: SeanceMuscu[]; autres: SeanceAutre[] },
): SemaineSport[] {
  const semaines: SemaineSport[] = []
  for (let l = lundiDe(debut); l <= fin; l = ajouterJours(l, 7)) {
    const dimanche = ajouterJours(l, 6)
    const dans = <T extends { date: string }>(x: T[]) => x.filter((e) => e.date >= l && e.date <= dimanche)
    const c = dans(donnees.courses)
    semaines.push({
      lundi: l,
      courses: c.length,
      muscu: dans(donnees.muscu).length,
      autres: dans(donnees.autres).length,
      km: c.reduce((t, x) => t + x.distance_km, 0),
    })
  }
  return semaines
}

/** Évolution entre la première et la dernière valeur d'une série (null si moins de 2 points). */
export function evolution(points: Point[]): number | null {
  if (points.length < 2) return null
  const t = points.slice().sort((a, b) => a.date.localeCompare(b.date))
  return t.at(-1)!.valeur - t[0].valeur
}

/** Nombre de semaines consécutives (jusqu'à la semaine dernière incluse) avec au moins `minimum` séances. */
export function semainesRegulieres(semaines: SemaineSport[], minimum: number, lundiActuel: string): number {
  let n = 0
  for (const s of semaines.filter((x) => x.lundi < lundiActuel).reverse()) {
    if (s.courses + s.muscu >= minimum) n++
    else break
  }
  return n
}
