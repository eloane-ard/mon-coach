# Mon Coach — sport et nutrition

Application personnelle de suivi sport et nutrition (PWA), utilisable sur iPhone (écran d'accueil) et sur PC,
hors connexion, avec synchronisation Supabase et sauvegardes automatiques. 100 % gratuit.

- **Adresse de l'appli :** https://eloane-ard.github.io/mon-coach/
- **Mise en place pas à pas :** [docs/installation.md](docs/installation.md)
- **Ce qu'il faut tester :** [docs/a-tester.md](docs/a-tester.md)
- **Choix à valider :** [docs/choix-a-valider.md](docs/choix-a-valider.md)
- **Sauvegardes et restauration :** [docs/sauvegardes.md](docs/sauvegardes.md)
- **Règles et décisions du projet :** [CLAUDE.md](CLAUDE.md) · **Conception :** [docs/conception.md](docs/conception.md)

## Ce que fait l'appli

| Version | Contenu |
| --- | --- |
| V1 Fondations | connexion par e-mail et mot de passe, base locale + synchronisation, profil et objectifs, mesures corporelles (sources, estimations), export, restauration avec aperçu, état des sauvegardes |
| V2 Sport | programme de la semaine, séances de muscu A/B pré-remplies, minuterie de repos, courses (allure calculée), gêne au genou, séances manquées, semaines légères |
| V3 Recettes et nutrition | 73 aliments (Ciqual), 40 recettes, filtres (envie, temps, placards), favoris, besoins estimés |
| V4 Menus et courses | planning 7 jours, alternatives, « j'ai suivi le plan », liste de courses par rayon, budget |
| V5 Tableau de bord | accueil, graphiques sur 7 j à « depuis le début », estimations distinguées |
| V6 Photos et bilans | photos uniquement sur le téléphone, avant/après, bilan texte à coller dans Claude |

## Organisation des dossiers

- `src/` : le code de l'appli (React + TypeScript).
  - `donnees/` : base locale (IndexedDB), synchronisation, Supabase, export et restauration, photos.
  - `modele/` : les calculs (programme, progression, nutrition, planning, statistiques, bilan).
  - `contenu/` : exercices, aliments, recettes.
  - `pages/` et `composants/` : les écrans.
- `tests/` : tests automatiques (Vitest). Ils sont lancés avant chaque mise en ligne.
- `supabase/migrations/` : la structure de la base, versionnée (uniquement des ajouts).
- `outils/depot-sauvegardes/` : fichiers du dépôt privé de sauvegarde (sauvegarde hebdomadaire, ping, test de restauration).
- `.github/workflows/publier.yml` : tests, puis mise en ligne sur GitHub Pages.

## Commandes (sur PC, si Node.js est installé)

```
npm install      # installe les outils (une seule fois)
npm run dev      # lance l'appli sur l'ordinateur
npm test         # lance les tests
npm run build    # prépare la version à mettre en ligne (dossier dist/)
```

Rien de tout cela n'est obligatoire : chaque modification envoyée sur GitHub est testée, puis mise en ligne automatiquement.
