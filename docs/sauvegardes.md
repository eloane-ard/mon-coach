# Sauvegardes : comment ça marche et comment restaurer

Tes données existent toujours à **au moins 3 endroits** :

| Où | Quoi | Mis à jour |
| --- | --- | --- |
| Ton téléphone (et ton PC) | toutes tes données, utilisables hors connexion | à chaque saisie |
| Supabase (en ligne) | la copie de référence, avec l'historique de chaque modification | quelques secondes après chaque saisie (dès qu'il y a du réseau) |
| Dépôt GitHub privé `mon-coach-sauvegardes` | une copie complète par semaine, gardée pour toujours | chaque dimanche |
| Tes exports manuels | un fichier JSON complet | quand tu appuies sur « Exporter mes données » |

Les **photos** sont l'exception (décision validée) : elles restent uniquement sur le téléphone.
Pense à les copier dans ta Photothèque.

## Ce qui protège tes données

- **Rien n'est jamais effacé** : une suppression ne fait que marquer l'enregistrement comme supprimé.
- **Chaque ancienne version est gardée** : sur le téléphone (historique local, inclus dans les exports)
  et dans Supabase (table `enregistrements_historique`).
- **Conflit** (même donnée modifiée sur le téléphone et sur le PC sans réseau) : la modification la plus
  récente gagne. L'autre est gardée dans l'historique des deux côtés.
- **Row Level Security** : même avec la clé publique de l'appli, personne d'autre que toi ne peut lire ni modifier tes lignes.
  Les suppressions définitives sont impossibles depuis l'appli.
- **Ping tous les 3 jours** : Supabase ne met jamais le projet en pause.
- **Alerte** : si la sauvegarde hebdomadaire n'a pas tourné depuis plus de 9 jours, le ping échoue
  (croix rouge, et GitHub t'envoie un e-mail). L'écran « État des sauvegardes » l'indique aussi.

## Routine conseillée

- **Une fois par mois** : « Exporter mes données » depuis l'appli, puis ranger le fichier dans iCloud Drive ou OneDrive.
- **Avant chaque grosse mise à jour de l'appli** : un export (je te le rappellerai).
- **Le 1er du mois** : le test de restauration tourne tout seul. Jette un œil à l'onglet **Actions**
  du dépôt de sauvegarde (coche verte attendue).

## Restaurer

### Cas 1 : téléphone changé ou appli supprimée

Rien à faire : installe l'appli, connecte-toi, et la synchronisation récupère tout depuis Supabase.

### Cas 2 : une donnée abîmée par erreur

L'ancienne version est dans l'historique. Le plus simple : restaure le dernier export ou la dernière
sauvegarde hebdomadaire (cas 3). Seules les données plus anciennes sont proposées, et rien de plus récent n'est remplacé sans ton accord.

### Cas 3 : restaurer un fichier de sauvegarde dans l'appli

1. Récupère un fichier `mon-coach.json` :
   - soit un de tes exports ;
   - soit une sauvegarde hebdomadaire : dépôt `mon-coach-sauvegardes`, dossier `sauvegardes`, puis la date,
     puis `mon-coach.json`, puis le bouton **Download raw file**.
2. Dans l'appli : **Paramètres → Sauvegardes → Restaurer une sauvegarde → Choisir un fichier**.
3. Lis l'**aperçu** (nombre d'enregistrements par type, ce qui sera ajouté ou mis à jour), puis **Restaurer** et confirme.
4. Les données restaurées sont ensuite renvoyées automatiquement vers Supabase.

### Cas 4 : Supabase a perdu la base (très peu probable)

1. Crée un nouveau projet Supabase et exécute la migration (comme dans [installation.md](installation.md), étape 2).
2. Mets à jour les variables et secrets GitHub avec la nouvelle adresse et les nouvelles clés.
3. Connecte-toi dans l'appli, puis restaure le dernier `mon-coach.json` (cas 3).
   Les téléphones qui ont encore les données les renverront aussi d'eux-mêmes.
   (Une restauration complète par `base.sql` est aussi possible : demande-moi, je te guiderai.)

## Test de restauration mensuel (automatique)

Le 1er de chaque mois, GitHub Actions :

1. crée une base PostgreSQL de test toute neuve (jetée après le test) ;
2. y restaure le fichier `base.sql` de la dernière sauvegarde ;
3. compte les enregistrements par type et les compare au fichier `mon-coach.json` de la même sauvegarde ;
4. affiche une coche verte si tout correspond, une croix rouge sinon (avec le tableau des écarts).

Pour le lancer à la main : dépôt `mon-coach-sauvegardes`, onglet **Actions**, « Test de restauration mensuel », puis **Run workflow**.

### Vérification manuelle complémentaire (une fois par trimestre, 5 minutes)

1. Sur le PC, ouvre une **fenêtre de navigation privée** à l'adresse de l'appli (sans te connecter : mode vide).
2. **Paramètres → Sauvegardes → Restaurer** le dernier `mon-coach.json`.
3. Compare les nombres de l'écran « État des sauvegardes » avec ceux de ton téléphone.
4. Ferme la fenêtre privée : tout est effacé, rien n'a été envoyé en ligne.
