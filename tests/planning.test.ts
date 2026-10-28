// Tests du planning des repas et de la liste de courses.
import { describe, expect, it } from 'vitest'
import { ALIMENTS } from '../src/contenu/aliments'
import { RECETTES } from '../src/contenu/recettes'
import { indexAliments } from '../src/modele/nutrition'
import {
  alternatives,
  genererPlanning,
  listeCourses,
  remplacerRepas,
  suiviPlanning,
  texteListe,
  totalJour,
  totalSemaine,
} from '../src/modele/planning'
import { OBJECTIFS_PAR_DEFAUT } from '../src/modele/profil'

const aliments = indexAliments(ALIMENTS)
const ctx = (graine: number) => ({ recettes: RECETTES, aliments, objectifs: OBJECTIFS_PAR_DEFAUT, favoris: new Set<string>(), graine })
const recette = (id: string) => RECETTES.find((r) => r.id === id)!

describe('planning de la semaine', () => {
  it('remplit les 7 jours : petit-déjeuner, déjeuner et dîner', () => {
    const p = genererPlanning('2026-11-02', ctx(1))
    expect(p.jours).toHaveLength(7)
    for (const j of p.jours) {
      expect(j.petit_dej).toBeTruthy()
      expect(j.dejeuner).toBeTruthy()
      expect(j.diner).toBeTruthy()
    }
  })

  it('même graine = même planning ; autre graine = planning différent', () => {
    expect(genererPlanning('2026-11-02', ctx(7))).toEqual(genererPlanning('2026-11-02', ctx(7)))
    const a = JSON.stringify(genererPlanning('2026-11-02', ctx(7)).jours)
    const autres = [8, 9, 10, 11].map((g) => JSON.stringify(genererPlanning('2026-11-02', ctx(g)).jours))
    expect(autres.some((b) => b !== a)).toBe(true)
  })

  it('le plat du soir devient le déjeuner du lendemain, et 7 plats différents', () => {
    const p = genererPlanning('2026-11-02', ctx(3))
    for (let j = 0; j < 7; j++) expect(p.jours[(j + 1) % 7].dejeuner?.recette_id).toBe(p.jours[j].diner?.recette_id)
    expect(new Set(p.jours.map((j) => j.diner?.recette_id)).size).toBe(7)
  })

  it('jours d’école : déjeuner à emporter ; en semaine : 30 min maximum le soir', () => {
    for (let g = 1; g <= 20; g++) {
      const p = genererPlanning('2026-11-02', ctx(g))
      for (const j of [0, 1]) expect(recette(p.jours[j].dejeuner!.recette_id).envies).toContain('transportable')
      for (const j of [0, 1, 2, 3, 4]) expect(recette(p.jours[j].diner!.recette_id).temps_min).toBeLessThanOrEqual(30)
    }
  })

  it('les apports sont cohérents avec les objectifs (moyenne 1 850 à 2 050 kcal, protéines ≥ 105 g)', () => {
    for (let g = 1; g <= 20; g++) {
      const p = genererPlanning('2026-11-02', ctx(g))
      const t = totalSemaine(p, RECETTES, aliments)
      expect(t.kcal / 7, `graine ${g}`).toBeGreaterThan(1850)
      expect(t.kcal / 7, `graine ${g}`).toBeLessThan(2050)
      expect(t.proteines / 7, `graine ${g}`).toBeGreaterThan(105)
    }
  })

  // Avec les prix estimés, une semaine complète coûte environ 33 à 38 € (voir docs/choix-a-valider.md).
  it('le coût estimé de la semaine reste sous 40 €', () => {
    for (let g = 1; g <= 20; g++) {
      const p = genererPlanning('2026-11-02', ctx(g))
      expect(listeCourses(p, RECETTES, aliments).coutUtilise, `graine ${g}`).toBeLessThan(40)
    }
  })

  it('remplacer un plat remplace aussi ses restes du lendemain', () => {
    const p = genererPlanning('2026-11-02', ctx(2))
    const q = remplacerRepas(p, 2, 'diner', 'minestrone')
    expect(q.jours[2].diner?.recette_id).toBe('minestrone')
    expect(q.jours[3].dejeuner?.recette_id).toBe('minestrone')
    const r = remplacerRepas(p, 2, 'diner', 'minestrone', false)
    expect(r.jours[3].dejeuner?.recette_id).toBe(p.jours[3].dejeuner?.recette_id)
  })

  it('propose des alternatives du même type de repas', () => {
    const alt = alternatives(RECETTES, 'petit_dej', 'porridge_pomme', aliments)
    expect(alt.length).toBeGreaterThan(3)
    expect(alt.every((r) => r.repas.includes('petit_dej') && r.id !== 'porridge_pomme')).toBe(true)
  })

  it('compte les repas suivis', () => {
    const p = genererPlanning('2026-11-02', ctx(2))
    p.jours[0].petit_dej!.suivi = true
    p.jours[0].dejeuner!.suivi = false
    const s = suiviPlanning(p)
    expect(s.renseignes).toBe(2)
    expect(s.suivis).toBe(1)
  })

  it('total d’une journée', () => {
    const t = totalJour({ petit_dej: { recette_id: 'porridge_pomme', portions: 1, suivi: null } }, RECETTES, aliments)
    expect(t.kcal).toBe(387)
  })
})

describe('liste de courses', () => {
  const p = {
    lundi: '2026-11-02',
    graine: 1,
    jours: [
      { diner: { recette_id: 'pates_thon_tomate', portions: 1, suivi: null } },
      { dejeuner: { recette_id: 'pates_thon_tomate', portions: 1, suivi: null } },
      { petit_dej: { recette_id: 'porridge_pomme', portions: 1, suivi: null } },
      {},
      {},
      {},
      {},
    ],
  }

  it('regroupe les ingrédients et calcule les paquets', () => {
    const l = listeCourses(p, RECETTES, aliments)
    const toutes = l.parRayon.flatMap((g) => g.lignes)
    const pates = toutes.find((x) => x.aliment.id === 'pates')!
    expect(pates.grammes).toBe(160) // 2 portions de la recette
    expect(pates.paquets).toBe(1)
    const thon = toutes.find((x) => x.aliment.id === 'thon')!
    expect(thon.paquets).toBe(1)
    expect(toutes.some((x) => x.aliment.id === 'huile_olive')).toBe(false) // basique : à part
    expect(l.basiques.some((x) => x.aliment.id === 'huile_olive')).toBe(true)
  })

  it('range par rayon dans l’ordre du magasin', () => {
    const l = listeCourses(p, RECETTES, aliments)
    expect(l.parRayon[0].rayon).toBe('Fruits et légumes')
  })

  it('estime le coût utilisé et le coût en paquets', () => {
    const l = listeCourses(p, RECETTES, aliments)
    expect(l.coutUtilise).toBeGreaterThan(2)
    expect(l.coutPaquets).toBeGreaterThan(l.coutUtilise)
  })

  it('le texte à copier ignore ce qui est déjà coché', () => {
    const l = listeCourses(p, RECETTES, aliments)
    const t = texteListe(l, { pates: true })
    expect(t).toContain('Thon')
    expect(t).not.toContain('Pâtes (crues)')
  })
})
