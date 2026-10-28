// Accès en direct aux aliments (bibliothèque + mes aliments) et aux recettes favorites.
import { useMemo } from 'react'
import type { Aliment } from '../contenu/aliments'
import { enregistrer, useListe } from './depot'
import { fusionnerAliments, idStable, indexAliments } from '../modele/nutrition'

/** Bibliothèque complète d'aliments (mes modifications et ajouts compris). */
export function useAliments(): { liste: Aliment[]; index: Map<string, Aliment>; perso: Set<string> } {
  const perso = useListe<Aliment>('aliment')
  return useMemo(() => {
    const miens = (perso ?? []).map((e) => e.donnees)
    const liste = fusionnerAliments(miens).sort((a, b) => a.nom.localeCompare(b.nom))
    return { liste, index: indexAliments(liste), perso: new Set(miens.map((a) => a.id)) }
  }, [perso])
}

/** Enregistre un aliment (nouveau ou modification d'un aliment de la bibliothèque). */
export function enregistrerAliment(a: Aliment) {
  return enregistrer('aliment', a, idStable(`aliment:${a.id}`))
}

export interface PreferenceRecette {
  recette_id: string
  favori: boolean
}

export function useFavoris(): Set<string> {
  const prefs = useListe<PreferenceRecette>('preference_recette')
  return useMemo(() => new Set((prefs ?? []).filter((p) => p.donnees.favori).map((p) => p.donnees.recette_id)), [prefs])
}

export function changerFavori(recetteId: string, favori: boolean) {
  return enregistrer<PreferenceRecette>('preference_recette', { recette_id: recetteId, favori }, idStable(`favori:${recetteId}`))
}
