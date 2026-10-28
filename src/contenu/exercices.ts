// Exercices des séances de musculation A et B (docs/conception.md, « Musculation (débutante) »).
// Échauffement 10 min + mobilité ; 3 séries de 10 à 12 répétitions ; 90 s de repos ;
// garder 2 à 3 répétitions « en réserve ».

export type TypeSeance = 'A' | 'B'

export interface Exercice {
  id: string
  nom: string
  seance: TypeSeance
  /** « reps » : répétitions (avec charge) ; « secondes » : exercice tenu (gainage, équilibre). */
  mesure: 'reps' | 'secondes'
  /** Exercice avec une charge à noter (kg). */
  avecCharge: boolean
  /** Plus petite charge à ajouter quand la progression est validée. */
  incrementKg: number
  /** Objectif : de « min » à « max » répétitions (ou secondes). */
  min: number
  max: number
  /** Sollicite les jambes (genou, cheville) : attention particulière. */
  jambes: boolean
  /** Fait partie de la version courte (« jour de fatigue »). */
  versionCourte: boolean
  consignes: string[]
}

export const ECHAUFFEMENT = [
  '10 minutes de vélo ou d’elliptique, sans forcer.',
  'Mobilité : cercles de chevilles, de hanches et d’épaules, 10 de chaque côté.',
  'Première série de chaque exercice : plus légère, pour s’échauffer.',
]

export const REGLES_SEANCE = {
  series: 3,
  seriesCourte: 2,
  seriesSemaineLegere: 2,
  reposSecondes: 90,
}

