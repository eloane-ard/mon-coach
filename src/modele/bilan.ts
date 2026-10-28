// « Préparer mon bilan » : résumé texte de mes données (semaine ou mois),
// à copier-coller dans une conversation avec Claude. Aucune photo, aucune IA dans l'appli.
import { exercice } from '../contenu/exercices'
import { ajouterJours, formatJour, lundiDe } from '../utils/dates'
import { formatNombre, moyenne } from '../utils/nombres'
import { CHAMPS_MESURE, serie, type Mesure } from './mesures'
import { suiviPlanning, totalSemaine, type PlanningSemaine } from './planning'
import type { Objectifs, Profil } from './profil'
import { programmeSemaine, regularite, suiviSemaine, type ReglagesProgramme } from './programme'
import { formatAllure, formatDuree, geneMaxSeance, NOMS_ACTIVITES, NOMS_TYPES_COURSE, type Course, type SeanceAutre, type SeanceMuscu } from './sport'
import type { Recette } from '../contenu/recettes'
import type { Aliment } from '../contenu/aliments'

export type PeriodeBilan = 'semaine' | 'mois'

export interface DonneesBilan {
  profil: Profil
  objectifs: Objectifs
  reglages: ReglagesProgramme
  mesures: Mesure[]
  courses: Course[]
  muscu: SeanceMuscu[]
  autres: SeanceAutre[]
  plannings: PlanningSemaine[]
  recettes: Recette[]
  aliments: Map<string, Aliment>
}

/** Bornes de la période : la semaine (lundi → dimanche) ou les 30 derniers jours, jusqu'à « fin ». */
export function bornes(periode: PeriodeBilan, fin: string): { debut: string; fin: string } {
  return periode === 'semaine' ? { debut: lundiDe(fin), fin: ajouterJours(lundiDe(fin), 6) } : { debut: ajouterJours(fin, -29), fin }
}

