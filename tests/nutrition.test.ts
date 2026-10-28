// Tests de la nutrition : besoins estimés, recettes (exclusions, calculs), filtres.
import { describe, expect, it } from 'vitest'
import { ALIMENTS } from '../src/contenu/aliments'
import { RECETTES } from '../src/contenu/recettes'
import {
  contientExclu,
  estimerBesoins,
  estVegetarienne,
  FILTRES_VIDES,
  filtrerRecettes,
  fusionnerAliments,
  idStable,
  indexAliments,
  mifflinStJeor,
  valeursPortion,
} from '../src/modele/nutrition'
import { PROFIL_PAR_DEFAUT } from '../src/modele/profil'

const index = indexAliments(ALIMENTS)

describe('besoins estimés', () => {
  it('retrouve le calcul de la conception (≈ 1 590 kcal de métabolisme de base)', () => {
    expect(Math.round(mifflinStJeor(77, 173, 20, 'femme'))).toBe(1590)
  })

  it('cible ≈ 1 900 à 2 000 kcal et 120 à 140 g de protéines pour 77 kg', () => {
    const b = estimerBesoins(PROFIL_PAR_DEFAUT, 77)!
    expect(b.entretien).toBeGreaterThanOrEqual(2300)
    expect(b.entretien).toBeLessThanOrEqual(2450)
    expect(b.cibleMin).toBeGreaterThanOrEqual(1850)
    expect(b.cibleMax).toBeLessThanOrEqual(2050)
    expect(b.proteinesMin).toBe(123)
    expect(b.proteinesMax).toBe(139)
  })
})

describe('bibliothèques', () => {
  it('aucun aliment ni recette ne contient poivron, chou-fleur, aubergine ou banane', () => {
    for (const a of ALIMENTS) expect(contientExclu(a.nom), a.nom).toBe(false)
    for (const r of RECETTES) {
      const tout = [r.nom, ...r.etapes, ...r.alternatives, ...r.ingredients.map((i) => `${i.aliment} ${i.texte ?? ''}`)].join(' ')
      expect(contientExclu(tout.replace(/sans poivron/gi, '')), r.nom).toBe(false)
    }
  })

  it('chaque ingrédient de recette existe dans la bibliothèque d’aliments', () => {
    for (const r of RECETTES) for (const i of r.ingredients) expect(index.has(i.aliment), `${r.id} → ${i.aliment}`).toBe(true)
  })

  it('identifiants uniques et recettes de semaine en 30 min max (sauf four / week-end)', () => {
    expect(new Set(RECETTES.map((r) => r.id)).size).toBe(RECETTES.length)
    expect(new Set(ALIMENTS.map((a) => a.id)).size).toBe(ALIMENTS.length)
    for (const r of RECETTES.filter((x) => x.temps_min > 30)) expect(r.envies, r.nom).toContain('four')
  })

  it('chaque aliment indique sa source et des valeurs plausibles', () => {
    for (const a of ALIMENTS) {
      expect(a.source).toMatch(/Ciqual/)
      const calculees = a.proteines * 4 + a.glucides * 4 + a.lipides * 9 + a.fibres * 2
      // (les aliments très peu caloriques, comme le citron, ont d'autres sources d'énergie : acides…)
      if (a.kcal >= 50) expect(Math.abs(calculees - a.kcal) / a.kcal, a.nom).toBeLessThan(0.2)
    }
  })

  it('assez de recettes pour chaque repas', () => {
    expect(RECETTES.filter((r) => r.repas.includes('petit_dej')).length).toBeGreaterThanOrEqual(6)
    expect(RECETTES.filter((r) => r.repas.includes('dejeuner')).length).toBeGreaterThanOrEqual(15)
    expect(RECETTES.filter((r) => r.repas.includes('diner')).length).toBeGreaterThanOrEqual(15)
    expect(RECETTES.filter((r) => r.repas.includes('collation')).length).toBeGreaterThanOrEqual(4)
  })
})

describe('valeurs d’une recette', () => {
  it('calcule calories, protéines et prix par portion', () => {
    const r = RECETTES.find((x) => x.id === 'porridge_pomme')!
    const v = valeursPortion(r, index)
    // 50 g avoine (185) + 200 g lait (92) + 120 g pomme (64) + 100 g fromage blanc (46) = 387 kcal
    expect(v.kcal).toBe(387)
    expect(v.proteines).toBeCloseTo(21.6, 0)
    expect(v.prix).toBeGreaterThan(0.3)
    expect(v.prix).toBeLessThan(1)
  })

  it('divise par le nombre de portions', () => {
    const r = RECETTES.find((x) => x.id === 'pates_thon_tomate')!
    const v1 = valeursPortion(r, index)
    const v2 = valeursPortion({ ...r, portions: 1 }, index)
    expect(Math.abs(v2.kcal - 2 * v1.kcal)).toBeLessThanOrEqual(1)
  })

  it('reconnaît les recettes végétariennes', () => {
    expect(estVegetarienne(RECETTES.find((x) => x.id === 'dahl_lentilles')!, index)).toBe(true)
    expect(estVegetarienne(RECETTES.find((x) => x.id === 'chili_con_carne')!, index)).toBe(false)
  })

  it('un prix modifié dans mes aliments change le prix des recettes', () => {
    const perso = fusionnerAliments([{ ...ALIMENTS.find((a) => a.id === 'lait')!, prix_kg: 2 }])
    const r = RECETTES.find((x) => x.id === 'porridge_pomme')!
    expect(valeursPortion(r, indexAliments(perso)).prix).toBeGreaterThan(valeursPortion(r, index).prix)
  })
})

describe('filtres', () => {
  it('par repas, envie et temps', () => {
    const res = filtrerRecettes(RECETTES, { ...FILTRES_VIDES, repas: 'diner', tempsMax: 15 }, new Set(), index)
    expect(res.length).toBeGreaterThan(0)
    for (const { recette } of res) {
      expect(recette.repas).toContain('diner')
      expect(recette.temps_min).toBeLessThanOrEqual(15)
    }
    const frais = filtrerRecettes(RECETTES, { ...FILTRES_VIDES, envies: ['frais'] }, new Set(), index)
    for (const { recette } of frais) expect(recette.envies).toContain('frais')
  })

  it('favoris en premier, et filtre « favoris seulement »', () => {
    const fav = new Set(['minestrone'])
    expect(filtrerRecettes(RECETTES, FILTRES_VIDES, fav, index)[0].recette.id).toBe('minestrone')
    expect(filtrerRecettes(RECETTES, { ...FILTRES_VIDES, favorisSeulement: true }, fav, index)).toHaveLength(1)
  })

  it('avec mes ingrédients disponibles : recettes faisables d’abord, basiques ignorés', () => {
    const res = filtrerRecettes(
      RECETTES,
      { ...FILTRES_VIDES, disponibles: ['pates', 'thon', 'tomates_concassees', 'emmental'] },
      new Set(),
      index,
    )
    expect(res[0].recette.id).toBe('pates_thon_tomate') // huile, oignon, épices = basiques
    expect(res[0].manquants).toEqual([])
    expect(res.every((r) => r.manquants.length <= 2)).toBe(true)
  })
})

describe('identifiant stable', () => {
  it('est un UUID valide, identique pour une même clé', () => {
    const a = idStable('favori:porridge_pomme')
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(idStable('favori:porridge_pomme')).toBe(a)
    expect(idStable('favori:dahl_lentilles')).not.toBe(a)
  })
})
