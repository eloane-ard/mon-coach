// Planning des repas sur 7 jours et liste de courses.
//
// Principes (docs/conception.md) :
//   • petit-déjeuner rassasiant, des protéines à chaque repas, une douceur prévue ;
//   • 30 min de cuisine maximum en semaine, pas de batch cooking ;
//   • budget de 20 à 25 € par semaine chez Leclerc.
// Choix d'organisation : chaque plat est cuisiné pour 2 portions le soir ; la 2e portion
// devient le déjeuner du lendemain (pratique les jours d'école, lundi et mardi).
import type { Aliment, Rayon } from '../contenu/aliments'
import { RAYONS } from '../contenu/aliments'
import type { Recette, Repas } from '../contenu/recettes'
import type { Objectifs } from './profil'
import { additionner, valeursPortion, VALEURS_VIDES, type Valeurs } from './nutrition'
import { arrondir } from '../utils/nombres'

export const REPAS_DU_JOUR: Repas[] = ['petit_dej', 'dejeuner', 'diner', 'collation']

export interface RepasPlanifie {
  recette_id: string
  portions: number
  /** « J'ai suivi le plan » : true = oui, false = non, null = pas encore renseigné. */
  suivi: boolean | null
}

export type JourPlanning = Partial<Record<Repas, RepasPlanifie | null>>

export interface PlanningSemaine {
  lundi: string
  jours: JourPlanning[] // 7 jours, du lundi au dimanche
  graine: number
}

// ---------- Hasard reproductible (même graine = même planning) ----------

export function hasard(graine: number): () => number {
  let a = graine >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------- Génération ----------

export interface ContexteGeneration {
  recettes: Recette[]
  aliments: Map<string, Aliment>
  objectifs: Objectifs
  favoris: Set<string>
  graine: number
}

/** Jours d'école (lundi, mardi) : le déjeuner doit pouvoir s'emporter. */
const JOURS_ECOLE = [0, 1]
/** Week-end : les recettes plus longues (au four) sont possibles le soir. */
const JOURS_WEEKEND = [5, 6]

function cibleKcal(o: Objectifs): number {
  return ((o.kcal_min ?? 1900) + (o.kcal_max ?? 2000)) / 2
}

/** Génère un planning complet pour la semaine. */
export function genererPlanning(lundi: string, ctx: ContexteGeneration): PlanningSemaine {
  const alea = hasard(ctx.graine)
  const v = (r: Recette) => valeursPortion(r, ctx.aliments)
  const jours: JourPlanning[] = Array.from({ length: 7 }, () => ({}))

  // --- Petits-déjeuners : on varie, et le « plaisir » une fois dans la semaine (dimanche).
  const petitsDej = ctx.recettes.filter((r) => r.repas.includes('petit_dej') && r.id !== 'petit_dej_plaisir')
  const plaisir = ctx.recettes.find((r) => r.id === 'petit_dej_plaisir')
  const ordrePdj = melanger(petitsDej, alea)
  for (let j = 0; j < 7; j++) {
    const r = j === 6 && plaisir ? plaisir : ordrePdj[j % ordrePdj.length]
    jours[j].petit_dej = { recette_id: r.id, portions: 1, suivi: null }
  }

  // --- Plats : 7 plats différents, cuisinés le soir pour 2 portions (dîner + déjeuner du lendemain).
  const plats = ctx.recettes.filter((r) => r.repas.includes('diner') && r.repas.includes('dejeuner'))
  const choisis: Recette[] = []
  for (let soir = 0; soir < 7; soir++) {
    const lendemain = (soir + 1) % 7
    const possibles = plats.filter(
      (r) =>
        !choisis.includes(r) &&
        (JOURS_WEEKEND.includes(soir) || r.temps_min <= 30) &&
        (!JOURS_ECOLE.includes(lendemain) || r.envies.includes('transportable')),
    )
    const liste = possibles.length ? possibles : plats.filter((r) => !choisis.includes(r))
    // Score : protéines (satiété), prix bas (budget), favoris, et un peu de hasard pour varier.
    const score = (r: Recette) => {
      const x = v(r)
      return x.proteines / 10 - x.prix * 3 + (ctx.favoris.has(r.id) ? 1.5 : 0) + alea() * 2.5
    }
    const r = liste.slice().sort((a, b) => score(b) - score(a))[0]
    choisis.push(r)
    jours[soir].diner = { recette_id: r.id, portions: 1, suivi: null }
    jours[lendemain].dejeuner = { recette_id: r.id, portions: 1, suivi: null }
  }

  // --- Collations : celle qui rapproche le plus de l'objectif calorique du jour.
  const collations = ctx.recettes.filter((r) => r.repas.includes('collation') && !r.repas.includes('petit_dej'))
  const cible = cibleKcal(ctx.objectifs)
  for (let j = 0; j < 7; j++) {
    const base = totalJour(jours[j], ctx.recettes, ctx.aliments).kcal
    const manque = cible - base
    const triees = collations
      .slice()
      .sort((a, b) => Math.abs(v(a).kcal - manque) - Math.abs(v(b).kcal - manque) + (alea() - 0.5) * 60)
    // La douceur prévue revient régulièrement (au moins un jour sur deux).
    const douceur = collations.find((r) => r.id === 'douceur_chocolat')
    const r = douceur && j % 2 === 1 && Math.abs(v(douceur).kcal - manque) < 250 ? douceur : triees[0]
    if (manque > 80) jours[j].collation = { recette_id: r.id, portions: 1, suivi: null }
    else jours[j].collation = null
  }

  // --- Portions des plats ajustées (par quarts) pour atteindre l'objectif calorique du jour.
  for (let j = 0; j < 7; j++) {
    const jour = jours[j]
    const total = totalJour(jour, ctx.recettes, ctx.aliments).kcal
    const plats = (['dejeuner', 'diner'] as const)
      .map((m) => jour[m])
      .filter((p): p is RepasPlanifie => !!p)
    const kcalPlats = plats.reduce((t, p) => t + v(ctx.recettes.find((r) => r.id === p.recette_id)!).kcal, 0)
    if (kcalPlats === 0 || total >= cible - 50) continue
    const facteur = Math.min(1.5, Math.round(((cible - (total - kcalPlats)) / kcalPlats) * 4) / 4)
    if (facteur > 1) for (const p of plats) p.portions = facteur
  }

  return { lundi, jours, graine: ctx.graine }
}

function melanger<T>(liste: T[], alea: () => number): T[] {
  const l = liste.slice()
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1))
    ;[l[i], l[j]] = [l[j], l[i]]
  }
  return l
}

