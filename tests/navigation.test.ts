// Vérifie que la liste des espaces respecte la navigation validée dans CLAUDE.md.
import { describe, expect, it } from 'vitest'
import { ESPACES, espaceDuChemin, estDisponible } from '../src/navigation'

describe('navigation', () => {
  it('contient les 11 espaces dans l’ordre validé', () => {
    expect(ESPACES.map((e) => e.titre)).toEqual([
      'Accueil',
      'Mon programme sportif',
      'Course à pied',
      'Musculation',
      'Nutrition',
      'Recettes',
      'Planning des repas',
      'Liste de courses',
      'Évolution physique',
      'Historique et statistiques',
      'Paramètres',
    ])
  })

  it('n’a pas deux espaces à la même adresse', () => {
    const chemins = ESPACES.map((e) => e.chemin)
    expect(new Set(chemins).size).toBe(chemins.length)
  })

  it('en V1, seuls l’Évolution physique et les Paramètres sont disponibles', () => {
    expect(ESPACES.filter((e) => estDisponible(e, 1)).map((e) => e.chemin)).toEqual(['/evolution', '/parametres'])
  })

  it('en V2, le sport s’ajoute', () => {
    expect(ESPACES.filter((e) => estDisponible(e, 2)).map((e) => e.chemin)).toEqual([
      '/programme',
      '/course',
      '/musculation',
      '/evolution',
      '/parametres',
    ])
  })

  it('retrouve un espace à partir de son adresse', () => {
    expect(espaceDuChemin('/course')?.titre).toBe('Course à pied')
    expect(espaceDuChemin('/inconnu')).toBeUndefined()
  })
})
