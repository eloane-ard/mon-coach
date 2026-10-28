# Mise en place de Mon Coach, pas à pas

Tout est gratuit, sans carte bancaire. Compte environ 45 minutes au total.
Les menus de GitHub et de Supabase changent parfois de nom : si tu ne trouves pas un bouton,
demande-moi (Claude) en me décrivant ce que tu vois.

> ⚠️ **Ne saisis pas de vraies données** avant d'avoir terminé l'étape 8 (sauvegardes vérifiées).

---

## Étape 1 : mettre l'appli en ligne (GitHub Pages)

1. Va sur https://github.com/eloane-ard/mon-coach/settings/pages
2. **Build and deployment → Source** : choisis **GitHub Actions**.
3. Va dans l'onglet **Actions** du dépôt, clique sur la dernière ligne « Tester et publier l'appli »,
   puis sur **Re-run all jobs** (en haut à droite).
4. Après 1 à 2 minutes (coche verte), l'appli est en ligne : **https://eloane-ard.github.io/mon-coach/**

À ce stade, l'appli fonctionne en « mode local » : rien n'est encore envoyé en ligne.

---

## Étape 2 : créer la base Supabase

1. Va sur https://supabase.com, puis **Start your project**. Inscris-toi avec ton compte GitHub (le plus simple).
2. Crée une organisation si on te le demande, avec le plan **Free**.
3. **New project** :
   - Name : `mon-coach`
   - Database password : clique sur **Generate a password**, puis **copie-le dans un endroit sûr**
     (gestionnaire de mots de passe ou trousseau iCloud). Il servira à l'étape 7.
   - Region : **Europe (Paris)** ou une autre région d'Europe.
4. Attends 1 à 2 minutes que le projet soit prêt.

### Créer les tables (une seule fois)

1. Dans le menu de gauche : **SQL Editor**, puis **New query**.
2. Ouvre le fichier [`supabase/migrations/20261028000001_schema_initial.sql`](../supabase/migrations/20261028000001_schema_initial.sql)
   sur GitHub, clique sur l'icône **Copy raw file**, puis colle tout dans l'éditeur.
3. Clique sur **Run**. Le message doit être « Success. No rows returned ».
4. Vérification : menu **Table Editor**. Tu dois voir `enregistrements`, `enregistrements_historique`
   et `journal_sauvegardes`, chacune sans l'avertissement « RLS disabled ».

### Recevoir un code à 6 chiffres par e-mail

1. Menu **Authentication**, puis **Emails** (ou **Email Templates**), puis le modèle **Magic Link**.
2. Remplace le sujet par : `Ton code Mon Coach`
3. Remplace tout le contenu par :

   ```html
   <h2>Ton code de connexion</h2>
   <p>Saisis ce code dans l'appli Mon Coach :</p>
   <p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
   <p>Si tu n'as rien demandé, ignore ce message.</p>
   ```

4. Clique sur **Save**.

---

## Étape 3 : relier l'appli à Supabase

1. Dans Supabase, clique sur **Connect** (en haut), ou va dans **Project Settings → API Keys**. Note :
   - l'**adresse du projet** (Project URL), du type `https://abcdefgh.supabase.co` ;
   - la **clé publique** (**Publishable key**, `sb_publishable_…`, ou l'ancienne **anon key**).
   ⚠️ Pas la clé secrète (`sb_secret_…` / `service_role`) : celle-là ne va jamais dans l'appli.
2. Sur GitHub : https://github.com/eloane-ard/mon-coach/settings/variables/actions,
   onglet **Variables**, bouton **New repository variable**, deux fois :
   - `VITE_SUPABASE_URL` = l'adresse du projet
   - `VITE_SUPABASE_CLE_PUBLIQUE` = la clé publique
3. Onglet **Actions**, puis « Tester et publier l'appli », puis **Run workflow** pour remettre l'appli en ligne avec ces réglages.

---

## Étape 4 : créer ton compte, puis fermer les inscriptions

1. Sur l'iPhone, dans **Safari** : ouvre https://eloane-ard.github.io/mon-coach/
2. Touche **Partager**, puis **Sur l'écran d'accueil**, puis **Ajouter**.
3. Ouvre l'appli **depuis l'icône**, puis va dans **Paramètres → Compte et synchronisation**.
4. Saisis ton e-mail, puis **Recevoir un code**. Saisis le code reçu, puis **Se connecter**.
5. **Fermer les inscriptions** (pour que personne d'autre ne puisse créer de compte) : dans Supabase,
   **Authentication → Sign In / Providers** (ou **Settings**), et désactive **Allow new users to sign up**. Enregistre.
6. Sur le PC : ouvre la même adresse et connecte-toi avec le même e-mail.

---

## Étape 5 : le dépôt PRIVÉ de sauvegarde

1. Va sur https://github.com/new
   - Repository name : `mon-coach-sauvegardes`
   - **Private** ⚠️ (très important : il contiendra tes données)
   - Ne coche rien d'autre, puis **Create repository**.
2. Donne l'accès à Claude : https://github.com/apps/claude/installations/select_target, puis ton compte,
   puis **Repository access**, ajoute `mon-coach-sauvegardes`, puis **Save**.
3. Dis-moi « c'est fait » : j'y dépose les fichiers du dossier [`outils/depot-sauvegardes`](../outils/depot-sauvegardes).

---

## Étape 6 : les secrets du dépôt de sauvegarde

Dans https://github.com/eloane-ard/mon-coach-sauvegardes/settings/secrets/actions,
utilise **New repository secret**, trois fois :

| Nom | Où le trouver dans Supabase |
| --- | --- |
| `SUPABASE_URL` | l'adresse du projet (comme à l'étape 3) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Project Settings → API Keys** : la **Secret key** (`sb_secret_…`) ou l'ancienne **service_role** |
| `SUPABASE_DB_URL` | bouton **Connect**, puis la chaîne **Session pooler** (commence par `postgresql://postgres.…:5432/postgres`). Remplace `[YOUR-PASSWORD]` par le mot de passe de l'étape 2. |

Ces secrets restent cachés dans GitHub : personne ne peut les relire, pas même toi.

---

## Étape 7 : première sauvegarde (à la main)

1. Dans `mon-coach-sauvegardes`, ouvre l'onglet **Actions**, puis « Sauvegarde hebdomadaire », puis **Run workflow**.
2. Attends la coche verte (2 à 3 minutes).
3. Onglet **Code** : un dossier `sauvegardes/AAAA-MM-JJ` est apparu, avec `base.sql` et `mon-coach.json`.
4. Lance aussi « Ping anti-pause Supabase » et « Test de restauration mensuel » avec **Run workflow** : coche verte attendue.
5. Dans l'appli, **Paramètres → Sauvegardes** : la date de la sauvegarde automatique s'affiche.

---

## Étape 8 : vérifier les sauvegardes, puis commencer pour de vrai

Suis la liste [`docs/a-tester.md`](a-tester.md), partie **V1**. Quand tout est bon, tu peux saisir tes vraies
données (pesée, mensurations, profil).
