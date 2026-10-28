// Export complet des données (fichier JSON) et restauration d'un tel fichier.
//
// Le fichier d'export contient TOUT : les enregistrements (y compris ceux supprimés
// logiquement) et l'historique des anciennes versions. Seules les photos de
// progression n'y sont pas : elles restent uniquement sur le téléphone (décision validée).
//
// La restauration ne remplace jamais rien sans demander :
//   • ce qui manque dans l'appli est ajouté ;
//   • ce qui est plus récent dans le fichier remplace l'appli (l'ancienne version est archivée) ;
//   • ce qui est plus récent dans l'appli est GARDÉ, sauf si on coche explicitement
//     « remplacer aussi les données plus récentes de l'appli ».
import { base, type BaseLocale } from './base-locale'
import { enregistrer, maintenant } from './depot'
import { normaliserDate } from './synchro'
import { ID_ETAT_SAUVEGARDES, type Enregistrement, type EnregistrementLocal, type VersionArchivee } from './types'

/** Version du format de fichier. À augmenter si la structure du fichier change un jour. */
export const VERSION_SCHEMA = 1
export const NOM_APPLICATION = 'mon-coach'

export interface FichierSauvegarde {
  application: typeof NOM_APPLICATION
  version_schema: number
  exporte_le: string
  nombres: Record<string, number>
  enregistrements: Enregistrement[]
  historique: VersionArchivee[]
}

export interface EtatSauvegardes {
  dernier_export_manuel?: { date: string; nb_enregistrements: number }
}

/** Compte les enregistrements par type (hors supprimés). */
export function compterParType(enregistrements: Enregistrement[]): Record<string, number> {
  const nombres: Record<string, number> = {}
  for (const e of enregistrements) {
    if (e.deleted_at) continue
    nombres[e.type] = (nombres[e.type] ?? 0) + 1
  }
  return nombres
}

/** Prépare le contenu complet du fichier d'export. */
export async function construireExport(db: BaseLocale = base): Promise<FichierSauvegarde> {
  const enregistrements = (await db.enregistrements.toArray()).map(({ a_envoyer: _ignore, ...e }) => e)
  const historique = (await db.historique.toArray()).map(({ numero: _ignore, ...h }) => h)
  return {
    application: NOM_APPLICATION,
    version_schema: VERSION_SCHEMA,
    exporte_le: new Date().toISOString(),
    nombres: compterParType(enregistrements),
    enregistrements,
    historique,
  }
}

/** Nom du fichier : mon-coach-export-2026-10-29-1830.json */
export function nomFichierExport(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `mon-coach-export-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}.json`
}

/** Note la date du dernier export manuel (synchronisée, pour la voir aussi sur l'autre appareil). */
export async function noterExport(fichier: FichierSauvegarde, db: BaseLocale = base): Promise<void> {
  const nb = Object.values(fichier.nombres).reduce((a, b) => a + b, 0)
  const etat: EtatSauvegardes = { dernier_export_manuel: { date: fichier.exporte_le, nb_enregistrements: nb } }
  await enregistrer('etat_sauvegardes', etat, ID_ETAT_SAUVEGARDES, db)
}

// ---------- Restauration ----------

export interface ApercuType {
  dansFichier: number // enregistrements (non supprimés) de ce type dans le fichier
  nouveaux: number // absents de l'appli → seront ajoutés
  plusRecentsDansFichier: number // le fichier a plus récent → remplaceront la version de l'appli
  plusRecentsDansAppli: number // l'appli a plus récent → gardés, sauf option
  identiques: number // rien à faire
}

export interface Analyse {
  fichier: FichierSauvegarde
  parType: Record<string, ApercuType>
  totaux: ApercuType
}

/** Lit et vérifie le contenu d'un fichier. Lève une erreur claire si le fichier n'est pas valable. */
export function lireFichier(texte: string): FichierSauvegarde {
  let json: unknown
  try {
    json = JSON.parse(texte)
  } catch {
    throw new Error('Ce fichier n’est pas un fichier de sauvegarde lisible (JSON invalide).')
  }
  const f = json as Partial<FichierSauvegarde>
  if (!f || f.application !== NOM_APPLICATION) {
    throw new Error('Ce fichier ne vient pas de l’appli Mon Coach.')
  }
  if (typeof f.version_schema !== 'number' || f.version_schema > VERSION_SCHEMA) {
    throw new Error(
      `Ce fichier a été créé par une version plus récente de l’appli (format ${f.version_schema}). Mets l’appli à jour avant de le restaurer.`,
    )
  }
  if (!Array.isArray(f.enregistrements)) throw new Error('Le fichier ne contient pas de liste d’enregistrements.')
  for (const e of f.enregistrements) {
    if (!e || typeof e.id !== 'string' || typeof e.type !== 'string' || !e.updated_at || !e.created_at) {
      throw new Error('Le fichier contient un enregistrement incomplet : restauration annulée par sécurité.')
    }
  }
  return {
    application: NOM_APPLICATION,
    version_schema: f.version_schema,
    exporte_le: f.exporte_le ?? '',
    nombres: f.nombres ?? compterParType(f.enregistrements),
    enregistrements: f.enregistrements,
    historique: Array.isArray(f.historique) ? f.historique : [],
  }
}

type Comparaison = 'nouveau' | 'fichier_plus_recent' | 'appli_plus_recente' | 'identique'

