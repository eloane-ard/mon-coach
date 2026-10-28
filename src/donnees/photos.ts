// Photos de progression : stockées UNIQUEMENT sur cet appareil (décision validée).
// Base locale séparée : jamais synchronisée avec Supabase, jamais incluse dans les exports.
import Dexie, { type Table } from 'dexie'

export type Vue = 'face' | 'profil' | 'dos'

export const NOMS_VUES: Record<Vue, string> = { face: 'Face', profil: 'Profil', dos: 'Dos' }

export interface Photo {
  id: string
  date: string // AAAA-MM-JJ
  vue: Vue
  image: Blob // JPEG redimensionné
  largeur: number
  hauteur: number
  note?: string
  ajoutee_le: string
}

class BasePhotos extends Dexie {
  photos!: Table<Photo, string>
  constructor() {
    super('mon-coach-photos')
    this.version(1).stores({ photos: 'id, date, vue' })
  }
}

export const basePhotos = new BasePhotos()

const TAILLE_MAX = 1600

/** Réduit la photo (1600 px maximum) pour ne pas remplir le téléphone. */
export async function preparerImage(fichier: File): Promise<{ image: Blob; largeur: number; hauteur: number }> {
  const bitmap = await createImageBitmap(fichier)
  const echelle = Math.min(1, TAILLE_MAX / Math.max(bitmap.width, bitmap.height))
  const largeur = Math.round(bitmap.width * echelle)
  const hauteur = Math.round(bitmap.height * echelle)
  const canvas = document.createElement('canvas')
  canvas.width = largeur
  canvas.height = hauteur
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, largeur, hauteur)
  bitmap.close()
  const image = await new Promise<Blob>((ok, ko) => canvas.toBlob((b) => (b ? ok(b) : ko(new Error('Image illisible'))), 'image/jpeg', 0.85))
  return { image, largeur, hauteur }
}

export async function ajouterPhoto(fichier: File, date: string, vue: Vue, note?: string): Promise<void> {
  const { image, largeur, hauteur } = await preparerImage(fichier)
  await basePhotos.photos.add({ id: crypto.randomUUID(), date, vue, image, largeur, hauteur, note, ajoutee_le: new Date().toISOString() })
}

/** Propose d'enregistrer la photo dans la Photothèque (copie de sécurité, par toi). */
export async function partagerPhoto(p: Photo): Promise<void> {
  const fichier = new File([p.image], `progression-${p.date}-${p.vue}.jpg`, { type: 'image/jpeg' })
  if (navigator.canShare?.({ files: [fichier] })) {
    await navigator.share({ files: [fichier] })
    return
  }
  const url = URL.createObjectURL(fichier)
  const a = document.createElement('a')
  a.href = url
  a.download = fichier.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
