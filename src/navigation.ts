// Liste des espaces de l'appli, dans l'ordre validé (voir CLAUDE.md, « Navigation cible »).
// « version » indique dans quelle version l'espace sera construit :
// tant qu'il n'est pas prêt, l'appli affiche « Bientôt disponible ».

export type Espace = {
  chemin: string
  titre: string
  icone: string
  version: number
  resume: string
}

/** Version en cours de construction. Les espaces de versions ultérieures sont « à venir ». */
export const VERSION_EN_COURS = 3

export const ESPACES: Espace[] = [
  { chemin: '/', titre: 'Accueil', icone: '🏠', version: 5, resume: 'Tableau de bord, prochaine séance, régularité.' },
  { chemin: '/programme', titre: 'Mon programme sportif', icone: '📅', version: 2, resume: 'Semaine type, prochaine séance, ajustements.' },
  { chemin: '/course', titre: 'Course à pied', icone: '🏃‍♀️', version: 2, resume: 'Distance, temps, allure calculée, sensations.' },
  { chemin: '/musculation', titre: 'Musculation', icone: '🏋️‍♀️', version: 2, resume: 'Séances A/B, charges, séries, historique.' },
  { chemin: '/nutrition', titre: 'Nutrition', icone: '🥗', version: 3, resume: 'Besoins estimés, bibliothèque d’aliments.' },
  { chemin: '/recettes', titre: 'Recettes', icone: '📖', version: 3, resume: 'Bibliothèque, filtres, favoris.' },
  { chemin: '/planning-repas', titre: 'Planning des repas', icone: '🗓️', version: 4, resume: 'Menu sur 7 jours, alternatives.' },
  { chemin: '/courses', titre: 'Liste de courses', icone: '🛒', version: 4, resume: 'Liste automatique, budget Leclerc.' },
  { chemin: '/evolution', titre: 'Évolution physique', icone: '📏', version: 1, resume: 'Poids, mensurations, estimations.' },
  { chemin: '/statistiques', titre: 'Historique et statistiques', icone: '📈', version: 5, resume: 'Graphiques de 7 jours à depuis le début.' },
  { chemin: '/parametres', titre: 'Paramètres', icone: '⚙️', version: 1, resume: 'Profil, objectifs, sauvegardes.' },
]

/** Un espace est disponible quand sa version est déjà construite. */
export function estDisponible(espace: Espace, versionEnCours = VERSION_EN_COURS): boolean {
  return espace.version <= versionEnCours
}

/** Retrouve l'espace correspondant à une adresse (ex. « /course » ou « /course/saisie »). */
export function espaceDuChemin(chemin: string): Espace | undefined {
  if (chemin === '/' || chemin === '') return ESPACES[0]
  return ESPACES.filter((e) => e.chemin !== '/').find((e) => chemin === e.chemin || chemin.startsWith(`${e.chemin}/`))
}

/** Titres des sous-pages (affichés dans l'en-tête, avec un bouton retour). */
export const SOUS_PAGES: Record<string, string> = {
  '/evolution/saisie': 'Mesure',
  '/programme/autre': 'Autre activité',
  '/course/saisie': 'Course',
  '/musculation/seance': 'Séance',
  '/nutrition/aliment': 'Aliment',
  '/parametres/compte': 'Compte',
  '/parametres/profil': 'Profil',
  '/parametres/objectifs': 'Objectifs',
  '/parametres/sauvegardes': 'Sauvegardes',
}
