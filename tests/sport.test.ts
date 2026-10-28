// Tests des calculs du sport : allure, durées, progression des charges, programme de la semaine.
import { describe, expect, it } from 'vitest'
import { EXERCICES, exercice, exercicesDe } from '../src/contenu/exercices'
import {
  dureeCourseFacile,
  etapeDe,
  numeroSemaine,
  programmeSemaine,
  prochaineSeancePrevue,
  REGLAGES_PAR_DEFAUT,
  regularite,
  semaineEffective,
  semaineLegereConseillee,
  suiviSemaine,
} from '../src/modele/programme'
import {
  calculerAllure,
  formatAllure,
  formatDuree,
  historiqueExercice,
  lireDuree,
  prochaineSeance,
  suggestion,
  type Course,
  type SeanceMuscu,
} from '../src/modele/sport'

describe('course : allure et durées', () => {
  it('calcule l’allure de la course de référence (4,16 km en 30 min ≈ 7\'13"/km)', () => {
    const a = calculerAllure(4.16, 30 * 60)!
    expect(Math.round(a)).toBe(433)
    expect(formatAllure(a)).toBe(`7'13"/km`)
  })

  it('arrondit correctement sans afficher 60 secondes', () => {
    expect(formatAllure(479.7)).toBe(`8'00"/km`)
    expect(formatAllure(null)).toBe('—')
  })

  it('refuse une distance ou une durée nulle', () => {
    expect(calculerAllure(0, 1800)).toBeNull()
    expect(calculerAllure(5, 0)).toBeNull()
  })

  it('lit les durées saisies de plusieurs façons', () => {
    expect(lireDuree('30')).toBe(1800)
    expect(lireDuree('30:15')).toBe(1815)
    expect(lireDuree("30'15")).toBe(1815)
    expect(lireDuree('30 min 15')).toBe(1815)
    expect(lireDuree('30min')).toBe(1800)
    expect(lireDuree('1:05:30')).toBe(3930)
    expect(lireDuree('1h05')).toBe(3900)
    expect(lireDuree('')).toBeNull()
    expect(lireDuree('abc')).toBeNull()
    expect(lireDuree('30:75')).toBeNull()
  })

  it('affiche les durées', () => {
    expect(formatDuree(1815)).toBe('30:15')
    expect(formatDuree(3930)).toBe('1:05:30')
  })
})

const seance = (date: string, type: 'A' | 'B', exercices: SeanceMuscu['exercices'], version: 'complete' | 'courte' = 'complete'): SeanceMuscu => ({
  date,
  type,
  version,
  semaine_legere: false,
  exercices,
  duree_min: 60,
})
const presse = (reps: number[], charge: number, gene: number | null = null) => ({
  exercice_id: 'presse_cuisses',
  series: reps.map((r) => ({ valeur: r, charge_kg: charge })),
  gene_genou: gene,
  arrete: false,
})

describe('musculation', () => {
  it('chaque séance a 6 exercices et une version courte de 3 exercices', () => {
    expect(exercicesDe('A')).toHaveLength(6)
    expect(exercicesDe('B')).toHaveLength(6)
    expect(exercicesDe('A', true)).toHaveLength(3)
    expect(exercicesDe('B', true)).toHaveLength(3)
    expect(new Set(EXERCICES.map((e) => e.id)).size).toBe(EXERCICES.length)
  })

  it('alterne A et B à partir de la dernière séance faite', () => {
    expect(prochaineSeance([])).toBe('A')
    expect(prochaineSeance([seance('2026-11-03', 'A', [])])).toBe('B')
    expect(prochaineSeance([seance('2026-11-03', 'A', []), seance('2026-11-05', 'B', [])])).toBe('A')
  })

  it('séance ratée : on refait la même (pas d’enregistrement = pas d’alternance)', () => {
    // A faite mardi, jeudi ratée → la suivante est toujours B
    expect(prochaineSeance([seance('2026-11-03', 'A', [])])).toBe('B')
  })

  it('double progression : 3 × 12 propres → plus petite charge en plus', () => {
    const ex = exercice('presse_cuisses')!
    const s = suggestion(ex, [seance('2026-11-03', 'A', [presse([12, 12, 12], 40)])])
    expect(s.progression).toBe(true)
    expect(s.charge_kg).toBe(42.5)
  })

  it('pas de progression si une série n’atteint pas 12', () => {
    const ex = exercice('presse_cuisses')!
    const s = suggestion(ex, [seance('2026-11-03', 'A', [presse([12, 11, 10], 40)])])
    expect(s.progression).toBe(false)
    expect(s.charge_kg).toBe(40)
  })

  it('pas de progression si gêne au genou > 3/10', () => {
    const ex = exercice('presse_cuisses')!
    const s = suggestion(ex, [seance('2026-11-03', 'A', [presse([12, 12, 12], 40, 5)])])
    expect(s.progression).toBe(false)
    expect(s.message).toMatch(/genou/)
  })

  it('pas de progression après une version courte (2 séries)', () => {
    const ex = exercice('presse_cuisses')!
    const s = suggestion(ex, [seance('2026-11-03', 'A', [presse([12, 12], 40)], 'courte')])
    expect(s.progression).toBe(false)
  })

  it('reprend la dernière séance contenant l’exercice', () => {
    const ex = exercice('presse_cuisses')!
    const seances = [
      seance('2026-11-03', 'A', [presse([10, 10, 10], 35)]),
      seance('2026-11-05', 'B', []),
      seance('2026-11-10', 'A', [presse([11, 10, 10], 37.5)]),
    ]
    expect(suggestion(ex, seances).charge_kg).toBe(37.5)
    expect(suggestion(ex, seances, '2026-11-10').charge_kg).toBe(35) // avant le 10
    expect(suggestion(ex, []).charge_kg).toBeNull()
  })

  it('exercices tenus : +5 s quand toutes les séries atteignent le maximum', () => {
    const ex = exercice('gainage_planche')!
    const s = suggestion(ex, [
      seance('2026-11-03', 'A', [
        { exercice_id: 'gainage_planche', series: [45, 45, 45].map((v) => ({ valeur: v, charge_kg: null })), gene_genou: null, arrete: false },
      ]),
    ])
    expect(s.objectif).toBe(50)
  })

  it('historique d’un exercice : charge max et volume', () => {
    const h = historiqueExercice([seance('2026-11-03', 'A', [presse([12, 10], 40)])], 'presse_cuisses')
    expect(h[0].chargeMax).toBe(40)
    expect(h[0].volume).toBe(880)
  })
})

