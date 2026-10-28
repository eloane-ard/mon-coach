// Lecture et écriture des données dans la base locale.
// Toutes les pages passent par ces fonctions : elles s'occupent des identifiants,
// des dates et de l'indicateur « à envoyer » pour la synchronisation.
import { useLiveQuery } from 'dexie-react-hooks'
import { base, type BaseLocale } from './base-locale'
import type { Enregistrement, EnregistrementLocal, TypeEnregistrement } from './types'

/** Crée un identifiant unique (UUID). */
export function nouvelId(): string {
  return crypto.randomUUID()
}

/** Date et heure actuelles au format ISO. Toujours strictement croissante sur l'appareil. */
let derniereDate = 0
export function maintenant(): string {
  const t = Math.max(Date.now(), derniereDate + 1)
  derniereDate = t
  return new Date(t).toISOString()
}

/** Évènement envoyé après chaque écriture locale : la synchronisation l'écoute. */
export const EVENEMENT_MODIFICATION = 'mon-coach:modification'
function signalerModification() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENEMENT_MODIFICATION))
}

/**
 * Enregistre (crée ou modifie) un enregistrement.
 * Si l'identifiant existe déjà, l'ancienne version est gardée dans l'historique local.
 */
export async function enregistrer<D extends object>(
  type: TypeEnregistrement,
  donnees: D,
  id: string = nouvelId(),
  db: BaseLocale = base,
): Promise<EnregistrementLocal<D>> {
  const date = maintenant()
  const resultat = await db.transaction('rw', db.enregistrements, db.historique, async () => {
    const existant = await db.enregistrements.get(id)
    if (existant) {
      await db.historique.add({ ...sansIndicateur(existant), motif: 'modifiée', archive_le: date })
    }
    const enr: EnregistrementLocal<D> = {
      id,
      type,
      donnees,
      created_at: existant?.created_at ?? date,
      updated_at: date,
      deleted_at: null,
      a_envoyer: 1,
    }
    await db.enregistrements.put(enr as EnregistrementLocal)
    return enr
  })
  signalerModification()
  return resultat
}

/** Suppression LOGIQUE : l'enregistrement reste stocké, avec sa date de suppression. */
export async function supprimer(id: string, db: BaseLocale = base): Promise<void> {
  const date = maintenant()
  await db.transaction('rw', db.enregistrements, db.historique, async () => {
    const existant = await db.enregistrements.get(id)
    if (!existant || existant.deleted_at) return
    await db.historique.add({ ...sansIndicateur(existant), motif: 'supprimée', archive_le: date })
    await db.enregistrements.put({ ...existant, deleted_at: date, updated_at: date, a_envoyer: 1 })
  })
  signalerModification()
}

/** Annule une suppression logique. */
export async function restaurerSupprime(id: string, db: BaseLocale = base): Promise<void> {
  const date = maintenant()
  const existant = await db.enregistrements.get(id)
  if (!existant) return
  await db.enregistrements.put({ ...existant, deleted_at: null, updated_at: date, a_envoyer: 1 })
  signalerModification()
}

/** Liste les enregistrements d'un type (hors supprimés). */
export async function lister<D>(type: TypeEnregistrement, db: BaseLocale = base): Promise<Enregistrement<D>[]> {
  const tous = await db.enregistrements.where('type').equals(type).toArray()
  return tous.filter((e) => !e.deleted_at) as unknown as Enregistrement<D>[]
}

/** Lit un enregistrement par son identifiant (undefined s'il n'existe pas ou est supprimé). */
export async function lire<D>(id: string, db: BaseLocale = base): Promise<Enregistrement<D> | undefined> {
  const e = await db.enregistrements.get(id)
  return e && !e.deleted_at ? (e as unknown as Enregistrement<D>) : undefined
}

// ---------- Versions « en direct » pour les pages (se mettent à jour toutes seules) ----------

/** Liste en direct d'un type d'enregistrement. `undefined` pendant le chargement. */
export function useListe<D>(type: TypeEnregistrement): Enregistrement<D>[] | undefined {
  return useLiveQuery(() => lister<D>(type), [type])
}

/** Un enregistrement en direct. `null` s'il n'existe pas, `undefined` pendant le chargement. */
export function useEnregistrement<D>(id: string): Enregistrement<D> | null | undefined {
  return useLiveQuery(async () => (await lire<D>(id)) ?? null, [id])
}

function sansIndicateur(e: EnregistrementLocal): Enregistrement {
  const { a_envoyer, ...reste } = e
  return reste
}
