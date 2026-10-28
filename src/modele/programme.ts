// Programme sportif de la semaine (docs/conception.md, « Organisation sportive initiale »).
//
// Semaine type : lundi et mercredi course facile, mardi et jeudi musculation,
// vendredi course optionnelle, week-end repos (marche si envie).
// Progression de la course par étapes ; une étape trop dure se refait une semaine de plus.
import { ajouterJours, ecartJours, lundiDe } from '../utils/dates'
import type { Course, SeanceAutre, SeanceMuscu } from './sport'

export interface ReglagesProgramme {
  /** Lundis des semaines où l'étape a été jugée trop dure (la semaine suivante la refait). */
  etapes_refaites: string[]
  /** Lundis des semaines « légères » (moins de séries). */
  semaines_legeres: string[]
}

export const REGLAGES_PAR_DEFAUT: ReglagesProgramme = { etapes_refaites: [], semaines_legeres: [] }

export type Categorie = 'course' | 'muscu' | 'optionnelle' | 'repos'

export interface SeancePrevue {
  jour: number // 0 = lundi … 6 = dimanche
  date: string
  categorie: Categorie
  titre: string
  detail: string
  /** Ce qu'on fait un jour de fatigue (version courte). */
  versionCourte: string
  /** Type de course proposé (pour pré-remplir la saisie). */
  typeCourse?: 'facile' | 'fractionne'
  /** Durée visée en minutes (course). */
  dureeMin?: number
}

export interface Etape {
  numero: 1 | 2 | 3
  titre: string
  description: string
}

export const ETAPES: Record<1 | 2 | 3, Etape> = {
  1: {
    numero: 1,
    titre: 'Étape 1 · 30 min sans pause',
    description:
      '30 minutes en continu à allure facile (vers 7\'45 à 8\'00/km), une allure où tu peux parler. Besoin de souffler ? On ralentit au lieu de s’arrêter.',
  },
  2: {
    numero: 2,
    titre: 'Étape 2 · Fractionné léger',
    description:
      'Une course par semaine devient du fractionné léger : 10 min d’échauffement, 6 × (1 min un peu plus vite + 2 min lent), 5 min de retour au calme. Les autres restent faciles.',
  },
  3: {
    numero: 3,
    titre: 'Étape 3 · Allonger',
    description:
      'La sortie facile s’allonge (35 puis 40 min). Le fractionné évolue selon tes résultats. Toujours un seul fractionné par semaine maximum, jamais la veille d’une séance de jambes.',
  },
}

export const FRACTIONNE = '10 min d’échauffement · 6 × (1 min un peu plus vite + 2 min lent) · 5 min de retour au calme'

export const REGLES = [
  'Une séance manquée n’est pas rattrapée en doublant : on reprend à la suivante.',
  'Séance de muscu ratée : on refait la même à la séance suivante (A puis A au lieu de A puis B).',
  'Toutes les 4 à 6 semaines, une semaine plus légère (moins de séries).',
  'Mauvais sommeil ou grosse fatigue : version courte plutôt que rien.',
  'Genou : terrain plat au début, peu de descentes, bonnes chaussures. Douleur > 3/10 ou instabilité = on arrête l’exercice.',
  'Étape trop dure = on la refait une semaine de plus.',
]

/** Numéro de semaine du programme (1 = semaine du premier jour). */
export function numeroSemaine(debut: string, jour: string): number {
  return Math.floor(ecartJours(lundiDe(debut), lundiDe(jour)) / 7) + 1
}

/** Semaine « effective » de progression : on retire les semaines refaites avant celle-ci. */
export function semaineEffective(debut: string, lundi: string, reglages: ReglagesProgramme): number {
  const n = numeroSemaine(debut, lundi)
  const refaites = reglages.etapes_refaites.filter((l) => l < lundi).length
  return Math.max(1, n - refaites)
}

export function etapeDe(semaine: number): Etape {
  if (semaine <= 3) return ETAPES[1]
  if (semaine <= 6) return ETAPES[2]
  return ETAPES[3]
}

/** Durée de la sortie facile selon la semaine effective. */
export function dureeCourseFacile(semaine: number): number {
  if (semaine <= 6) return 30
  if (semaine <= 8) return 35
  return 40
}

