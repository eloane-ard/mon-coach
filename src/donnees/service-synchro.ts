// Lance la synchronisation automatiquement :
//   • à l'ouverture de l'appli et au retour dans l'appli ;
//   • quand le réseau revient ;
//   • quelques secondes après chaque saisie ;
//   • toutes les 2 minutes tant que l'appli est ouverte.
// Et met à disposition l'état de la synchronisation pour l'affichage.
import { useEffect, useSyncExternalStore } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Session } from '@supabase/supabase-js'
import { base } from './base-locale'
import { EVENEMENT_MODIFICATION } from './depot'
import { distantSupabase, supabase } from './supabase'
import { compterAEnvoyer, lireDerniereSynchro, synchroniser, type BilanSynchro } from './synchro'

export interface EtatSynchro {
  session: Session | null
  sessionChargee: boolean
  enCours: boolean
  erreur: string | null
  dernierBilan: BilanSynchro | null
}

let etat: EtatSynchro = { session: null, sessionChargee: false, enCours: false, erreur: null, dernierBilan: null }
const abonnes = new Set<() => void>()

function changer(partiel: Partial<EtatSynchro>) {
  etat = { ...etat, ...partiel }
  abonnes.forEach((f) => f())
}

let enAttente: Promise<void> | null = null
let relancer = false

/** Lance une synchronisation (une seule à la fois ; si on en redemande une pendant, elle sera refaite). */
export function lancerSynchro(): Promise<void> {
  const sb = supabase()
  if (!sb || !etat.session || !navigator.onLine) return Promise.resolve()
  if (enAttente) {
    relancer = true
    return enAttente
  }
  enAttente = (async () => {
    changer({ enCours: true })
    try {
      do {
        relancer = false
        const bilan = await synchroniser(distantSupabase(sb))
        changer({ erreur: null, dernierBilan: bilan })
      } while (relancer)
    } catch (e) {
      changer({ erreur: e instanceof Error ? e.message : String(e) })
    } finally {
      changer({ enCours: false })
      enAttente = null
    }
  })()
  return enAttente
}

let demarre = false

/** À appeler une fois au démarrage de l'appli. */
export function demarrerSynchro(): void {
  if (demarre) return
  demarre = true
  const sb = supabase()
  if (!sb) {
    changer({ sessionChargee: true })
    return
  }

  sb.auth.getSession().then(({ data }) => {
    changer({ session: data.session, sessionChargee: true })
    lancerSynchro()
  })
  sb.auth.onAuthStateChange((_evenement, session) => {
    const nouvelleConnexion = !etat.session && session
    changer({ session, sessionChargee: true })
    if (nouvelleConnexion) lancerSynchro()
  })

  let minuterie: ReturnType<typeof setTimeout> | undefined
  window.addEventListener(EVENEMENT_MODIFICATION, () => {
    clearTimeout(minuterie)
    minuterie = setTimeout(lancerSynchro, 3000)
  })
  window.addEventListener('online', () => lancerSynchro())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') lancerSynchro()
  })
  setInterval(() => {
    if (document.visibilityState === 'visible') lancerSynchro()
  }, 2 * 60 * 1000)
}

/** État de la synchronisation pour l'affichage. */
export function useEtatSynchro(): EtatSynchro {
  return useSyncExternalStore(
    (f) => {
      abonnes.add(f)
      return () => abonnes.delete(f)
    },
    () => etat,
  )
}

/** Nombre de modifications en attente d'envoi et date de dernière synchronisation (en direct). */
export function useInfosSynchro(): { aEnvoyer: number; derniere: string | null } | undefined {
  return useLiveQuery(async () => ({
    aEnvoyer: await compterAEnvoyer(base),
    derniere: await lireDerniereSynchro(base),
  }))
}

/** Démarre la synchronisation au premier affichage. */
export function useDemarrageSynchro(): void {
  useEffect(() => demarrerSynchro(), [])
}
