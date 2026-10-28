// Connexion à Supabase : authentification par code e-mail et échanges pour la synchronisation.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_CLE_PUBLIQUE, SUPABASE_URL, supabaseConfigure } from '../config'
import type { Enregistrement } from './types'
import type { Distant, LigneDistante } from './synchro'

let client: SupabaseClient | null = null

/** Le client Supabase, ou null si l'appli est en mode local (Supabase pas encore configuré). */
export function supabase(): SupabaseClient | null {
  if (!supabaseConfigure()) return null
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_CLE_PUBLIQUE, {
      auth: {
        persistSession: true, // on reste connectée, même après fermeture de l'appli
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'mon-coach-session',
      },
    })
  }
  return client
}

// ---------- Connexion par code reçu par e-mail ----------

/** Étape 1 : envoie un code à 6 chiffres par e-mail. */
export async function envoyerCode(email: string): Promise<void> {
  const sb = supabase()
  if (!sb) throw new Error('Supabase n’est pas encore configuré.')
  const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } })
  if (error) throw new Error(traduireErreur(error.message))
}

/** Étape 2 : vérifie le code saisi. */
export async function verifierCode(email: string, code: string): Promise<void> {
  const sb = supabase()
  if (!sb) throw new Error('Supabase n’est pas encore configuré.')
  const { error } = await sb.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
  if (error) throw new Error(traduireErreur(error.message))
}

export async function seDeconnecter(): Promise<void> {
  await supabase()?.auth.signOut()
}

function traduireErreur(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('expired') || m.includes('invalid')) return 'Code incorrect ou expiré. Demande un nouveau code.'
  if (m.includes('rate limit') || m.includes('security purposes'))
    return 'Trop de demandes rapprochées. Attends une minute avant de redemander un code.'
  if (m.includes('signups not allowed') || m.includes('signup'))
    return 'Cette adresse n’a pas de compte (les inscriptions sont fermées).'
  if (m.includes('fetch') || m.includes('network')) return 'Pas de réseau. Réessaie quand tu es connectée.'
  return message
}

// ---------- Échanges pour la synchronisation ----------

const COLONNES = 'id,type,donnees,created_at,updated_at,deleted_at,recu_le'

/** Le « serveur » utilisé par la synchronisation, branché sur Supabase. */
export function distantSupabase(sb: SupabaseClient): Distant {
  return {
    async pousser(lignes: Enregistrement[]) {
      const { data, error } = await sb.rpc('pousser_enregistrements', { lignes })
      if (error) throw new Error(`Envoi impossible : ${error.message}`)
      return { versionsEnLigne: (data?.versions_en_ligne ?? []) as LigneDistante[] }
    },
    async tirer(depuis: string | null, limite: number) {
      let requete = sb.from('enregistrements').select(COLONNES).order('recu_le', { ascending: true }).limit(limite)
      if (depuis) requete = requete.gt('recu_le', depuis)
      const { data, error } = await requete
      if (error) throw new Error(`Réception impossible : ${error.message}`)
      return (data ?? []) as LigneDistante[]
    },
  }
}

/** Date de la dernière sauvegarde automatique (écrite par GitHub Actions). */
export async function lireDerniereSauvegardeAuto(): Promise<{ fait_le: string; nb_enregistrements: number | null } | null> {
  const sb = supabase()
  if (!sb) return null
  const { data, error } = await sb
    .from('journal_sauvegardes')
    .select('fait_le,nb_enregistrements')
    .order('fait_le', { ascending: false })
    .limit(1)
  if (error || !data || data.length === 0) return null
  return data[0]
}
