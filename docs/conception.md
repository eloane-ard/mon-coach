# Mon coach sport & nutrition — Conception (Étape 2)

Validée le 28 octobre 2026 avec Eloane.

## Point de départ et ordre de construction

Objectif : perdre 6 à 7 kg de masse grasse en 4 à 6 mois en gardant ses muscles, avec 4 à 5 séances par semaine et une appli 100 % gratuite.

| Élément | Ce que je sais |
| --- | --- |
| Profil | 20 ans, 1m73, 77 kg (poids passé entre 72 et 85 kg) |
| Santé | Fracture cheville (il y a ~5 ans), fracture genou droit (il y a ~1 an), instabilité variable, plusieurs mois de kiné |
| Course | 4,16 km en ~30 min avec quelques courtes pauses, ~7'30/km, suivi Strava |
| Muscu | Débutante, reprise le 29/10/2026 chez On Air, 5 ans de volley avant |
| Semaine | École lundi et mardi (8h–18h), travail en horaires variables le reste du temps, séances le soir |
| Sommeil | 7h30 à 9h, qualité variable |
| Alimentation | 3 repas, petit-déj en gâteaux industriels, grignotage sucré, 30 min de cuisine en semaine, pas de batch cooking, Leclerc, 20–25 €/semaine |
| N'aime pas | Poivron, chou-fleur, aubergine, banane |
| Appli | iPhone + PC Windows, habituée à Claude Code, 100 % gratuit, 10–15 min/jour max, pas de notifications |

Ordre de construction validé :

1. **V1 – Fondations** : base de données, sauvegarde, export, restauration, profil, mesures.
2. **V2 – Sport** : programme, séances de muscu, suivi des courses.
3. **V3 – Recettes** : bibliothèque, filtres, favoris.
4. **V4 – Menus et courses** : planning 7 jours, liste automatique, budget.
5. **V5 – Graphiques et tableau de bord**.
6. **V6 – Photos de progression et bilans**.

## Organisation sportive initiale

Deux séances de muscu en corps complet et deux à trois courses faciles par semaine, avec une progression lente pour protéger le genou et la cheville.

| Jour | Séance | Version « jour de fatigue » |
| --- | --- | --- |
| Lundi | Course facile 30 min | 20 min facile |
| Mardi | Muscu A (1h) | 3 exercices, 2 séries (30 min) |
| Mercredi | Course facile 30 min | 20 min facile |
| Jeudi | Muscu B (1h) | 3 exercices, 2 séries |
| Vendredi | Course optionnelle | Marche active 30 min |
| Samedi, dimanche | Repos, marche si envie | — |

### Course à pied