// ---------- Totaux ----------

export function totalJour(jour: JourPlanning, recettes: Recette[], aliments: Map<string, Aliment>): Valeurs {
  let t = VALEURS_VIDES
  for (const repas of REPAS_DU_JOUR) {
    const p = jour[repas]
    if (!p) continue
    const r = recettes.find((x) => x.id === p.recette_id)
    if (r) t = additionner(t, valeursPortion(r, aliments), p.portions)
  }
  return t
}

export function totalSemaine(pl: PlanningSemaine, recettes: Recette[], aliments: Map<string, Aliment>): Valeurs {
  return pl.jours.reduce((t, j) => additionner(t, totalJour(j, recettes, aliments)), VALEURS_VIDES)
}

/** Part des repas renseignés comme « suivis » (pour la régularité). */
export function suiviPlanning(pl: PlanningSemaine): { suivis: number; renseignes: number; total: number } {
  const repas = pl.jours.flatMap((j) => REPAS_DU_JOUR.map((r) => j[r]).filter((x): x is RepasPlanifie => !!x))
  return {
    total: repas.length,
    renseignes: repas.filter((r) => r.suivi !== null).length,
    suivis: repas.filter((r) => r.suivi === true).length,
  }
}

/** Remplace un repas ; pour un plat, remplace aussi sa portion « restes » (dîner ↔ déjeuner du lendemain). */
export function remplacerRepas(pl: PlanningSemaine, jour: number, repas: Repas, recetteId: string, avecRestes = true): PlanningSemaine {
  const jours = pl.jours.map((j) => ({ ...j }))
  const ancien = jours[jour][repas]?.recette_id
  jours[jour][repas] = { recette_id: recetteId, portions: 1, suivi: null }
  if (avecRestes && ancien) {
    const lie = repas === 'diner' ? { jour: (jour + 1) % 7, repas: 'dejeuner' as const } : repas === 'dejeuner' ? { jour: (jour + 6) % 7, repas: 'diner' as const } : null
    if (lie && jours[lie.jour][lie.repas]?.recette_id === ancien) {
      jours[lie.jour][lie.repas] = { recette_id: recetteId, portions: 1, suivi: null }
    }
  }
  return { ...pl, jours }
}

