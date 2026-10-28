// Bibliothèque d'aliments : valeurs nutritionnelles POUR 100 g (aliment tel qu'acheté : cru, sec ou égoutté).
//
// SOURCE : valeurs arrondies d'après la table Ciqual de l'Anses (ciqual.anses.fr).
// Elles sont APPROXIMATIVES (variations selon les marques, la cuisson…) :
// la marge d'erreur annoncée dans la conception (10 à 15 %) s'applique.
//
// PRIX : estimations pour des produits marque distributeur chez Leclerc (fin 2026),
// à corriger avec tes tickets de caisse (on peut modifier un aliment dans l'appli).

export type Rayon =
  | 'Fruits et légumes'
  | 'Surgelés'
  | 'Épicerie salée'
  | 'Épicerie sucrée'
  | 'Féculents et céréales'
  | 'Légumes secs et conserves'
  | 'Viandes et poissons'
  | 'Œufs et produits laitiers'
  | 'Matières grasses et condiments'
  | 'Boulangerie'

export interface Aliment {
  id: string
  nom: string
  rayon: Rayon
  kcal: number
  proteines: number
  glucides: number
  lipides: number
  fibres: number
  /** Prix estimé au kilo (ou au litre). */
  prix_kg: number
  /** Taille d'un paquet / d'une unité d'achat, en grammes (pour la liste de courses). */
  conditionnement_g: number
  /** Nom de l'unité d'achat (ex. « boîte de 6 », « paquet de 500 g »). */
  conditionnement: string
  /** Aliment animal (viande, poisson) : sert au filtre « végétarien ». */
  animal?: boolean
  /** Ingrédient de base qu'on a presque toujours (huile, épices…) : ignoré pour « ingrédients disponibles ». */
  basique?: boolean
  /** Valeurs plus incertaines que d'habitude. */
  tresApproximatif?: boolean
  source: string
  /** Note éventuelle (ex. « poids avec os »). */
  note?: string
}

const CIQUAL = 'Ciqual (Anses), valeurs arrondies'

type Ligne = [
  id: string,
  nom: string,
  rayon: Rayon,
  kcal: number,
  proteines: number,
  glucides: number,
  lipides: number,
  fibres: number,
  prix_kg: number,
  conditionnement_g: number,
  conditionnement: string,
  options?: Partial<Aliment>,
]

