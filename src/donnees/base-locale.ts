// Base de données locale (IndexedDB, via la bibliothèque Dexie).
// Chaque saisie y est écrite IMMÉDIATEMENT, même sans réseau. La synchronisation
// envoie ensuite à Supabase tout ce qui est marqué « à envoyer ».
import Dexie, { type Table } from 'dexie'
import type { EnregistrementLocal, VersionArchivee } from './types'

/** Petites informations techniques (date de dernière synchronisation, etc.). */
export interface Reglage {
  cle: string
  valeur: unknown
}

export class BaseLocale extends Dexie {
  enregistrements!: Table<EnregistrementLocal, string>
  historique!: Table<VersionArchivee, number>
  reglages!: Table<Reglage, string>

  constructor(nom = 'mon-coach') {
    super(nom)
    // Version 1 du stockage local. Pour la faire évoluer : ajouter un « this.version(2) »
    // en dessous, sans jamais supprimer de table existante.
    this.version(1).stores({
      enregistrements: 'id, type, a_envoyer, updated_at',
      historique: '++numero, id, archive_le',
      reglages: 'cle',
    })
  }
}

export const base = new BaseLocale()

/** Demande au navigateur de ne pas effacer les données locales (quand c'est possible). */
export async function demanderStockagePersistant(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist()
  } catch {
    // Pas grave : Supabase reste la source de vérité.
  }
  return false
}

export async function lireReglage<T>(cle: string, parDefaut: T, db: BaseLocale = base): Promise<T> {
  const r = await db.reglages.get(cle)
  return r ? (r.valeur as T) : parDefaut
}

export async function ecrireReglage(cle: string, valeur: unknown, db: BaseLocale = base): Promise<void> {
  await db.reglages.put({ cle, valeur })
}
