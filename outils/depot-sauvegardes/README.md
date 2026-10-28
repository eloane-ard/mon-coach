# Sauvegardes de Mon Coach (dépôt PRIVÉ)

Ce dépôt contient les copies de sécurité de la base Supabase de l'appli Mon Coach.
**Il doit rester privé** : il contient toutes les données personnelles.

## Ce qui tourne tout seul

| Tâche | Quand | Rôle |
| --- | --- | --- |
| Sauvegarde hebdomadaire | chaque dimanche | Copie toute la base dans `sauvegardes/AAAA-MM-JJ/` |
| Ping anti-pause | tous les 3 jours | Empêche Supabase de mettre le projet en pause, vérifie la dernière sauvegarde |
| Test de restauration | le 1er du mois | Restaure la dernière sauvegarde dans une base de test et compare les nombres |

Une croix rouge dans l'onglet **Actions** = un problème. GitHub envoie aussi un e-mail.

## Contenu d'une sauvegarde

- `base.sql` : copie complète de la base (format PostgreSQL).
- `mon-coach.json` : même format que le bouton « Exporter mes données » de l'appli.
  Il se restaure directement depuis l'appli : **Paramètres → Sauvegardes → Restaurer une sauvegarde**.

## Récupérer une sauvegarde à la main

1. Onglet **Code** → dossier `sauvegardes` → choisir la date.
2. Cliquer sur `mon-coach.json` → bouton **Download raw file** (flèche vers le bas).
3. Dans l'appli : **Restaurer une sauvegarde** → choisir ce fichier → vérifier l'aperçu → **Restaurer**.

La procédure complète est dans `docs/sauvegardes.md` du dépôt `mon-coach`.
