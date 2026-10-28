// Synchronisation entre la base locale (téléphone / PC) et Supabase.
//
// Déroulement d'une synchronisation :
//   1. ENVOI : tout ce qui est marqué « à envoyer » part vers Supabase.
//      Le serveur garde la version la plus récente ; s'il avait déjà plus récent,
//      il nous renvoie sa version (et range la nôtre dans son historique).
//   2. RÉCEPTION : on récupère tout ce qui est arrivé sur le serveur depuis la
//      dernière fois (par exemple une saisie faite sur le PC).
//   3. Conflit (même enregistrement modifié des deux côtés) : la modification la
//      plus récente gagne. L'autre version n'est JAMAIS effacée : elle est gardée
//      dans l'historique local ET envoyée à l'historique du serveur.
import { base, ecrireReglage, lireReglage, type BaseLocale } from './base-locale'
import type { Enregistrement, EnregistrementLocal } from './types'

/** Ligne telle que renvoyée par le serveur (avec sa date d'arrivée). */
export type LigneDistante = Enregistrement & { recu_le: string }

/** Ce dont la synchronisation a besoin côté serveur (Supabase, ou un faux serveur pour les tests). */
export interface Distant {
  pousser(lignes: Enregistrement[]): Promise<{ versionsEnLigne: LigneDistante[] }>
  tirer(depuis: string | null, limite: number): Promise<LigneDistante[]>
}

export interface BilanSynchro {
  envoyes: number
  recus: number
  conflits: number
}

const TAILLE_LOT = 200
const CLE_CURSEUR = 'curseur_synchro'
const CLE_DERNIERE = 'derniere_synchro'
/** Marge de sécurité : on relit les 2 dernières minutes reçues par le serveur (sans effet si déjà à jour). */
const MARGE_MS = 2 * 60 * 1000

/** Met une date au format ISO standard (le serveur renvoie parfois « +00:00 » et des microsecondes). */
export function normaliserDate(d: string | null | undefined): string | null {
  return d ? new Date(d).toISOString() : null
}

function normaliser(e: Enregistrement): Enregistrement {
  return {
    id: e.id,
    type: e.type,
    donnees: e.donnees ?? {},
    created_at: normaliserDate(e.created_at)!,
    updated_at: normaliserDate(e.updated_at)!,
    deleted_at: normaliserDate(e.deleted_at),
  }
}

function memeContenu(a: Enregistrement, b: Enregistrement): boolean {
  return (
    JSON.stringify(a.donnees) === JSON.stringify(b.donnees) &&
    normaliserDate(a.deleted_at) === normaliserDate(b.deleted_at) &&
    a.type === b.type
  )
}

/**
 * Applique une version venue du serveur sur la base locale.
 * Renvoie la version locale perdante s'il y a eu conflit (pour l'envoyer à l'historique du serveur).
 */
export async function appliquerDistant(
  distante: Enregistrement,
  db: BaseLocale = base,
): Promise<Enregistrement | null> {
  const d = normaliser(distante)
  return db.transaction('rw', db.enregistrements, db.historique, async () => {
    const locale = await db.enregistrements.get(d.id)
    const versionDistante: EnregistrementLocal = { ...d, a_envoyer: 0 }

    if (!locale) {
      await db.enregistrements.put(versionDistante)
      return null
    }

    const tLocal = Date.parse(locale.updated_at)
    const tDistant = Date.parse(d.updated_at)

    if (tDistant > tLocal) {
      // Le serveur a plus récent : il gagne. L'ancienne version locale est archivée.
      const conflit = locale.a_envoyer === 1 && !memeContenu(locale, d)
      if (!memeContenu(locale, d)) {
        const { a_envoyer: _ignore, ...ancienne } = locale
        await db.historique.add({
          ...ancienne,
          motif: conflit ? 'conflit : remplacée par une version plus récente' : 'remplacée par la synchronisation',
          archive_le: new Date().toISOString(),
        })
      }
      await db.enregistrements.put(versionDistante)
      if (conflit) {
        const { a_envoyer: _ignore, ...perdante } = locale
        return perdante
      }
      return null
    }

    if (tDistant === tLocal) {
      // Même version des deux côtés : elle est donc bien enregistrée sur le serveur.
      if (memeContenu(locale, d) && locale.a_envoyer === 1) {
        await db.enregistrements.update(d.id, { a_envoyer: 0 })
      }
      return null
    }

    // La version locale est plus récente : on la garde, elle sera (r)envoyée.
    if (locale.a_envoyer === 0) await db.enregistrements.update(d.id, { a_envoyer: 1 })
    return null
  })
}

