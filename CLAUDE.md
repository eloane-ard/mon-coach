# Mon Coach — application personnelle de suivi sport et nutrition

Ce fichier est lu automatiquement par Claude Code à chaque session. Il contient le contexte, les règles et les décisions du projet. Le détail du programme sportif, de la stratégie nutritionnelle et de l'architecture est dans `docs/conception.md` : lis-le avant toute proposition.

## Qui je suis et comment travailler avec moi

- Je m'appelle Eloane. Je ne suis pas développeuse professionnelle, mais j'ai déjà utilisé Claude Code (projet CRM).
- **Langue** : réponds-moi toujours en français. L'interface de l'appli est entièrement en français.
- **Explique ce que tu fais** en termes simples avant chaque étape importante (création de compte, commande à lancer, fichier modifié et pourquoi).
- **Une étape à la fois** : je veux tester chaque fonctionnalité avant de passer à la suivante. Termine chaque étape par une liste courte de ce que je dois tester et comment.
- **Ne change jamais** mes objectifs, mes données ou les décisions ci-dessous sans mon accord explicite.
- Si une information te manque, pose-moi la question au lieu de supposer.
- Mon matériel : **PC Windows** (développement) et **iPhone** (utilisation principale).

## Contraintes non négociables

1. **100 % gratuit.** Aucun service payant, aucun abonnement, aucune carte bancaire. Pas d'appel à une API d'IA payante dans l'appli. Si une solution risque de devenir payante, préviens-moi avant.
2. **Ne jamais perdre mes données.** C'est la priorité absolue, au-dessus de toute fonctionnalité.
3. **Simplicité d'usage** : 10 à 15 minutes de saisie par jour maximum. Les formulaires sont pré-remplis autant que possible.
4. **Aucune notification.**
5. **Confidentialité** : mes données ne sont accessibles qu'à moi. Les **photos de progression restent uniquement sur mon téléphone** et ne sont jamais envoyées en ligne.

## Architecture décidée

- **Type** : application web progressive (PWA), installée sur l'écran d'accueil de l'iPhone depuis Safari (`display: standalone` dans le manifeste), utilisable aussi dans le navigateur du PC.
- **Front-end** : React + Vite + TypeScript (propose une alternative seulement si tu as une vraie raison, et explique-la).
- **Local d'abord (offline-first)** : chaque saisie est enregistrée immédiatement en local (IndexedDB, par exemple via Dexie), puis synchronisée.
- **Base en ligne** : Supabase, offre gratuite (PostgreSQL + authentification par e-mail). Row Level Security activée sur **toutes** les tables : chaque ligne appartient à mon `user_id`.
- **Hébergement** : GitHub Pages ou Cloudflare Pages (gratuit).
- **Synchronisation** : file d'attente locale des modifications, envoi dès que le réseau revient. Chaque enregistrement a un identifiant unique (UUID généré côté client), `created_at`, `updated_at` et une suppression logique (`deleted_at`) plutôt qu'une suppression définitive. En cas de conflit, la modification la plus récente gagne, et rien n'est jamais effacé silencieusement.

### Limites connues à gérer

- Supabase gratuit : 500 Mo de base, projet mis en pause après 7 jours sans activité (données conservées). Prévoir un « ping » automatique gratuit via GitHub Actions pour éviter la pause.
- Supabase gratuit n'inclut pas de sauvegardes quotidiennes : nous faisons les nôtres (voir ci-dessous).
- iPhone : les données locales d'un site ouvert seulement dans Safari peuvent être effacées après 7 jours sans visite ; une appli ajoutée à l'écran d'accueil a son propre compteur. Le stockage local n'est donc **jamais** la seule copie : Supabase est la source de vérité.

## Stratégie de sauvegarde (obligatoire dès la V1)

Mes données doivent toujours exister à au moins 3 endroits : téléphone, Supabase, copies de sauvegarde.