export const EXERCICES: Exercice[] = [
  // ---------- Séance A ----------
  {
    id: 'presse_cuisses',
    nom: 'Presse à cuisses',
    seance: 'A',
    mesure: 'reps',
    avecCharge: true,
    incrementKg: 2.5,
    min: 10,
    max: 12,
    jambes: true,
    versionCourte: true,
    consignes: [
      'Amplitude confortable : ne descends pas plus bas que ce que ton genou accepte sans gêne.',
      'Pieds à largeur de hanches, genoux dans l’axe des pieds (ils ne rentrent pas vers l’intérieur).',
      'Pousse avec les talons, ne verrouille pas complètement les genoux en haut.',
    ],
  },
  {
    id: 'hip_thrust',
    nom: 'Hip thrust (machine ou barre)',
    seance: 'A',
    mesure: 'reps',
    avecCharge: true,
    incrementKg: 2.5,
    min: 10,
    max: 12,
    jambes: true,
    versionCourte: false,
    consignes: [
      'Haut du dos appuyé sur le banc, pieds à plat, tibias verticaux en haut du mouvement.',
      'Monte en serrant les fessiers, sans cambrer le bas du dos. Tiens 1 seconde en haut.',
    ],
  },
  {
    id: 'tirage_vertical',
    nom: 'Tirage vertical à la poulie',
    seance: 'A',
    mesure: 'reps',
    avecCharge: true,
    incrementKg: 2.5,
    min: 10,
    max: 12,
    jambes: false,
    versionCourte: true,
    consignes: [
      'Tire la barre vers le haut de la poitrine, coudes vers le bas, poitrine sortie.',
      'Remonte lentement, sans laisser les épaules monter vers les oreilles.',
    ],
  },
  {
    id: 'developpe_poitrine_machine',
    nom: 'Développé poitrine à la machine',
    seance: 'A',
    mesure: 'reps',
    avecCharge: true,
    incrementKg: 2.5,
    min: 10,
    max: 12,
    jambes: false,
    versionCourte: true,
    consignes: [
      'Poignées à hauteur du milieu de la poitrine, omoplates serrées contre le dossier.',
      'Pousse sans verrouiller les coudes, reviens en contrôlant.',
    ],
  },
  {
    id: 'gainage_planche',
    nom: 'Gainage planche',
    seance: 'A',
    mesure: 'secondes',
    avecCharge: false,
    incrementKg: 0,
    min: 20,
    max: 45,
    jambes: false,
    versionCourte: false,
    consignes: [
      'Sur les avant-bras, corps aligné de la tête aux talons, ventre rentré.',
      'Arrête dès que le bas du dos se creuse. Ajoute 5 secondes quand c’est facile.',
    ],
  },
  {
    id: 'equilibre_une_jambe',
    nom: 'Équilibre sur une jambe',
    seance: 'A',
    mesure: 'secondes',
    avecCharge: false,
    incrementKg: 0,
    min: 20,
    max: 45,
    jambes: true,
    versionCourte: false,
    consignes: [
      'Pour la stabilité du genou et de la cheville : chaque jambe, genou légèrement fléchi.',
      'Près d’un support pour te rattraper. Progression : yeux fermés, puis sur un coussin.',
      'Le temps noté est celui de chaque jambe.',
    ],
  },
  // ---------- Séance B ----------
  {
    id: 'souleve_jambes_tendues',
    nom: 'Soulevé de terre jambes tendues aux haltères',
    seance: 'B',
    mesure: 'reps',
    avecCharge: true,
    incrementKg: 1,
    min: 10,
    max: 12,
    jambes: true,
    versionCourte: true,
    consignes: [
      'Genoux légèrement fléchis (pas verrouillés), dos droit tout le long.',
      'Descends les haltères le long des cuisses en poussant les fesses en arrière, jusqu’à sentir l’arrière des cuisses.',
      'La charge notée est celle d’UN haltère.',
    ],
  },
  {
    id: 'leg_curl',
    nom: 'Leg curl (arrière des cuisses)',
    seance: 'B',
    mesure: 'reps',
    avecCharge: true,
    incrementKg: 2.5,
    min: 10,
    max: 12,
    jambes: true,
    versionCourte: false,
    consignes: [
      'Règle la machine pour que ton genou soit aligné avec l’axe de rotation.',
      'Mouvement lent, surtout au retour. Arrête si le genou tire.',
    ],
  },
  {
    id: 'rowing_assis',
    nom: 'Rowing assis à la poulie',
    seance: 'B',
    mesure: 'reps',
    avecCharge: true,
    incrementKg: 2.5,
    min: 10,
    max: 12,
    jambes: false,
    versionCourte: true,
    consignes: [
      'Dos droit, tire la poignée vers le nombril en serrant les omoplates.',
      'Ne te penche pas en arrière pour tirer plus lourd.',
    ],
  },
  {
    id: 'developpe_epaules',
    nom: 'Développé épaules aux haltères, assise',
    seance: 'B',
    mesure: 'reps',
    avecCharge: true,
    incrementKg: 1,
    min: 10,
    max: 12,
    jambes: false,
    versionCourte: true,
    consignes: [
      'Dos bien calé contre le dossier, haltères à hauteur des oreilles au départ.',
      'Pousse vers le haut sans cambrer. La charge notée est celle d’UN haltère.',
    ],
  },
  {
    id: 'abduction_hanche',
    nom: 'Abduction de hanche à la machine',
    seance: 'B',
    mesure: 'reps',
    avecCharge: true,
    incrementKg: 2.5,
    min: 10,
    max: 12,
    jambes: true,
    versionCourte: false,
    consignes: ['Écarte les jambes en contrôlant, tiens 1 seconde, reviens lentement sans laisser claquer les plaques.'],
  },
  {
    id: 'gainage_lateral',
    nom: 'Gainage latéral',
    seance: 'B',
    mesure: 'secondes',
    avecCharge: false,
    incrementKg: 0,
    min: 15,
    max: 40,
    jambes: false,
    versionCourte: false,
    consignes: [
      'Sur l’avant-bras, corps aligné, hanches hautes. Le temps noté est celui de chaque côté.',
      'Version plus facile : genoux au sol.',
    ],
  },
]

export function exercicesDe(type: TypeSeance, courte = false): Exercice[] {
  return EXERCICES.filter((e) => e.seance === type && (!courte || e.versionCourte))
}

export function exercice(id: string): Exercice | undefined {
  return EXERCICES.find((e) => e.id === id)
}
