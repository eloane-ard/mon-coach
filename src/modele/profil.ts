// Profil et objectifs. Les valeurs par défaut viennent de docs/conception.md
// (validée le 28/10/2026). Elles ne sont qu'une proposition de pré-remplissage :
// rien n'est enregistré tant qu'Eloane n'a pas appuyé sur « Enregistrer ».

export interface Profil {
  prenom: string
  sexe: 'femme' | 'homme'
  age: number | null
  taille_cm: number | null
  poids_depart_kg: number | null
  /** Premier jour du programme (semaine 1). */
  date_debut_programme: string
  /** Facteur d'activité utilisé pour estimer les besoins (1,5 dans la conception). */
  facteur_activite: number
  /** Notes santé (genou, cheville…). */
  notes_sante: string
  /** Reprise des jambes validée par le kiné ou le médecin. */
  reprise_jambes_validee: boolean
}

export interface Objectifs {
  perte_masse_grasse_kg_min: number | null
  perte_masse_grasse_kg_max: number | null
  duree_mois_min: number | null
  duree_mois_max: number | null
  perte_hebdo_kg_min: number | null
  perte_hebdo_kg_max: number | null
  poids_cible_kg: number | null
  tour_taille_cible_cm: number | null
  seances_par_semaine_min: number | null
  seances_par_semaine_max: number | null
  kcal_min: number | null
  kcal_max: number | null
  proteines_g_min: number | null
  proteines_g_max: number | null
  lipides_g_min: number | null
  lipides_g_max: number | null
  glucides_g_min: number | null
  glucides_g_max: number | null
  fibres_g_min: number | null
  fibres_g_max: number | null
  eau_l: number | null
  budget_courses_min: number | null
  budget_courses_max: number | null
}

export const PROFIL_PAR_DEFAUT: Profil = {
  prenom: 'Eloane',
  sexe: 'femme',
  age: 20,
  taille_cm: 173,
  poids_depart_kg: 77,
  date_debut_programme: '2026-10-29',
  facteur_activite: 1.5,
  notes_sante:
    'Fracture de la cheville (il y a ~5 ans), fracture du genou droit (il y a ~1 an), instabilité variable, plusieurs mois de kiné.',
  reprise_jambes_validee: false,
}

export const OBJECTIFS_PAR_DEFAUT: Objectifs = {
  perte_masse_grasse_kg_min: 6,
  perte_masse_grasse_kg_max: 7,
  duree_mois_min: 4,
  duree_mois_max: 6,
  perte_hebdo_kg_min: 0.3,
  perte_hebdo_kg_max: 0.5,
  poids_cible_kg: null,
  tour_taille_cible_cm: null,
  seances_par_semaine_min: 4,
  seances_par_semaine_max: 5,
  kcal_min: 1900,
  kcal_max: 2000,
  proteines_g_min: 120,
  proteines_g_max: 140,
  lipides_g_min: 60,
  lipides_g_max: 75,
  glucides_g_min: 200,
  glucides_g_max: 230,
  fibres_g_min: 25,
  fibres_g_max: 30,
  eau_l: 2,
  budget_courses_min: 20,
  budget_courses_max: 25,
}
