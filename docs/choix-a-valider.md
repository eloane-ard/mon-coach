# Choix faits sans toi, à relire

Comme convenu le 28/10/2026, j'ai codé les versions V1 à V6 à la suite. Quand une information manquait,
j'ai fait un choix fidèle à `docs/conception.md`. Les voici. Dis-moi ceux que tu veux changer :
chacun se modifie facilement.

## ⚠️ À regarder en priorité

1. **Budget des courses.** Avec mes prix estimés (marques distributeur Leclerc), un planning complet
   (3 repas + 1 collation par jour, ~1 950 kcal et ~115 g de protéines par jour) coûte **environ 33 à 38 €
   par semaine**, au-dessus de ton objectif de 20 à 25 €. Je n'ai pas modifié ton objectif : l'appli affiche
   l'écart. Pistes possibles (à toi de choisir) :
   - corriger les prix avec tes vrais tickets (Nutrition → un aliment → prix au kilo) : ils sont peut-être plus bas ;
   - privilégier les recettes les moins chères (lentilles, œufs, pâtes au thon) ;
   - revoir le budget, ou ne compter que les repas faits à la maison.
2. **Portions ajustées.** Pour atteindre tes repères (1 900 à 2 000 kcal), le planning peut proposer
   1,25 ou 1,5 portion de plat certains jours.
3. **Restes du soir pour le midi.** Chaque plat est cuisiné le soir pour 2 portions, et la 2ᵉ devient le
   déjeuner du lendemain : c'est pratique les jours d'école, et ce n'est pas du batch cooking. Le dîner du dimanche
   fait le déjeuner du lundi. Le planning peut être modifié repas par repas.

## Sport

- **Semaine 1** = semaine du jeudi 29/10/2026 (date de reprise). Les jours avant le 29/10 ne comptent pas.
  Modifiable dans Paramètres → Profil.
- **Musculation mardi et jeudi** : l'appli propose A ou B selon la dernière séance faite. Une séance ratée
  se refait donc à la séance suivante (A puis A).
- **Fractionné (étapes 2 et 3) placé le vendredi** : les deux séances de muscu (mardi, jeudi) travaillent les
  jambes, donc lundi et mercredi sont des veilles de séance de jambes. Le fractionné du vendredi reste optionnel ;
  la version fatigue est une marche active de 30 min.
- **Étape 3** : sortie facile de 35 min en semaines 7 et 8, puis 40 min. Le fractionné garde la même forme
  (6 × 1 min) : on le fera évoluer ensemble selon tes résultats.
- **Version courte** des séances de muscu : 3 exercices, 2 séries.
  - A : presse à cuisses, tirage vertical, développé poitrine.
  - B : soulevé de terre jambes tendues, rowing, développé épaules.
- **Exercices tenus** (gainage, équilibre) : objectif en secondes (20 à 45 s ; gainage latéral 15 à 40 s),
  +5 s quand toutes les séries atteignent le maximum.
- **Plus petite charge ajoutée** : 2,5 kg aux machines, 1 kg aux haltères (charge d'un haltère).
- **Pas de progression proposée** après une version courte, une semaine légère ou une gêne au genou supérieure à 3/10.
- **Semaine légère conseillée** après 4 semaines normales (tu choisis de la faire ou non).

## Mesures

- **Sources** : une source par groupe de mesures (poids, mensurations, composition), gardée pour chaque valeur.
  Les valeurs de masse grasse et de masse musculaire sont toujours affichées comme des **estimations**.
- **Masse grasse en %** et **masse musculaire en kg** (ce qu'affichent la plupart des balances impédancemètres).
- **Tour de cuisse et de bras** : un seul côté. Je te conseille de prendre toujours le même (par exemple le droit).

## Nutrition et recettes

- **73 aliments** : valeurs Ciqual arrondies (pour 100 g) et **prix estimés** fin 2026. Tout est modifiable dans l'appli.
- **40 recettes** classiques : 7 petits-déjeuners, 28 plats (dont 5 seulement pour le dîner), 5 collations.
  - Les plats de plus de 30 min (au four) ne sont proposés que le soir du week-end.
  - Les recettes ne se modifient pas encore dans l'appli : dis-moi ce que tu veux ajouter ou changer.
- **Petit-déjeuner « plaisir »** (biscuits + skyr + fruit) : une fois par semaine, le dimanche.
- **Douceur** (chocolat noir) : proposée environ un jour sur deux en collation.
- **Estimation actualisée** des besoins (Nutrition) avec ton poids moyen actuel. Elle ne remplace **jamais** tes
  objectifs automatiquement.

## Technique et données

- **Connexion par e-mail et mot de passe** (décision d'Eloane du 30/10/2026) : Supabase ne permet plus de modifier
  les modèles d'e-mail sur les nouveaux projets gratuits, donc pas de code à 6 chiffres. « Confirm email » est désactivé,
  et les inscriptions sont fermées après la création du compte. Mot de passe gardé dans le trousseau iCloud.

- **Une seule table « enregistrements »** dans Supabase, avec le contenu au format JSON. Avantage : ajouter un champ
  dans l'appli ne demande jamais de modifier la base, donc aucune synchronisation ne peut échouer pour ça.
- **Historique de toutes les versions** dans Supabase (`enregistrements_historique`) et sur l'appareil.
- **Mises à jour de l'appli** : un bandeau « Mettre à jour » apparaît, la mise à jour n'est jamais forcée
  (pour ne pas couper une saisie). Ce n'est pas une notification.
- **Séance de muscu en cours** : gardée en brouillon sur l'appareil si l'appli se ferme. Tu la retrouves en revenant.
- **Test de restauration** : automatique chaque mois, dans une base PostgreSQL de test créée puis jetée par
  GitHub Actions (pas besoin d'un 2ᵉ projet Supabase). Procédure manuelle en plus dans `docs/sauvegardes.md`.
- **Photos** : réduites à 1 600 px (JPEG) pour ne pas remplir le téléphone.