/** Construit le programme d'une semaine (lundi donné). */
export function programmeSemaine(debut: string, lundi: string, reglages: ReglagesProgramme): SeancePrevue[] {
  const semaine = semaineEffective(debut, lundi, reglages)
  const etape = etapeDe(semaine)
  const legere = reglages.semaines_legeres.includes(lundi)
  const duree = dureeCourseFacile(semaine)
  const seriesMuscu = legere ? '2 séries par exercice (semaine légère)' : '3 séries de 10 à 12 répétitions, 90 s de repos'

  const jours: Omit<SeancePrevue, 'date'>[] = [
    {
      jour: 0,
      categorie: 'course',
      titre: `Course facile ${duree} min`,
      detail: 'Allure où tu peux parler. Ralentir plutôt que s’arrêter.',
      versionCourte: '20 min facile',
      typeCourse: 'facile',
      dureeMin: duree,
    },
    {
      jour: 1,
      categorie: 'muscu',
      titre: 'Musculation (1 h)',
      detail: seriesMuscu,
      versionCourte: '3 exercices, 2 séries (30 min)',
    },
    {
      jour: 2,
      categorie: 'course',
      titre: `Course facile ${duree} min`,
      detail: 'Allure où tu peux parler. Terrain plat de préférence.',
      versionCourte: '20 min facile',
      typeCourse: 'facile',
      dureeMin: duree,
    },
    {
      jour: 3,
      categorie: 'muscu',
      titre: 'Musculation (1 h)',
      detail: seriesMuscu,
      versionCourte: '3 exercices, 2 séries',
    },
    etape.numero === 1
      ? {
          jour: 4,
          categorie: 'optionnelle',
          titre: `Course optionnelle ${duree} min`,
          detail: 'Seulement si tu te sens bien.',
          versionCourte: 'Marche active 30 min',
          typeCourse: 'facile',
          dureeMin: duree,
        }
      : {
          // Le fractionné est placé le vendredi : jamais la veille d'une séance de jambes
          // (mardi et jeudi, les deux séances travaillent les jambes).
          jour: 4,
          categorie: 'optionnelle',
          titre: 'Fractionné (optionnel)',
          detail: FRACTIONNE,
          versionCourte: 'Marche active 30 min',
          typeCourse: 'fractionne',
          dureeMin: 33,
        },
    { jour: 5, categorie: 'repos', titre: 'Repos', detail: 'Marche si tu en as envie.', versionCourte: '—' },
    { jour: 6, categorie: 'repos', titre: 'Repos', detail: 'Marche si tu en as envie.', versionCourte: '—' },
  ]
  return jours.map((j) => {
    const date = ajouterJours(lundi, j.jour)
    // Les jours avant le début du programme ne comptent pas (ni « manqués », ni prévus).
    return date < debut
      ? { ...j, date, categorie: 'repos' as const, titre: 'Avant le programme', detail: '', versionCourte: '—' }
      : { ...j, date }
  })
}

export type Statut = 'faite' | 'manquee' | 'aujourdhui' | 'a_venir' | 'repos' | 'optionnelle_passee'

export interface JourSuivi {
  prevue: SeancePrevue
  statut: Statut
  courses: Course[]
  muscu: SeanceMuscu[]
  autres: SeanceAutre[]
}

/** Associe à chaque jour de la semaine ce qui a été fait, et en déduit un statut. */
export function suiviSemaine(
  prevues: SeancePrevue[],
  aujourdhui: string,
  faites: { courses: Course[]; muscu: SeanceMuscu[]; autres: SeanceAutre[] },
): JourSuivi[] {
  return prevues.map((p) => {
    const courses = faites.courses.filter((c) => c.date === p.date)
    const muscu = faites.muscu.filter((m) => m.date === p.date)
    const autres = faites.autres.filter((a) => a.date === p.date)
    const fait =
      p.categorie === 'muscu'
        ? muscu.length > 0
        : p.categorie === 'course' || p.categorie === 'optionnelle'
          ? courses.length > 0 || autres.length > 0
          : courses.length + muscu.length + autres.length > 0

    let statut: Statut
    if (fait) statut = 'faite'
    else if (p.categorie === 'repos') statut = 'repos'
    else if (p.date === aujourdhui) statut = 'aujourdhui'
    else if (p.date > aujourdhui) statut = 'a_venir'
    else statut = p.categorie === 'optionnelle' ? 'optionnelle_passee' : 'manquee'
    return { prevue: p, statut, courses, muscu, autres }
  })
}

/** Régularité de la semaine : séances faites / séances prévues (hors optionnelles et repos). */
export function regularite(suivi: JourSuivi[]): { faites: number; prevues: number; bonus: number } {
  const obligatoires = suivi.filter((j) => j.prevue.categorie === 'course' || j.prevue.categorie === 'muscu')
  return {
    prevues: obligatoires.length,
    faites: obligatoires.filter((j) => j.statut === 'faite').length,
    bonus: suivi.filter((j) => (j.prevue.categorie === 'optionnelle' || j.prevue.categorie === 'repos') && j.statut === 'faite')
      .length,
  }
}

/** Propose une semaine légère après 4 semaines normales (depuis le début ou la dernière semaine légère). */
export function semaineLegereConseillee(debut: string, lundi: string, reglages: ReglagesProgramme): boolean {
  if (reglages.semaines_legeres.includes(lundi)) return false
  const n = numeroSemaine(debut, lundi)
  const derniere = reglages.semaines_legeres.filter((l) => l < lundi).sort().at(-1)
  const semainesNormales = derniere ? Math.floor(ecartJours(derniere, lundi) / 7) - 1 : n - 1
  return semainesNormales >= 4
}

/** Prochaine séance prévue à partir d'aujourd'hui (incluse), en sautant les repos. */
export function prochaineSeancePrevue(suivi: JourSuivi[]): JourSuivi | undefined {
  return suivi.find((j) => (j.statut === 'aujourdhui' || j.statut === 'a_venir') && j.prevue.categorie !== 'repos')
}