1. **Sauvegarde automatique hebdomadaire** : un workflow GitHub Actions exporte toute la base (pg_dump ou export JSON complet) dans un dépôt GitHub **privé** séparé, avec historique. Les secrets (clé de service Supabase, URL de connexion) sont stockés uniquement dans les secrets GitHub, jamais dans le code.
2. **Export manuel** : un bouton « Exporter mes données » génère un fichier JSON complet avec un numéro de version du schéma.
3. **Restauration** : un bouton « Restaurer une sauvegarde » importe ce fichier, avec un aperçu (nombre d'enregistrements par type) et une confirmation avant écriture. La restauration ne doit jamais écraser sans demander.
4. **Écran « État des sauvegardes »** : date de la dernière sauvegarde automatique, du dernier export manuel, et nombre d'enregistrements par type.
5. **Test de restauration** : fournis une procédure (et si possible un script) pour vérifier une fois par mois qu'une sauvegarde se restaure réellement dans un environnement de test, en comparant les nombres d'enregistrements.

## Règles de développement

- **Avant chaque modification importante** : rappelle-moi de faire un export de mes données.
- **Migrations de base versionnées** (dossier `supabase/migrations`). Uniquement des migrations additives : on ajoute des colonnes ou des tables, on ne supprime ni ne renomme jamais une donnée existante sans plan de migration validé avec moi.
- **Tests** (Vitest) : au minimum sur les calculs (allure, moyennes), l'export, la restauration et la synchronisation. Lance les tests avant chaque mise en ligne (tests de non-régression).
- **Secrets** : fichier `.env` local dans `.gitignore`. Seule la clé publique (anon) de Supabase peut être dans l'appli, protégée par la Row Level Security.
- **Petits commits** avec des messages clairs en français.
- Code lisible et commenté pour que je puisse comprendre et maintenir le projet.
- Design moderne, sobre et agréable, pensé d'abord pour l'iPhone (gros boutons, saisie rapide), et qui fonctionne aussi sur PC.

## Ordre de construction validé

Ne passe à la version suivante qu'après mon accord.

1. **V1 – Fondations** : projet, PWA installable, authentification, base locale + Supabase + synchronisation, profil et objectifs, saisie des mesures corporelles (poids, tours de taille, hanches, cuisses, bras, poitrine, masse grasse et masse musculaire **estimées**, avec la source de chaque mesure : mètre ruban, balance impédancemètre, autre), historique des mesures, export, restauration, écran « État des sauvegardes », sauvegarde GitHub Actions et ping anti-pause.
2. **V2 – Sport** : programme de la semaine, séances de muscu A/B (exercices, séries, répétitions, repos, charges, consignes, historique par exercice avec charges pré-remplies), courses (date, distance, temps, allure calculée automatiquement, type de séance, sensations, difficulté, fréquence cardiaque facultative), note de gêne au genou, gestion des séances manquées sans désorganiser le programme. Saisie manuelle (pas d'import Strava).
3. **V3 – Recettes et nutrition** : bibliothèque d'aliments (valeurs pour 100 g, source indiquée, valeurs approximatives signalées), bibliothèque de recettes classiques et variées (temps, portions, ingrédients, étapes, calories et macros par portion, alternatives, favoris, filtres par envie, ingrédients disponibles et temps). Exclure de mes recettes : poivron, chou-fleur, aubergine, banane.
4. **V4 – Menus et courses** : planning 7 jours, répartition cohérente des apports, liste de courses automatique avec regroupement des ingrédients, estimation du budget (objectif 20 à 25 € par semaine chez Leclerc), alternatives, case « j'ai suivi le plan » par repas.
5. **V5 – Graphiques et tableau de bord** : accueil (programme de la semaine, prochaine séance, dernières performances, évolution, objectifs, repas, régularité), graphiques interactifs (poids, mensurations, estimations, course, muscu, régularité) sur 7 j, 30 j, 3 mois, 6 mois, 1 an, depuis le début. Les estimations d'impédancemètre sont visuellement distinguées des mesures fiables.
6. **V6 – Photos et bilans** : photos de progression stockées uniquement sur l'appareil (jamais synchronisées), comparaison avant/après, bouton « Préparer mon bilan » qui génère un résumé texte de mes données (semaine ou mois) à copier-coller dans une conversation avec Claude.

## Navigation cible

Accueil · Mon programme sportif · Course à pied · Musculation · Nutrition · Recettes · Planning des repas · Liste de courses · Évolution physique · Historique et statistiques · Paramètres.

## Rappel santé

L'appli et ses conseils ne remplacent pas un professionnel de santé. Les besoins nutritionnels affichés sont des estimations (voir `docs/conception.md`) et doivent être présentés comme telles.
