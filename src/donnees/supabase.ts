// Connexion à Supabase : authentification par e-mail et mot de passe, échanges pour la synchronisation.
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

// ---------- Connexion par e-mail et mot de passe ----------

/** Connexion avec un compte existant. */
export async function seConnecter(email: string, motDePasse: string): Promise<void> {
  const sb = supabase()
  if (!sb) throw new Error('Supabase n’est pas encore configuré.')
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: motDePasse })
  if (error) throw new Error(traduireErreur(error.message))
}

/** Création du compte (une seule fois). Les inscriptions sont ensuite fermées dans Supabase. */
export async function creerCompte(email: string, motDePasse: string): Promise<void> {
  const sb = supabase()
  if (!sb) throw new Error('Supabase n’est pas encore configuré.')
  const { data, error } = await sb.auth.signUp({ email: email.trim(), password: motDePasse })
  if (error) throw new Error(traduireErreur(error.message))
  if (!data.session) {
    throw new Error(
      'Compte créé, mais Supabase attend une confirmation par e-mail. Désactive « Confirm email » dans Supabase (voir le guide), puis connecte-toi.',
    )
  }
}

export async function seDeconnecter(): Promise<void> {
  await supabase()?.auth.signOut()
}

/** Traduit en français les messages d'erreur de Supabase. */
export function traduireErreur(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.'
  if (m.includes('email not confirmed'))
    return 'Adresse e-mail pas encore confirmée : désactive « Confirm email » dans Supabase (voir le guide).'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Un compte existe déjà avec cette adresse : utilise « Se connecter ».'
  if (m.includes('signups not allowed') || m.includes('signup is disabled'))
    return 'Les inscriptions sont fermées : utilise « Se connecter » avec ton compte existant.'
  if (m.includes('password') && (m.includes('at least') || m.includes('short') || m.includes('weak')))
    return 'Mot de passe trop faible : au moins 8 caractères, avec des lettres et des chiffres.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Trop de tentatives rapprochées. Attends quelques minutes.'
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
