// Adresse et clé PUBLIQUE de ton projet Supabase.
//
// Ces deux valeurs sont faites pour être visibles dans l'appli : la clé publique
// (« anon » ou « publishable ») ne donne accès à rien toute seule. Ce sont la
// connexion par code e-mail et la Row Level Security qui protègent tes données.
//
// ⚠️ Ne JAMAIS mettre ici la clé « service_role » / « secret » : elle donne tous les droits.
//
// Tant que ces valeurs sont vides, l'appli fonctionne en « mode local » :
// tout est enregistré sur l'appareil, sans synchronisation.
//
// Les valeurs viennent des « Variables » du dépôt GitHub (voir docs/installation.md, étape 3),
// ou d'un fichier .env sur l'ordinateur pour le développement.
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? ''
export const SUPABASE_CLE_PUBLIQUE: string = import.meta.env.VITE_SUPABASE_CLE_PUBLIQUE ?? ''

export const supabaseConfigure = (): boolean => SUPABASE_URL !== '' && SUPABASE_CLE_PUBLIQUE !== ''
