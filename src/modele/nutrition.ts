// Calculs de nutrition : besoins estimés, valeurs d'une recette, filtres de recettes.
// Tout est ESTIMÉ (marge d'erreur 10 à 15 %) : à présenter comme tel.
import { ALIMENTS, ALIMENTS_EXCLUS, type Aliment } from '../contenu/aliments'
import type { Envie, Recette, Repas } from '../contenu/recettes'
import type { Profil } from './profil'
import { arrondir } from '../utils/nombres'

// ---------- Besoins estimés (docs/conception.md, « Stratégie nutritionnelle ») ----------

export interface Besoins {
  metabolismeBase: number
  entretien: number
  cibleMin: number
  cibleMax: number
  proteinesMin: number
  proteinesMax: number
}

/** Métabolisme de base, formule de Mifflin-St Jeor. */
export function mifflinStJeor(poidsKg: number, tailleCm: number, age: number, sexe: 'femme' | 'homme'): number {
  return 10 * poidsKg + 6.25 * tailleCm - 5 * age + (sexe === 'femme' ? -161 : 5)
}

/**
 * Besoins estimés : entretien = métabolisme de base × facteur d'activité ;
 * cible = déficit de 15 à 20 % ; protéines 1,6 à 1,8 g par kg.
 */
export function estimerBesoins(profil: Profil, poidsKg: number): Besoins | null {
  if (!profil.taille_cm || !profil.age || !poidsKg) return null
  const mb = mifflinStJeor(poidsKg, profil.taille_cm, profil.age, profil.sexe)
  const entretien = mb * profil.facteur_activite
  const arrondi50 = (n: number) => Math.round(n / 50) * 50
  return {
    metabolismeBase: Math.round(mb),
    entretien: Math.round(entretien),
    cibleMin: arrondi50(entretien * 0.8),
    cibleMax: arrondi50(entretien * 0.85),
    proteinesMin: Math.round(poidsKg * 1.6),
    proteinesMax: Math.round(poidsKg * 1.8),
  }
}

// ---------- Aliments ----------

/** Bibliothèque complète : aliments de base, modifiés ou complétés par mes propres aliments. */
export function fusionnerAliments(perso: Aliment[]): Aliment[] {
  const parId = new Map(ALIMENTS.map((a) => [a.id, a]))
  for (const a of perso) parId.set(a.id, { ...parId.get(a.id), ...a })
  return [...parId.values()]
}

export function indexAliments(liste: Aliment[]): Map<string, Aliment> {
  return new Map(liste.map((a) => [a.id, a]))
}

/** Vrai si le nom contient un aliment exclu (poivron, chou-fleur, aubergine, banane). */
export function contientExclu(texte: string): boolean {
  const t = texte.toLowerCase()
  return ALIMENTS_EXCLUS.some((x) => t.includes(x))
}

// ---------- Valeurs d'une recette ----------

export interface Valeurs {
  kcal: number
  proteines: number
  glucides: number
  lipides: number
  fibres: number
  prix: number
}

export const VALEURS_VIDES: Valeurs = { kcal: 0, proteines: 0, glucides: 0, lipides: 0, fibres: 0, prix: 0 }

export function additionner(a: Valeurs, b: Valeurs, facteur = 1): Valeurs {
  return {
    kcal: a.kcal + b.kcal * facteur,
    proteines: a.proteines + b.proteines * facteur,
    glucides: a.glucides + b.glucides * facteur,
    lipides: a.lipides + b.lipides * facteur,
    fibres: a.fibres + b.fibres * facteur,
    prix: a.prix + b.prix * facteur,
  }
}

/** Valeurs pour UNE portion d'une recette (calories, macros, prix estimé). */
export function valeursPortion(r: Recette, aliments: Map<string, Aliment>): Valeurs {
  let total = VALEURS_VIDES
  for (const ing of r.ingredients) {
    const a = aliments.get(ing.aliment)
    if (!a) continue
    const f = ing.g / 100
    total = additionner(total, {
      kcal: a.kcal * f,
      proteines: a.proteines * f,
      glucides: a.glucides * f,
      lipides: a.lipides * f,
      fibres: a.fibres * f,
      prix: (a.prix_kg * ing.g) / 1000,
    })
  }
  const p = r.portions
  return {
    kcal: Math.round(total.kcal / p),
    proteines: arrondir(total.proteines / p, 1),
    glucides: arrondir(total.glucides / p, 1),
    lipides: arrondir(total.lipides / p, 1),
    fibres: arrondir(total.fibres / p, 1),
    prix: arrondir(total.prix / p, 2),
  }
}