Eloane court déjà presque en continu : pas d'alternance course/marche. On vise d'abord 30 minutes sans aucune pause en ralentissant un peu (allure où l'on peut parler), puis on ajoute du fractionné.

1. **Semaines 1–3** : 30 min en continu à allure facile (vers 7'45–8'00/km). Besoin de souffler = ralentir au lieu de s'arrêter.
2. **Semaines 4–6** : une course par semaine devient du fractionné léger : 10 min d'échauffement, 6 × (1 min un peu plus vite + 2 min lent), 5 min de retour au calme. Les autres restent faciles.
3. **Semaines 7 et plus** : allonger la sortie facile (35 puis 40 min) et faire évoluer le fractionné selon les résultats.
4. **Toujours** : une seule séance de fractionné par semaine maximum, jamais la veille d'une séance de jambes.

Genou : terrain plat au début, peu de descentes, bonnes chaussures. Étape trop dure = on la refait une semaine de plus.

### Musculation (débutante)

Échauffement de 10 min (vélo ou elliptique) + mobilité. 3 séries de 10 à 12 répétitions, 90 s de repos, en gardant 2 à 3 répétitions « en réserve ».

| Séance A | Séance B |
| --- | --- |
| Presse à cuisses (amplitude confortable) | Soulevé de terre jambes tendues aux haltères |
| Hip thrust (machine ou barre) | Leg curl (arrière des cuisses) |
| Tirage vertical à la poulie | Rowing assis à la poulie |
| Développé poitrine à la machine | Développé épaules aux haltères, assise |
| Gainage planche | Abduction de hanche à la machine |
| Équilibre sur une jambe (stabilité genou et cheville) | Gainage latéral |

- **Charges** : la première séance sert à trouver une charge où la dernière répétition est difficile mais propre.
- **Progression** (double progression) : 3 × 12 réussis proprement = on ajoute la plus petite charge possible (1 à 2,5 kg).
- **Genou** : pas de sauts ni de leg extension lourd au départ. Douleur > 3/10 ou instabilité = arrêt de l'exercice et note dans l'appli.
- Reprise des jambes à faire valider par le kiné ou le médecin.

### Récupération et séances manquées

- Une séance manquée n'est pas rattrapée en doublant : on reprend à la suivante.
- Séance de muscu ratée : on refait la même à la séance suivante (A puis A au lieu de A puis B).
- Toutes les 4 à 6 semaines, une semaine plus légère (moins de séries).
- Mauvais sommeil ou grosse fatigue : version courte plutôt que rien.

## Stratégie nutritionnelle

Point de départ estimé : environ 1 900 à 2 000 kcal par jour, riches en protéines, pour une perte de 0,3 à 0,5 kg par semaine. Estimations à recalibrer après 3 à 4 semaines.

Métabolisme de base (Mifflin-St Jeor, femme) : 10 × 77 + 6,25 × 173 − 5 × 20 − 161 ≈ 1 590 kcal. Facteur d'activité ~1,5 → entretien ~2 300 à 2 450 kcal. Déficit de 15 à 20 % → 1 900 à 2 000 kcal.

| Apport | Repère quotidien | Pourquoi |
| --- | --- | --- |
| Protéines | 120 à 140 g (1,6 à 1,8 g/kg) | Préserver et construire le muscle, satiété |
| Lipides | 60 à 75 g | Hormones, satiété |
| Glucides | 200 à 230 g (le reste) | Énergie pour la course et la muscu |
| Fibres | 25 à 30 g | Satiété, digestion |
| Eau | ~2 L + 0,5 L par heure de sport | Récupération, performance |

Limites : marge d'erreur de 10 à 15 %. Le juge est la moyenne de poids sur la semaine et le tour de taille, pas une pesée isolée. Ce ne sont pas des conseils d'un diététicien ou d'un médecin.

Leviers prioritaires :

- **Petit-déjeuner** : remplacer la plupart du temps les gâteaux industriels par une option rassasiante (flocons d'avoine + lait + pomme, fromage blanc + muesli, tartines + œufs). Les gâteaux restent possibles de temps en temps.
- **Sucré** : pas d'interdit, une douceur prévue dans la journée et des protéines à chaque repas.
- **Week-end** : sodas et alcool avec modération, comptés dans l'équilibre de la semaine.

Budget 20–25 €/semaine : œufs, lentilles, pois chiches, haricots secs, cuisses de poulet, thon en boîte, fromage blanc, flocons d'avoine, riz, pâtes, légumes surgelés, marques distributeur. Recettes **classiques et variées** uniquement (pas de cuisine ivoirienne), sans poivron, chou-fleur, aubergine ni banane. Pas de batch cooking : recettes de 30 min maximum en semaine.

## Structure de l'application

| Espace | Contenu | Version |
| --- | --- | --- |
| Paramètres | Profil, objectifs, export, restauration, état des sauvegardes | V1 |
| Évolution physique | Poids, mensurations, masse grasse et muscle estimées (bien distinguées) | V1 |
| Mon programme sportif | Semaine type, prochaine séance, ajustements | V2 |
| Musculation | Séance du jour, charges, séries, répétitions, historique par exercice | V2 |
| Course à pied | Date, distance, temps, allure calculée, type, sensations, difficulté, FC | V2 |
| Recettes | Bibliothèque, filtres, favoris | V3 |
| Nutrition | Besoins, bibliothèque d'aliments | V3 |
| Planning des repas | Menu 7 jours, alternatives | V4 |
| Liste de courses | Générée automatiquement, ingrédients regroupés, budget | V4 |
| Accueil | Tableau de bord, régularité, conseils | V5 |
| Historique et statistiques | Graphiques 7 j à depuis le début | V5 |

Saisie rapide : exercices pré-remplis avec les charges précédentes ; course = distance + temps (allure calculée) ; repas = une case « j'ai suivi le plan » ; mensurations toutes les 2 à 4 semaines ; aucune notification.

## Solution technique et conservation des données

Appli web hébergée gratuitement, qui enregistre d'abord sur le téléphone (hors connexion) puis synchronise vers Supabase, avec des sauvegardes automatiques indépendantes. Données présentes à 3 endroits : téléphone, Supabase, copies GitHub.

| Option | Coût | Synchro iPhone/PC | Hors connexion | Risque de perte | Verdict |
| --- | --- | --- | --- | --- | --- |
| Stockage local seul + exports | 0 € | Non | Oui | Élevé | Trop fragile |
| **Appli + Supabase + copies GitHub** | 0 € | Oui | Oui | Faible | **Retenue** |
| Appli + Google Sheets | 0 € | Oui | Limité | Moyen | Lent |
| Appli + Firebase | 0 € | Oui | Oui | Faible | Plus complexe à exporter et restaurer |

Limites : Supabase gratuit = 500 Mo de base, pause après 7 jours sans activité (données conservées), pas de sauvegardes quotidiennes incluses. iPhone : appli à installer sur l'écran d'accueil depuis Safari. Photos : uniquement sur le téléphone, hors sauvegardes de l'appli.

Vérification des sauvegardes : écran « État des sauvegardes », test de restauration mensuel dans un environnement de test avec comparaison des nombres d'enregistrements, export complet et tests de non-régression avant chaque mise à jour.

## Coûts

Coût total : 0 €/mois. Hébergement GitHub Pages ou Cloudflare Pages, base Supabase gratuite, sauvegardes GitHub Actions, adresse gratuite de l'hébergeur. Pas d'IA payante dans l'appli : un bouton « Préparer mon bilan » génère un résumé à coller dans une conversation avec Claude.

## Décisions

- [x] Option retenue : appli + Supabase + copies GitHub.
- [x] Photos : stockées uniquement sur le téléphone.
- [x] Reprise des jambes à faire valider par le kiné ou le médecin.
- [ ] Pesée et premières mensurations (29/10/2026).
