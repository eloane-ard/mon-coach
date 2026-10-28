# Mon Coach — sport et nutrition

Application personnelle de suivi sport et nutrition (PWA), utilisable sur iPhone (écran d'accueil) et sur PC.

- **Adresse de l'appli :** https://eloane-ard.github.io/mon-coach/
- **Règles et décisions du projet :** [CLAUDE.md](CLAUDE.md)
- **Conception (sport, nutrition, architecture, sauvegardes) :** [docs/conception.md](docs/conception.md)

## Organisation des dossiers

- `src/` : le code de l'appli (React + TypeScript).
  - `navigation.ts` : la liste des espaces et la version où chacun arrive.
  - `pages/` : une page par espace.
  - `composants/` : éléments réutilisés (menu, bandeau de mise à jour…).
- `public/icones/` : icône de l'appli (`icone.svg`) et ses versions PNG.
- `tests/` : tests automatiques (Vitest).
- `.github/workflows/publier.yml` : à chaque modification, lance les tests puis met l'appli en ligne si tout est vert.

## Commandes (sur PC, si Node.js est installé)

```
npm install      # installe les outils (une seule fois)
npm run dev      # lance l'appli sur l'ordinateur pour l'essayer
npm test         # lance les tests
npm run build    # prépare la version à mettre en ligne (dossier dist/)
```

Rien de tout cela n'est obligatoire : chaque modification envoyée sur GitHub est testée puis mise en ligne automatiquement.