export function estVegetarienne(r: Recette, aliments: Map<string, Aliment>): boolean {
  return r.ingredients.every((i) => !aliments.get(i.aliment)?.animal)
}

/** La recette utilise-t-elle un aliment marqué « très approximatif » ? */
export function contientApproximatif(r: Recette, aliments: Map<string, Aliment>): boolean {
  return r.ingredients.some((i) => aliments.get(i.aliment)?.tresApproximatif)
}

// ---------- Filtres ----------

export interface Filtres {
  texte: string
  repas: Repas | null
  envies: Envie[]
  tempsMax: number | null
  vegetarien: boolean
  favorisSeulement: boolean
  /** Ingrédients que j'ai sous la main (vide = pas de filtre). */
  disponibles: string[]
}

export const FILTRES_VIDES: Filtres = {
  texte: '',
  repas: null,
  envies: [],
  tempsMax: null,
  vegetarien: false,
  favorisSeulement: false,
  disponibles: [],
}

/** Ingrédients qui manquent (hors basiques : huile, épices…) par rapport à ce que j'ai. */
export function ingredientsManquants(r: Recette, disponibles: string[], aliments: Map<string, Aliment>): string[] {
  const dispo = new Set(disponibles)
  return r.ingredients.filter((i) => !aliments.get(i.aliment)?.basique && !dispo.has(i.aliment)).map((i) => i.aliment)
}

export interface ResultatRecherche {
  recette: Recette
  manquants: string[]
}

/** Applique les filtres. Avec des ingrédients disponibles : tri par nombre d'ingrédients manquants. */
export function filtrerRecettes(
  recettes: Recette[],
  f: Filtres,
  favoris: Set<string>,
  aliments: Map<string, Aliment>,
): ResultatRecherche[] {
  const texte = f.texte.trim().toLowerCase()
  const resultats = recettes
    .filter((r) => !texte || r.nom.toLowerCase().includes(texte) || r.ingredients.some((i) => aliments.get(i.aliment)?.nom.toLowerCase().includes(texte)))
    .filter((r) => !f.repas || r.repas.includes(f.repas))
    .filter((r) => f.envies.every((e) => (e === 'rapide' ? r.temps_min <= 20 || r.envies.includes('rapide') : r.envies.includes(e))))
    .filter((r) => !f.tempsMax || r.temps_min <= f.tempsMax)
    .filter((r) => !f.vegetarien || estVegetarienne(r, aliments))
    .filter((r) => !f.favorisSeulement || favoris.has(r.id))
    .map((r) => ({ recette: r, manquants: f.disponibles.length ? ingredientsManquants(r, f.disponibles, aliments) : [] }))

  if (f.disponibles.length) {
    // On garde les recettes réalisables avec au plus 2 ingrédients à acheter.
    return resultats.filter((x) => x.manquants.length <= 2).sort((a, b) => a.manquants.length - b.manquants.length)
  }
  return resultats.sort((a, b) => Number(favoris.has(b.recette.id)) - Number(favoris.has(a.recette.id)))
}

// ---------- Identifiants stables ----------

/**
 * Identifiant UUID toujours identique pour une même clé (ex. « favori:porridge_pomme »).
 * Ainsi le téléphone et le PC modifient le même enregistrement.
 */
export function idStable(cle: string): string {
  // Deux empreintes FNV-1a 64 bits (avec des graines différentes) → 128 bits.
  const fnv = (graine: bigint) => {
    let h = 0xcbf29ce484222325n ^ graine
    for (const c of new TextEncoder().encode(cle)) {
      h ^= BigInt(c)
      h = (h * 0x100000001b3n) & 0xffffffffffffffffn
    }
    return h.toString(16).padStart(16, '0')
  }
  const hex = (fnv(0n) + fnv(0x9e3779b97f4a7c15n)).split('')
  hex[12] = '5' // version
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) // variante
  const s = hex.join('')
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`
}
