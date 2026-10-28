// Tests du bilan texte (V6).
import { describe, expect, it } from 'vitest'
import { ALIMENTS } from '../src/contenu/aliments'
import { RECETTES } from '../src/contenu/recettes'
import { bornes, genererBilan } from '../src/modele/bilan'
import { indexAliments } from '../src/modele/nutrition'
import { OBJECTIFS_PAR_DEFAUT, PROFIL_PAR_DEFAUT } from '../src/modele/profil'
import { REGLAGES_PAR_DEFAUT } from '../src/modele/programme'

const donnees = {
  profil: PROFIL_PAR_DEFAUT,
  objectifs: OBJECTIFS_PAR_DEFAUT,
  reglages: REGLAGES_PAR_DEFAUT,
  mesures: [
    { date: '2026-11-02', valeurs: { poids_kg: 77 }, sources: {} },
    { date: '2026-11-08', valeurs: { poids_kg: 76.6, tour_taille_cm: 82, masse_grasse_pct: 32 }, sources: { masse_grasse_pct: 'balance_impedancemetre' as const } },
  ],
  courses: [
    {
      date: '2026-11-02',
      type: 'facile' as const,
      distance_km: 4.16,
      duree_s: 1800,
      allure_s_km: 433,
      sensations: 4,
      difficulte: 5,
      fc_moyenne: null,
      fc_max: null,
      gene_genou: 2,
      version_courte: false,
      note: 'parc',
    },
  ],
  muscu: [
    {
      date: '2026-11-03',
      type: 'A' as const,
      version: 'complete' as const,
      semaine_legere: false,
      duree_min: 60,
      exercices: [{ exercice_id: 'presse_cuisses', series: [{ valeur: 12, charge_kg: 40 }], gene_genou: 1, arrete: false }],
    },
  ],
  autres: [],
  plannings: [],
  recettes: RECETTES,
  aliments: indexAliments(ALIMENTS),
}

describe('bilan', () => {
  it('bornes de la semaine et du mois', () => {
    expect(bornes('semaine', '2026-11-05')).toEqual({ debut: '2026-11-02', fin: '2026-11-08' })
    expect(bornes('mois', '2026-11-30')).toEqual({ debut: '2026-11-01', fin: '2026-11-30' })
  })

  it('résume mesures, sport et alimentation, et signale les estimations', () => {
    const t = genererBilan('semaine', '2026-11-05', donnees)
    expect(t).toContain('Mon bilan de la semaine')
    expect(t).toContain('2 pesée(s)')
    expect(t).toContain('Masse grasse (ESTIMATION impédancemètre)')
    expect(t).toContain(`7'13"/km`)
    expect(t).toContain('Presse à cuisses : 12×40 kg')
    expect(t).toContain('genou 2/10')
    expect(t).toContain('Pas de planning de repas')
    expect(t).toContain('Ne change pas mes objectifs')
  })

  it('période vide : pas d’erreur', () => {
    const t = genererBilan('semaine', '2027-03-01', donnees)
    expect(t).toContain('Pas de pesée')
    expect(t).toContain('aucune sortie')
  })
})