/** Recettes de remplacement pour un repas : même type de repas, calories proches d'abord. */
export function alternatives(recettes: Recette[], repas: Repas, actuelle: string, aliments: Map<string, Aliment>): Recette[] {
  const ref = recettes.find((r) => r.id === actuelle)
  const kcalRef = ref ? valeursPortion(ref, aliments).kcal : 0
  return recettes
    .filter((r) => r.repas.includes(repas) && r.id !== actuelle)
    .sort((a, b) => Math.abs(valeursPortion(a, aliments).kcal - kcalRef) - Math.abs(valeursPortion(b, aliments).kcal - kcalRef))
}

// ---------- Liste de courses ----------

export interface LigneCourses {
  aliment: Aliment
  grammes: number
  /** Nombre de paquets à acheter (arrondi au-dessus). */
  paquets: number
  /** Coût de la quantité utilisée dans la semaine. */
  coutUtilise: number
  /** Coût des paquets entiers. */
  coutPaquets: number
  recettes: string[]
}

export interface ListeCourses {
  parRayon: { rayon: Rayon; lignes: LigneCourses[] }[]
  basiques: LigneCourses[]
  coutUtilise: number
  coutPaquets: number
}

/** Regroupe tous les ingrédients de la semaine, par rayon. Les basiques (huile, épices…) sont à part. */
export function listeCourses(pl: PlanningSemaine, recettes: Recette[], aliments: Map<string, Aliment>): ListeCourses {
  const cumul = new Map<string, { g: number; recettes: Set<string> }>()
  for (const jour of pl.jours) {
    for (const repas of REPAS_DU_JOUR) {
      const p = jour[repas]
      if (!p) continue
      const r = recettes.find((x) => x.id === p.recette_id)
      if (!r) continue
      for (const ing of r.ingredients) {
        const c = cumul.get(ing.aliment) ?? { g: 0, recettes: new Set<string>() }
        c.g += (ing.g / r.portions) * p.portions
        c.recettes.add(r.nom)
        cumul.set(ing.aliment, c)
      }
    }
  }

  const lignes: LigneCourses[] = []
  for (const [id, c] of cumul) {
    const a = aliments.get(id)
    if (!a) continue
    const paquets = Math.max(1, Math.ceil(c.g / a.conditionnement_g - 0.05)) // 5 % de marge : 510 g → 1 paquet de 500 g
    lignes.push({
      aliment: a,
      grammes: Math.round(c.g),
      paquets,
      coutUtilise: arrondir((a.prix_kg * c.g) / 1000, 2),
      coutPaquets: arrondir((a.prix_kg * a.conditionnement_g * paquets) / 1000, 2),
      recettes: [...c.recettes],
    })
  }
  lignes.sort((a, b) => a.aliment.nom.localeCompare(b.aliment.nom))
  const normales = lignes.filter((l) => !l.aliment.basique)
  const basiques = lignes.filter((l) => l.aliment.basique)
  return {
    parRayon: RAYONS.map((rayon) => ({ rayon, lignes: normales.filter((l) => l.aliment.rayon === rayon) })).filter((g) => g.lignes.length > 0),
    basiques,
    coutUtilise: arrondir(lignes.reduce((t, l) => t + l.coutUtilise, 0), 2),
    coutPaquets: arrondir(normales.reduce((t, l) => t + l.coutPaquets, 0), 2),
  }
}

/** Texte de la liste, pour la copier dans les Notes ou un message. */
export function texteListe(liste: ListeCourses, coches: Record<string, boolean>): string {
  const lignes: string[] = []
  for (const g of liste.parRayon) {
    const restantes = g.lignes.filter((l) => !coches[l.aliment.id])
    if (!restantes.length) continue
    lignes.push(`— ${g.rayon} —`)
    for (const l of restantes) lignes.push(`☐ ${l.aliment.nom} : ${l.paquets} × ${l.aliment.conditionnement} (${l.grammes} g utilisés)`)
  }
  return lignes.join('\n')
}