const LIGNES: Ligne[] = [
  // ---------- Féculents et céréales ----------
  ['flocons_avoine', 'Flocons d’avoine', 'Féculents et céréales', 370, 13.5, 59, 7, 10, 2, 500, 'paquet de 500 g'],
  ['muesli', 'Muesli sans sucres ajoutés', 'Féculents et céréales', 365, 10, 60, 7, 8, 4, 750, 'paquet de 750 g'],
  ['riz', 'Riz blanc (cru)', 'Féculents et céréales', 350, 7, 77.5, 0.6, 1.4, 1.7, 1000, 'paquet de 1 kg'],
  ['pates', 'Pâtes (crues)', 'Féculents et céréales', 355, 12.5, 70, 1.5, 3, 1.5, 500, 'paquet de 500 g'],
  ['pates_completes', 'Pâtes complètes (crues)', 'Féculents et céréales', 345, 13, 63, 2, 8, 2.2, 500, 'paquet de 500 g'],
  ['semoule', 'Semoule de blé (crue)', 'Féculents et céréales', 360, 12, 72, 1.5, 3.5, 1.8, 1000, 'paquet de 1 kg'],
  ['farine', 'Farine de blé', 'Féculents et céréales', 345, 10, 72, 1.2, 3, 0.9, 1000, 'paquet de 1 kg', { basique: true }],
  ['pommes_de_terre', 'Pommes de terre', 'Fruits et légumes', 80, 2, 17, 0.1, 1.8, 1.2, 2500, 'filet de 2,5 kg'],
  ['patate_douce', 'Patate douce', 'Fruits et légumes', 86, 1.6, 20, 0.1, 3, 2.5, 1000, '1 kg'],
  // ---------- Boulangerie ----------
  ['pain_complet', 'Pain complet', 'Boulangerie', 245, 9, 43, 3, 7, 3.5, 500, 'pain de 500 g'],
  ['pain_mie_complet', 'Pain de mie complet', 'Boulangerie', 255, 9, 44, 4, 6, 3.8, 500, 'paquet de 500 g'],
  ['tortillas', 'Tortillas de blé (wraps)', 'Boulangerie', 310, 8.5, 52, 7, 3, 5, 370, 'paquet de 6'],
  // ---------- Légumes secs et conserves ----------
  ['lentilles_vertes', 'Lentilles vertes (sèches)', 'Légumes secs et conserves', 330, 24, 48, 1.5, 17, 2.6, 500, 'paquet de 500 g'],
  ['lentilles_corail', 'Lentilles corail (sèches)', 'Légumes secs et conserves', 340, 24, 53, 1.5, 11, 3, 500, 'paquet de 500 g'],
  ['pois_chiches', 'Pois chiches en boîte (égouttés)', 'Légumes secs et conserves', 130, 7, 16, 2.5, 5, 2.6, 265, 'boîte de 400 g (265 g égouttés)'],
  ['haricots_rouges', 'Haricots rouges en boîte (égouttés)', 'Légumes secs et conserves', 115, 8, 14, 0.6, 7, 2.6, 250, 'boîte de 400 g (250 g égouttés)'],
  ['mais', 'Maïs en boîte (égoutté)', 'Légumes secs et conserves', 95, 3, 17, 1.5, 3, 3.5, 285, 'boîte de 285 g'],
  ['tomates_concassees', 'Tomates concassées en boîte', 'Légumes secs et conserves', 25, 1.2, 4, 0.2, 1.2, 2, 400, 'boîte de 400 g'],
  ['thon', 'Thon au naturel en boîte (égoutté)', 'Légumes secs et conserves', 115, 26, 0, 1, 0, 11.5, 140, 'boîte de 140 g égouttés', { animal: true }],
  ['sardines', 'Sardines à l’huile (égouttées)', 'Légumes secs et conserves', 210, 24, 0, 13, 0, 9, 95, 'boîte de 95 g égouttés', { animal: true }],
  ['compote', 'Compote sans sucres ajoutés', 'Épicerie sucrée', 55, 0.3, 12, 0.1, 1.5, 3, 400, 'pack de 4 × 100 g'],
  // ---------- Viandes et poissons ----------
  [
    'cuisses_poulet',
    'Cuisses de poulet (avec os)',
    'Viandes et poissons',
    120,
    13,
    0,
    7.5,
    0,
    4.5,
    1000,
    'barquette de 1 kg',
    { animal: true, tresApproximatif: true, note: 'Valeurs pour 100 g achetés, os compris (environ 70 % mangeable).' },
  ],
  ['filet_poulet', 'Filet de poulet', 'Viandes et poissons', 115, 23, 0, 2, 0, 11, 400, 'barquette de 400 g', { animal: true }],
  ['escalope_dinde', 'Escalope de dinde', 'Viandes et poissons', 110, 24, 0, 1.5, 0, 10, 250, 'barquette de 2 (250 g)', { animal: true }],
  ['steak_hache', 'Steak haché 5 % MG', 'Viandes et poissons', 125, 21, 0, 5, 0, 9.5, 250, 'barquette de 2 × 125 g', { animal: true }],
  ['jambon', 'Jambon blanc découenné', 'Viandes et poissons', 110, 20, 1, 3, 0, 9, 160, 'paquet de 4 tranches', { animal: true }],
  ['colin', 'Filets de colin (surgelés)', 'Surgelés', 80, 18, 0, 0.8, 0, 8, 400, 'sachet de 400 g', { animal: true }],
  // ---------- Œufs et produits laitiers ----------
  ['oeufs', 'Œufs', 'Œufs et produits laitiers', 140, 12.5, 0.5, 10, 0, 4, 360, 'boîte de 6 (≈ 60 g l’œuf)'],
  ['lait', 'Lait demi-écrémé', 'Œufs et produits laitiers', 46, 3.3, 4.8, 1.6, 0, 1, 1000, 'bouteille de 1 L'],
  ['fromage_blanc_0', 'Fromage blanc 0 %', 'Œufs et produits laitiers', 46, 7.5, 4, 0.1, 0, 2.2, 1000, 'pot de 1 kg'],
  ['fromage_blanc_3', 'Fromage blanc 3 %', 'Œufs et produits laitiers', 75, 7, 4, 3.2, 0, 2.5, 1000, 'pot de 1 kg'],
  ['yaourt_nature', 'Yaourt nature', 'Œufs et produits laitiers', 50, 4.3, 5, 1.5, 0, 2, 500, 'pack de 4 × 125 g'],
  ['skyr', 'Skyr nature', 'Œufs et produits laitiers', 60, 10, 4, 0.2, 0, 4, 450, 'pot de 450 g'],
  ['emmental', 'Emmental râpé', 'Œufs et produits laitiers', 380, 28, 0.5, 29, 0, 8, 200, 'sachet de 200 g'],
  ['mozzarella', 'Mozzarella', 'Œufs et produits laitiers', 250, 18, 1, 19, 0, 8, 125, 'boule de 125 g'],
  ['feta', 'Feta', 'Œufs et produits laitiers', 270, 15, 1, 22, 0, 10, 200, 'bloc de 200 g'],
  ['creme_legere', 'Crème fraîche légère 15 %', 'Œufs et produits laitiers', 160, 2.8, 4, 15, 0, 4, 200, 'pot de 20 cl'],
  ['beurre', 'Beurre', 'Matières grasses et condiments', 745, 0.7, 0.6, 82, 0, 9, 250, 'plaquette de 250 g', { basique: true }],
  // ---------- Fruits et légumes ----------
  ['carottes', 'Carottes', 'Fruits et légumes', 36, 0.8, 7.6, 0.3, 2.6, 1.3, 1000, 'sachet de 1 kg'],
  ['courgettes', 'Courgettes', 'Fruits et légumes', 16, 1.2, 2, 0.3, 1.1, 2.5, 1000, '1 kg (≈ 3 courgettes)'],
  ['tomates', 'Tomates', 'Fruits et légumes', 19, 0.8, 3, 0.3, 1.2, 2.8, 1000, '1 kg'],
  ['oignons', 'Oignons', 'Fruits et légumes', 40, 1.2, 7.5, 0.2, 1.7, 1.8, 1000, 'filet de 1 kg', { basique: true }],
  ['ail', 'Ail', 'Fruits et légumes', 130, 6, 26, 0.5, 2, 8, 100, 'filet de 3 têtes', { basique: true }],
  ['champignons', 'Champignons de Paris', 'Fruits et légumes', 22, 2.5, 0.5, 0.3, 2, 4.5, 500, 'barquette de 500 g'],
  ['salade', 'Salade verte', 'Fruits et légumes', 14, 1.2, 1.5, 0.2, 1.2, 4, 300, '1 salade'],
  ['concombre', 'Concombre', 'Fruits et légumes', 13, 0.6, 2, 0.1, 0.6, 2.5, 400, '1 concombre'],
  ['poireaux', 'Poireaux', 'Fruits et légumes', 30, 1.7, 4.5, 0.3, 2.5, 2.5, 1000, 'botte de 1 kg'],
  ['potiron', 'Potiron / butternut', 'Fruits et légumes', 35, 1, 7, 0.1, 2, 2, 1500, '1 butternut (≈ 1,5 kg)'],
  ['citron', 'Citron', 'Fruits et légumes', 30, 0.7, 3, 0.3, 1, 3, 500, 'filet de 4'],
  ['pommes', 'Pommes', 'Fruits et légumes', 53, 0.3, 11.5, 0.2, 2, 2.2, 1000, 'sachet de 1 kg (≈ 6 pommes)'],
  ['poires', 'Poires', 'Fruits et légumes', 55, 0.4, 11.5, 0.1, 3, 2.8, 1000, '1 kg'],
  ['clementines', 'Clémentines / oranges', 'Fruits et légumes', 45, 0.8, 9, 0.2, 2, 2.5, 1000, 'filet de 1 kg'],
  // ---------- Surgelés ----------
  ['epinards', 'Épinards (surgelés)', 'Surgelés', 25, 2.8, 1.5, 0.5, 2.3, 2.5, 1000, 'sachet de 1 kg'],
  ['haricots_verts', 'Haricots verts (surgelés)', 'Surgelés', 28, 1.8, 3.5, 0.2, 3.4, 2.2, 1000, 'sachet de 1 kg'],
  ['brocoli', 'Brocoli (surgelé)', 'Surgelés', 30, 2.8, 2.5, 0.4, 2.7, 2.5, 1000, 'sachet de 1 kg'],
  ['petits_pois', 'Petits pois (surgelés)', 'Surgelés', 70, 5.5, 9, 0.4, 5.5, 2.5, 1000, 'sachet de 1 kg'],
  ['legumes_potage', 'Légumes pour potage (surgelés)', 'Surgelés', 30, 1, 5, 0.2, 2, 1.8, 1000, 'sachet de 1 kg'],
  ['fruits_rouges', 'Fruits rouges (surgelés)', 'Surgelés', 45, 1, 7, 0.3, 4.5, 6, 500, 'sachet de 500 g'],
  // ---------- Épicerie ----------
  ['huile_olive', 'Huile d’olive', 'Matières grasses et condiments', 900, 0, 0, 100, 0, 9, 500, 'bouteille de 50 cl', { basique: true }],
  ['huile_colza', 'Huile de colza', 'Matières grasses et condiments', 900, 0, 0, 100, 0, 3, 1000, 'bouteille de 1 L', { basique: true }],
  ['moutarde', 'Moutarde', 'Matières grasses et condiments', 150, 7, 4, 11, 0, 3, 370, 'pot de 370 g', { basique: true }],
  ['vinaigre', 'Vinaigre', 'Matières grasses et condiments', 20, 0, 0.5, 0, 0, 1.5, 500, 'bouteille de 50 cl', { basique: true }],
  ['sauce_soja', 'Sauce soja', 'Épicerie salée', 60, 8, 6, 0, 0, 6, 250, 'bouteille de 25 cl', { basique: true }],
  ['bouillon', 'Bouillon de légumes (cube)', 'Épicerie salée', 250, 10, 20, 15, 0, 12, 100, 'boîte de 10 cubes', { basique: true, tresApproximatif: true }],
  ['epices', 'Épices et herbes (cumin, curry, herbes de Provence…)', 'Épicerie salée', 0, 0, 0, 0, 0, 25, 40, 'pot', { basique: true, note: 'Quantités négligeables : comptées pour 0 kcal.' }],
  ['beurre_cacahuete', 'Beurre de cacahuète', 'Épicerie sucrée', 610, 25, 15, 50, 7, 8, 350, 'pot de 350 g'],
  ['amandes', 'Amandes', 'Épicerie sucrée', 600, 22, 7, 52, 12, 12, 200, 'sachet de 200 g'],
  ['chocolat_noir', 'Chocolat noir 70 %', 'Épicerie sucrée', 570, 8, 33, 43, 11, 9, 200, 'tablette de 200 g'],
  ['miel', 'Miel', 'Épicerie sucrée', 320, 0.4, 81, 0, 0, 8, 250, 'pot de 250 g', { basique: true }],
  ['confiture', 'Confiture', 'Épicerie sucrée', 245, 0.4, 60, 0.1, 1, 3, 370, 'pot de 370 g'],
  ['sucre', 'Sucre', 'Épicerie sucrée', 400, 0, 100, 0, 0, 1.1, 1000, 'paquet de 1 kg', { basique: true }],
  ['cacao', 'Cacao en poudre non sucré', 'Épicerie sucrée', 350, 20, 12, 20, 33, 10, 250, 'boîte de 250 g'],
  ['biscuits', 'Biscuits petit-déjeuner', 'Épicerie sucrée', 450, 8, 68, 15, 6, 6, 400, 'paquet de 400 g'],
]

export const ALIMENTS: Aliment[] = LIGNES.map(
  ([id, nom, rayon, kcal, proteines, glucides, lipides, fibres, prix_kg, conditionnement_g, conditionnement, options]) => ({
    id,
    nom,
    rayon,
    kcal,
    proteines,
    glucides,
    lipides,
    fibres,
    prix_kg,
    conditionnement_g,
    conditionnement,
    source: CIQUAL,
    ...options,
  }),
)

/** Aliments que je n'aime pas : jamais dans mes recettes (CLAUDE.md, V3). */
export const ALIMENTS_EXCLUS = ['poivron', 'chou-fleur', 'chou fleur', 'aubergine', 'banane']

export const RAYONS: Rayon[] = [
  'Fruits et légumes',
  'Surgelés',
  'Viandes et poissons',
  'Œufs et produits laitiers',
  'Féculents et céréales',
  'Boulangerie',
  'Légumes secs et conserves',
  'Épicerie salée',
  'Épicerie sucrée',
  'Matières grasses et condiments',
]