const ecart = (n: number, unite: string) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${formatNombre(Math.abs(n))} ${unite}`

export function genererBilan(periode: PeriodeBilan, finPeriode: string, d: DonneesBilan): string {
  const { debut, fin } = bornes(periode, finPeriode)
  const dans = <T extends { date: string }>(l: T[]) => l.filter((x) => x.date >= debut && x.date <= fin)
  const L: string[] = []
  const o = d.objectifs

  L.push(`# Mon bilan ${periode === 'semaine' ? 'de la semaine' : 'du mois'} (${formatJour(debut)} → ${formatJour(fin)})`)
  L.push('')
  L.push('## Contexte')
  L.push(
    `- ${d.profil.prenom}, ${d.profil.age ?? '?'} ans, ${d.profil.taille_cm ?? '?'} cm, poids de départ ${formatNombre(d.profil.poids_depart_kg)} kg. Programme commencé le ${formatJour(d.profil.date_debut_programme)}.`,
  )
  L.push(
    `- Objectif : perdre ${o.perte_masse_grasse_kg_min} à ${o.perte_masse_grasse_kg_max} kg de masse grasse en ${o.duree_mois_min} à ${o.duree_mois_max} mois (${formatNombre(o.perte_hebdo_kg_min)} à ${formatNombre(o.perte_hebdo_kg_max)} kg/semaine) en gardant mes muscles.`,
  )
  L.push(
    `- Repères : ${o.kcal_min}–${o.kcal_max} kcal/jour, ${o.proteines_g_min}–${o.proteines_g_max} g de protéines, ${o.seances_par_semaine_min}–${o.seances_par_semaine_max} séances/semaine.`,
  )
  if (d.profil.notes_sante) L.push(`- Santé : ${d.profil.notes_sante} Reprise des jambes ${d.profil.reprise_jambes_validee ? 'validée' : 'pas encore validée'} par le kiné.`)

  // ---------- Mesures ----------
  L.push('')
  L.push('## Mesures')
  const toutes = d.mesures
  const pesees = serie(dans(toutes), 'poids_kg')
  if (pesees.length === 0) L.push('- Pas de pesée sur la période.')
  else {
    const moy = moyenne(pesees.map((p) => p.valeur))!
    L.push(`- Poids : ${pesees.length} pesée(s), moyenne ${formatNombre(moy)} kg (de ${formatNombre(pesees[0].valeur)} à ${formatNombre(pesees.at(-1)!.valeur)} kg).`)
    const avant = serie(toutes, 'poids_kg').filter((p) => p.date < debut && p.date >= ajouterJours(debut, periode === 'semaine' ? -7 : -30))
    if (avant.length) L.push(`- Moyenne de la période précédente : ${formatNombre(moyenne(avant.map((p) => p.valeur))!)} kg (${ecart(moy - moyenne(avant.map((p) => p.valeur))!, 'kg')}).`)
  }
  for (const c of CHAMPS_MESURE.filter((x) => x.champ !== 'poids_kg')) {
    const s = serie(toutes, c.champ).filter((p) => p.date <= fin)
    const periodeS = s.filter((p) => p.date >= debut)
    if (periodeS.length === 0) continue
    const dernier = periodeS.at(-1)!
    const premier = s[0]
    L.push(
      `- ${c.nom}${dernier.estimation ? ' (ESTIMATION impédancemètre)' : ''} : ${formatNombre(dernier.valeur)} ${c.unite} le ${formatJour(dernier.date)}` +
        (premier.date < dernier.date ? ` (${ecart(dernier.valeur - premier.valeur, c.unite)} depuis le ${formatJour(premier.date)})` : ''),
    )
  }

  // ---------- Sport ----------
  L.push('')
  L.push('## Sport')
  const faites = { courses: d.courses, muscu: d.muscu, autres: d.autres }
  let prevues = 0
  let realisees = 0
  for (let l = lundiDe(debut); l <= fin; l = ajouterJours(l, 7)) {
    const s = suiviSemaine(programmeSemaine(d.profil.date_debut_programme, l, d.reglages), fin, faites).filter(
      (j) => j.prevue.date >= debut && j.prevue.date <= fin,
    )
    const r = regularite(s)
    prevues += r.prevues
    realisees += r.faites
  }
  L.push(`- Régularité : ${realisees}/${prevues} séances prévues réalisées.`)
  const c = dans(d.courses)
  if (c.length) {
    const km = c.reduce((t, x) => t + x.distance_km, 0)
    const meilleure = c.reduce((a, b) => (a.allure_s_km < b.allure_s_km ? a : b))
    L.push(`- Course : ${c.length} sortie(s), ${formatNombre(km)} km, meilleure allure ${formatAllure(meilleure.allure_s_km)}.`)
    for (const x of c) {
      L.push(
        `  - ${formatJour(x.date)} · ${NOMS_TYPES_COURSE[x.type]} · ${formatNombre(x.distance_km, 2)} km en ${formatDuree(x.duree_s)} (${formatAllure(x.allure_s_km)})` +
          (x.difficulte ? ` · difficulté ${x.difficulte}/10` : '') +
          (x.sensations ? ` · sensations ${x.sensations}/5` : '') +
          (x.gene_genou ? ` · genou ${x.gene_genou}/10` : '') +
          (x.fc_moyenne ? ` · FC moy. ${x.fc_moyenne}` : '') +
          (x.note ? ` · « ${x.note} »` : ''),
      )
    }
  } else L.push('- Course : aucune sortie.')
  const m = dans(d.muscu)
  if (m.length) {
    L.push(`- Musculation : ${m.length} séance(s) (${m.map((s) => `${s.type}${s.version === 'courte' ? ' courte' : ''}`).join(', ')}).`)
    const ids = [...new Set(m.flatMap((s) => s.exercices.filter((e) => e.series.length).map((e) => e.exercice_id)))]
    for (const id of ids) {
      const perfs = m
        .map((s) => ({ date: s.date, e: s.exercices.find((e) => e.exercice_id === id && e.series.length) }))
        .filter((x) => x.e)
      const ex = exercice(id)
      const derniere = perfs.at(-1)!.e!
      const txt = derniere.series.map((s) => (ex?.mesure === 'secondes' ? `${s.valeur} s` : `${s.valeur}×${formatNombre(s.charge_kg)} kg`)).join(', ')
      L.push(`  - ${ex?.nom ?? id} : ${txt}${derniere.gene_genou ? ` · genou ${derniere.gene_genou}/10` : ''}${derniere.arrete ? ' · ARRÊTÉ' : ''}`)
    }
    const genes = m.map(geneMaxSeance).filter((g): g is number => g !== null)
    if (genes.length) L.push(`- Gêne au genou en musculation : maximum ${Math.max(...genes)}/10.`)
    for (const s of m.filter((x) => x.note)) L.push(`  - Note du ${formatJour(s.date)} : « ${s.note} »`)
  } else L.push('- Musculation : aucune séance.')
  const a = dans(d.autres)
  if (a.length) L.push(`- Autres activités : ${a.map((x) => `${NOMS_ACTIVITES[x.activite]} ${x.duree_min} min`).join(', ')}.`)

  // ---------- Alimentation ----------
  L.push('')
  L.push('## Alimentation')
  const pls = d.plannings.filter((p) => p.lundi <= fin && ajouterJours(p.lundi, 6) >= debut)
  if (pls.length === 0) L.push('- Pas de planning de repas sur la période.')
  for (const p of pls) {
    const t = totalSemaine(p, d.recettes, d.aliments)
    const s = suiviPlanning(p)
    L.push(
      `- Semaine du ${formatJour(p.lundi)} : planning à ~${Math.round(t.kcal / 7)} kcal et ${formatNombre(t.proteines / 7, 0)} g de protéines par jour (estimations).` +
        (s.renseignes ? ` Plan suivi pour ${s.suivis}/${s.renseignes} repas renseignés.` : ' Suivi des repas non renseigné.'),
    )
  }

  L.push('')
  L.push('## Ma demande')
  L.push(
    'Peux-tu analyser ce bilan (en tenant compte de mon genou et de ma cheville) et me proposer, si besoin, de petits ajustements pour la suite (sport et alimentation) ? Ne change pas mes objectifs sans m’en parler. Rappel : les valeurs de masse grasse et musculaire sont des estimations d’impédancemètre, et les calories des estimations à ± 10–15 %.',
  )
  return L.join('\n')
}