function comparer(duFichier: Enregistrement, local: EnregistrementLocal | undefined): Comparaison {
  if (!local) return 'nouveau'
  const tf = Date.parse(duFichier.updated_at)
  const tl = Date.parse(local.updated_at)
  const memes =
    JSON.stringify(duFichier.donnees) === JSON.stringify(local.donnees) &&
    normaliserDate(duFichier.deleted_at) === normaliserDate(local.deleted_at)
  if (memes) return 'identique'
  if (tf > tl) return 'fichier_plus_recent'
  return 'appli_plus_recente'
}

const apercuVide = (): ApercuType => ({
  dansFichier: 0,
  nouveaux: 0,
  plusRecentsDansFichier: 0,
  plusRecentsDansAppli: 0,
  identiques: 0,
})

/** Compare le fichier avec ce qu'il y a dans l'appli, SANS rien modifier (aperçu). */
export async function analyserRestauration(fichier: FichierSauvegarde, db: BaseLocale = base): Promise<Analyse> {
  const parType: Record<string, ApercuType> = {}
  const totaux = apercuVide()
  for (const e of fichier.enregistrements) {
    const a = (parType[e.type] ??= apercuVide())
    const c = comparer(e, await db.enregistrements.get(e.id))
    const champ =
      c === 'nouveau'
        ? 'nouveaux'
        : c === 'fichier_plus_recent'
          ? 'plusRecentsDansFichier'
          : c === 'appli_plus_recente'
            ? 'plusRecentsDansAppli'
            : 'identiques'
    a[champ]++
    totaux[champ]++
    if (!e.deleted_at) {
      a.dansFichier++
      totaux.dansFichier++
    }
  }
  return { fichier, parType, totaux }
}

export interface ResultatRestauration {
  ajoutes: number
  remplaces: number
  gardes: number
  identiques: number
}

/**
 * Écrit la restauration. À n'appeler qu'APRÈS confirmation, avec l'aperçu affiché.
 * Toute version de l'appli remplacée est d'abord copiée dans l'historique local.
 */
export async function appliquerRestauration(
  fichier: FichierSauvegarde,
  options: { remplacerPlusRecents: boolean },
  db: BaseLocale = base,
): Promise<ResultatRestauration> {
  const r: ResultatRestauration = { ajoutes: 0, remplaces: 0, gardes: 0, identiques: 0 }
  await db.transaction('rw', db.enregistrements, db.historique, async () => {
    for (const e of fichier.enregistrements) {
      const local = await db.enregistrements.get(e.id)
      const c = comparer(e, local)
      const propre: Enregistrement = {
        id: e.id,
        type: e.type,
        donnees: e.donnees ?? {},
        created_at: normaliserDate(e.created_at)!,
        updated_at: normaliserDate(e.updated_at)!,
        deleted_at: normaliserDate(e.deleted_at),
      }

      if (c === 'identique') {
        r.identiques++
        continue
      }
      if (c === 'appli_plus_recente' && !options.remplacerPlusRecents) {
        r.gardes++
        continue
      }
      if (local) {
        const { a_envoyer: _ignore, ...ancienne } = local
        await db.historique.add({ ...ancienne, motif: 'remplacée par une restauration', archive_le: maintenant() })
      }
      // Si on remplace une version plus récente, la version restaurée reçoit la date du jour
      // pour gagner aussi lors de la synchronisation avec le serveur.
      const updated_at = c === 'appli_plus_recente' ? maintenant() : propre.updated_at
      await db.enregistrements.put({ ...propre, updated_at, a_envoyer: 1 })
      if (c === 'nouveau') r.ajoutes++
      else r.remplaces++
    }

    // On ajoute aussi l'historique du fichier (sans doublon).
    const dejaLa = new Set((await db.historique.toArray()).map((h) => `${h.id}|${h.updated_at}|${h.motif}`))
    for (const h of fichier.historique) {
      const cle = `${h.id}|${h.updated_at}|${h.motif}`
      if (dejaLa.has(cle)) continue
      const { numero: _ignore, ...reste } = h
      await db.historique.add(reste)
      dejaLa.add(cle)
    }
  })
  if (r.ajoutes + r.remplaces > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mon-coach:modification'))
  }
  return r
}

// ---------- Téléchargement / partage du fichier ----------

/**
 * Propose le fichier à l'utilisatrice.
 * Sur iPhone : la feuille de partage (« Enregistrer dans Fichiers », iCloud Drive, AirDrop…).
 * Sur PC : un téléchargement classique.
 */
export async function proposerFichier(fichier: FichierSauvegarde): Promise<'partage' | 'telechargement' | 'annule'> {
  const texte = JSON.stringify(fichier, null, 2)
  const nom = nomFichierExport(new Date(fichier.exporte_le))
  const blob = new Blob([texte], { type: 'application/json' })
  const objet = new File([blob], nom, { type: 'application/json' })

  const tactile = matchMedia?.('(pointer: coarse)').matches
  if (tactile && navigator.canShare?.({ files: [objet] })) {
    try {
      await navigator.share({ files: [objet], title: nom })
      return 'partage'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'annule'
      // Sinon on passe au téléchargement classique.
    }
  }
  const url = URL.createObjectURL(blob)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nom
  document.body.appendChild(lien)
  lien.click()
  lien.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'telechargement'
}