/** Étape 1 : envoie toutes les modifications locales en attente. */
async function envoyer(distant: Distant, db: BaseLocale): Promise<{ envoyes: number; conflits: Enregistrement[] }> {
  let envoyes = 0
  const conflits: Enregistrement[] = []
  const dejaTentes = new Set<string>()

  for (;;) {
    const lot = (await db.enregistrements.where('a_envoyer').equals(1).toArray())
      .filter((e) => !dejaTentes.has(e.id))
      .slice(0, TAILLE_LOT)
    if (lot.length === 0) break
    lot.forEach((e) => dejaTentes.add(e.id))

    const lignes = lot.map(({ a_envoyer: _ignore, ...e }) => e)
    const { versionsEnLigne } = await distant.pousser(lignes)

    // Ce qui a été accepté est marqué « envoyé »… sauf si on l'a modifié entre-temps.
    const refuses = new Set(versionsEnLigne.map((v) => v.id))
    await db.transaction('rw', db.enregistrements, async () => {
      for (const e of lot) {
        if (refuses.has(e.id)) continue
        const actuel = await db.enregistrements.get(e.id)
        if (actuel && actuel.updated_at === e.updated_at) {
          await db.enregistrements.update(e.id, { a_envoyer: 0 })
        }
      }
    })
    envoyes += lot.length - refuses.size

    // Le serveur avait plus récent (ou identique) : on récupère sa version.
    for (const v of versionsEnLigne) {
      const perdante = await appliquerDistant(v, db)
      if (perdante) conflits.push(perdante)
    }
  }
  return { envoyes, conflits }
}

/** Étape 2 : récupère tout ce qui est arrivé sur le serveur depuis la dernière fois. */
async function recevoir(distant: Distant, db: BaseLocale): Promise<{ recus: number; conflits: Enregistrement[] }> {
  let recus = 0
  const conflits: Enregistrement[] = []
  const curseur = await lireReglage<string | null>(CLE_CURSEUR, null, db)
  let depuis = curseur ? new Date(Date.parse(curseur) - MARGE_MS).toISOString() : null
  let plusRecent = curseur

  for (;;) {
    const lignes = await distant.tirer(depuis, 500)
    for (const l of lignes) {
      const perdante = await appliquerDistant(l, db)
      if (perdante) conflits.push(perdante)
      recus++
      if (!plusRecent || Date.parse(l.recu_le) > Date.parse(plusRecent)) plusRecent = normaliserDate(l.recu_le)
    }
    if (lignes.length < 500) break
    depuis = lignes[lignes.length - 1].recu_le
  }
  if (plusRecent) await ecrireReglage(CLE_CURSEUR, plusRecent, db)
  return { recus, conflits }
}

/** Synchronisation complète : envoi, réception, puis archivage des versions perdantes sur le serveur. */
export async function synchroniser(distant: Distant, db: BaseLocale = base): Promise<BilanSynchro> {
  const envoi = await envoyer(distant, db)
  const reception = await recevoir(distant, db)
  // Les versions locales perdues pendant la réception n'ont jamais atteint le serveur :
  // on les lui envoie pour qu'il les range dans son historique (elles sont plus
  // anciennes, donc n'écrasent rien). Celles perdues pendant l'envoi y sont déjà.
  if (reception.conflits.length > 0) await distant.pousser(reception.conflits)
  await ecrireReglage(CLE_DERNIERE, new Date().toISOString(), db)
  return {
    envoyes: envoi.envoyes,
    recus: reception.recus,
    conflits: envoi.conflits.length + reception.conflits.length,
  }
}

/** Nombre de modifications locales pas encore envoyées. */
export function compterAEnvoyer(db: BaseLocale = base): Promise<number> {
  return db.enregistrements.where('a_envoyer').equals(1).count()
}

export function lireDerniereSynchro(db: BaseLocale = base): Promise<string | null> {
  return lireReglage<string | null>(CLE_DERNIERE, null, db)
}
