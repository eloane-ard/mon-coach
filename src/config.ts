// Adresse et clé PUBLIQUE de ton projet Supabase.
//
// Ces deux valeurs sont faites pour être visibles dans l'appli : la clé publique
// (« anon » ou « publishable ») ne donne accès à rien toute seule. Ce sont la
// connexion (e-mail et mot de passe) et la Row Level Security qui protègent tes données.
//
// ⚠️ Ne JAMAIS mettre ici la clé « service_role » / « secret » : elle donne tous les droits.
//
// Tant que ces valeurs sont vides, l'appli fonctionne en « mode local » :
// tout est enregistré sur l'appareil, sans synchronisation.
//
// Les valeurs viennent des « Variables » du dépôt GitHub (voir docs/installation.md, étape 3),
// ou d'un fichier .env sur l'ordinateur pour le développement.
export const SUPABASE_URL: string = nettoyerAdresse(import.meta.env.VITE_SUPABASE_URL ?? '')
export const SUPABASE_CLE_PUBLIQUE: string = (import.meta.env.VITE_SUPABASE_CLE_PUBLIQUE ?? '').trim()

/**
 * Remet l'adresse Supabase sous sa forme de base « https://xxxx.supabase.co », même si on a copié
 * une variante (espaces, « / » final, « /rest/v1 » de la page « API URL », « http » sans « s »…).
 */
export function nettoyerAdresse(adresse: string): string {
  let a = adresse.trim()
  if (!a) return ''
  if (!/^https?:\/\//i.test(a)) a = `https://${a}`
  try {
    const u = new URL(a)
    // Adresse du tableau de bord copiée par erreur : https://supabase.com/dashboard/project/<identifiant>
    const projet = u.pathname.match(/\/project\/([a-z0-9]+)/i)
    if (u.hostname.endsWith('supabase.com') && projet) return `https://${projet[1]}.supabase.co`
    return `${u.protocol}//${u.host}`
  } catch {
    return a.replace(/\/+$/, '')
  }
}

export const supabaseConfigure = (): boolean => SUPABASE_URL !== '' && SUPABASE_CLE_PUBLIQUE !== ''
