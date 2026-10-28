// Forme commune de toutes les données de l'appli.
// Chaque enregistrement (une mesure, une course, une séance…) a :
//   • un identifiant unique (UUID) créé sur l'appareil ;
//   • un type (ex. « mesure ») et son contenu (« donnees ») ;
//   • ses dates de création, de modification et de suppression logique.

/** Les différents types d'enregistrements. Ne jamais renommer une valeur existante. */
export type TypeEnregistrement =
  | 'profil'
  | 'objectifs'
  | 'mesure'
  | 'seance_muscu'
  | 'course'
  | 'seance_autre'
  | 'aliment'
  | 'preference_recette'
  | 'planning_semaine'
  | 'courses_semaine'
  | 'etat_sauvegardes'
  | 'reglage_programme'

export const TYPES_ENREGISTREMENT: TypeEnregistrement[] = [
  'profil',
  'objectifs',
  'mesure',
  'seance_muscu',
  'course',
  'seance_autre',
  'aliment',
  'preference_recette',
  'planning_semaine',
  'courses_semaine',
  'etat_sauvegardes',
  'reglage_programme',
]

/** Nom affiché pour chaque type (écran « État des sauvegardes », restauration). */
export const NOMS_TYPES: Record<string, string> = {
  profil: 'Profil',
  objectifs: 'Objectifs',
  mesure: 'Mesures corporelles',
  seance_muscu: 'Séances de musculation',
  course: 'Courses à pied',
  seance_autre: 'Autres séances (marche…)',
  aliment: 'Aliments ajoutés',
  preference_recette: 'Recettes favorites',
  planning_semaine: 'Plannings des repas',
  courses_semaine: 'Listes de courses',
  etat_sauvegardes: 'État des sauvegardes',
  reglage_programme: 'Réglages du programme',
}

export interface Enregistrement<D = Record<string, unknown>> {
  id: string
  type: TypeEnregistrement | string
  donnees: D
  created_at: string // date ISO (ex. 2026-10-29T18:30:00.000Z)
  updated_at: string
  deleted_at: string | null
}

/** Enregistrement tel que stocké sur l'appareil : avec l'indicateur « à envoyer ». */
export interface EnregistrementLocal<D = Record<string, unknown>> extends Enregistrement<D> {
  /** 1 = modification pas encore envoyée à Supabase, 0 = déjà synchronisée. */
  a_envoyer: 0 | 1
}

/** Ancienne version gardée sur l'appareil quand une version plus récente l'a remplacée. */
export interface VersionArchivee extends Enregistrement {
  numero?: number
  motif: string
  archive_le: string
}

// Identifiants fixes des enregistrements « uniques » (il n'en existe qu'un seul).
// Fixes pour que le téléphone et le PC modifient bien le même enregistrement.
export const ID_PROFIL = '00000000-0000-4000-8000-000000000001'
export const ID_OBJECTIFS = '00000000-0000-4000-8000-000000000002'
export const ID_ETAT_SAUVEGARDES = '00000000-0000-4000-8000-000000000003'
export const ID_REGLAGES_PROGRAMME = '00000000-0000-4000-8000-000000000004'