describe('programme de la semaine', () => {
  const debut = '2026-10-29' // un jeudi

  it('numérote les semaines à partir du lundi de la semaine de départ', () => {
    expect(numeroSemaine(debut, '2026-10-26')).toBe(1)
    expect(numeroSemaine(debut, '2026-11-01')).toBe(1)
    expect(numeroSemaine(debut, '2026-11-02')).toBe(2)
    expect(numeroSemaine(debut, '2026-11-16')).toBe(4)
  })

  it('suit les étapes de la course', () => {
    expect(etapeDe(1).numero).toBe(1)
    expect(etapeDe(4).numero).toBe(2)
    expect(etapeDe(7).numero).toBe(3)
    expect(dureeCourseFacile(3)).toBe(30)
    expect(dureeCourseFacile(7)).toBe(35)
    expect(dureeCourseFacile(9)).toBe(40)
  })

  it('une étape trop dure se refait une semaine de plus', () => {
    const r = { ...REGLAGES_PAR_DEFAUT, etapes_refaites: ['2026-11-09'] } // semaine 3 jugée trop dure
    expect(semaineEffective(debut, '2026-11-16', REGLAGES_PAR_DEFAUT)).toBe(4)
    expect(semaineEffective(debut, '2026-11-16', r)).toBe(3)
    expect(etapeDe(semaineEffective(debut, '2026-11-16', r)).numero).toBe(1)
  })

  it('les jours avant le début du programme ne comptent pas', () => {
    const p = programmeSemaine(debut, '2026-10-26', REGLAGES_PAR_DEFAUT)
    expect(p.map((j) => j.categorie)).toEqual(['repos', 'repos', 'repos', 'muscu', 'optionnelle', 'repos', 'repos'])
  })

  it('semaine type : course lundi/mercredi, muscu mardi/jeudi, vendredi optionnel, week-end repos', () => {
    const p = programmeSemaine(debut, '2026-11-02', REGLAGES_PAR_DEFAUT)
    expect(p.map((j) => j.categorie)).toEqual(['course', 'muscu', 'course', 'muscu', 'optionnelle', 'repos', 'repos'])
    expect(p[0].date).toBe('2026-11-02')
  })

  it('le fractionné (étape 2) tombe le vendredi, jamais la veille d’une séance de jambes', () => {
    const p = programmeSemaine(debut, '2026-11-16', REGLAGES_PAR_DEFAUT)
    const fractionnes = p.filter((j) => j.typeCourse === 'fractionne')
    expect(fractionnes).toHaveLength(1)
    const veille = p[fractionnes[0].jour + 1]
    expect(veille?.categorie).not.toBe('muscu')
  })

  it('semaine légère : 2 séries', () => {
    const p = programmeSemaine(debut, '2026-11-30', { ...REGLAGES_PAR_DEFAUT, semaines_legeres: ['2026-11-30'] })
    expect(p[1].detail).toMatch(/2 séries/)
  })

  it('statuts : faite, manquée, aujourd’hui, à venir', () => {
    const p = programmeSemaine(debut, '2026-11-02', REGLAGES_PAR_DEFAUT)
    const course: Course = {
      date: '2026-11-02',
      type: 'facile',
      distance_km: 4,
      duree_s: 1800,
      allure_s_km: 450,
      sensations: 4,
      difficulte: 5,
      fc_moyenne: null,
      fc_max: null,
      gene_genou: null,
      version_courte: false,
    }
    const s = suiviSemaine(p, '2026-11-04', { courses: [course], muscu: [], autres: [] })
    expect(s.map((j) => j.statut)).toEqual(['faite', 'manquee', 'aujourdhui', 'a_venir', 'a_venir', 'repos', 'repos'])
    expect(regularite(s)).toEqual({ faites: 1, prevues: 4, bonus: 0 })
    expect(prochaineSeancePrevue(s)?.prevue.jour).toBe(2)
  })

  it('propose une semaine légère toutes les 5 semaines environ', () => {
    expect(semaineLegereConseillee(debut, '2026-11-16', REGLAGES_PAR_DEFAUT)).toBe(false) // semaine 4
    expect(semaineLegereConseillee(debut, '2026-11-23', REGLAGES_PAR_DEFAUT)).toBe(true) // semaine 5
    const r = { ...REGLAGES_PAR_DEFAUT, semaines_legeres: ['2026-11-23'] }
    expect(semaineLegereConseillee(debut, '2026-11-30', r)).toBe(false)
    expect(semaineLegereConseillee(debut, '2026-12-28', r)).toBe(true)
  })
})
