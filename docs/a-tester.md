# Ce qu'il faut tester, version par version

Coche au fur et à mesure. Si quelque chose ne va pas, décris-moi ce que tu as fait et ce que tu as vu.

## V1 : Fondations (à faire AVANT de saisir de vraies données)

- [ ] L'appli s'installe sur l'écran d'accueil de l'iPhone. Elle s'ouvre en plein écran, et **Paramètres** indique
      « Appli installée ».
- [ ] Connexion avec ton e-mail et ton mot de passe, sur l'iPhone puis sur le PC.
- [ ] **Paramètres → Profil** et **Objectifs** : vérifier les valeurs reprises de la conception, puis **Enregistrer**.
- [ ] **Évolution physique → Nouvelle mesure** : saisir une mesure d'essai avec une virgule (ex. `77,2`).
      La masse grasse apparaît en violet avec « estimation ».
- [ ] **Hors connexion** : mode avion, saisir une mesure, fermer et rouvrir l'appli (la mesure est là),
      remettre le réseau. Dans **Compte**, « en attente d'envoi » repasse à 0.
- [ ] Sur le PC : la mesure apparaît (rafraîchir la page si besoin).
- [ ] Modifier la mesure sur le PC, puis vérifier sur l'iPhone.
- [ ] Supprimer la mesure d'essai : elle disparaît de l'historique.
- [ ] **Paramètres → Sauvegardes → Exporter mes données**. Sur iPhone : « Enregistrer dans Fichiers ».
      La date du dernier export s'affiche.
- [ ] **Restaurer** ce fichier : l'aperçu indique « déjà identiques ». Annuler.
- [ ] La sauvegarde automatique, le ping et le test de restauration ont une coche verte
      (dépôt `mon-coach-sauvegardes`, onglet Actions). La date s'affiche dans l'écran Sauvegardes.

## V2 : Sport

- [ ] **Mon programme sportif** : la semaine affiche les bons jours (course lundi/mercredi, muscu mardi/jeudi).
- [ ] **Commencer la séance A** : consignes visibles, ✓ après chaque série, la minuterie de 1:30 se lance.
- [ ] Fermer l'appli au milieu de la séance puis revenir : la séance est reprise.
- [ ] **Terminer la séance**, puis vérifier que la prochaine séance proposée est B.
- [ ] Séance suivante du même exercice : la charge est pré-remplie, et « +2,5 kg » est proposé après 3 × 12.
- [ ] Gêne au genou à 4 : l'alerte « on arrête cet exercice » s'affiche, et l'exercice est marqué arrêté.
- [ ] **Noter une course** : distance `4,16`, temps `30:00`. L'allure affichée est 7'13"/km.
- [ ] Un jour passé sans séance apparaît « manquée », sans rattrapage proposé.
- [ ] Cocher « semaine légère » : les séances proposent 2 séries.

## V3 : Recettes et nutrition

- [ ] **Recettes** : filtres par repas, envie, temps, favoris. Ajouter une recette en favori (★).
- [ ] « Ce que j'ai dans mes placards » : choisir 4 ou 5 ingrédients. Les recettes faisables passent en premier.
- [ ] Fiche recette : changer le nombre de portions, les quantités suivent.
- [ ] **Nutrition** : les repères et l'estimation actualisée s'affichent.
- [ ] Modifier le prix d'un aliment : il est gardé.
- [ ] Aucune recette avec poivron, chou-fleur, aubergine ou banane.

## V4 : Menus et courses

- [ ] **Planning des repas → Proposer un planning** : 7 jours remplis, moyenne d'environ 1 900 à 2 000 kcal.
- [ ] Le déjeuner de lundi et de mardi s'emporte facilement.
- [ ] **⇄** sur un repas : choisir une autre recette. Les restes du lendemain changent aussi.
- [ ] Toucher ○ : ✓ (suivi), puis ✗ (pas suivi), puis ○.
- [ ] **Liste de courses** : articles regroupés par rayon. Cocher un article fait baisser le ticket estimé.
- [ ] **Copier / partager la liste**, puis la coller dans Notes.

## V5 : Tableau de bord et graphiques

- [ ] **Accueil** : ta semaine (ronds), prochaine séance, repas du jour avec ○/✓, poids et tour de taille.
- [ ] **Historique et statistiques** : changer de période (7 j à « Depuis le début »).
- [ ] Toucher une courbe : la bulle affiche la date et la valeur.
- [ ] Les estimations (masse grasse, masse musculaire) sont en pointillés.
- [ ] « Voir les données » ouvre le tableau des chiffres.

## V6 : Photos et bilans

- [ ] **Évolution physique → Photos** : ajouter une photo de face aujourd'hui.
- [ ] Ajouter une deuxième photo de face plus tard (ou avec une autre date).
- [ ] **Avant / après** : faire glisser le curseur.
- [ ] **Copier dans Photos** : la photo arrive dans ta Photothèque.
- [ ] Faire un export : il ne contient pas les photos (le fichier reste léger).
- [ ] **Préparer mon bilan → Copier le bilan**, puis le coller dans une conversation avec Claude.
