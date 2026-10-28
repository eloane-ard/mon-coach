// Tests de l'export et de la restauration.
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BaseLocale } from '../src/donnees/base-locale'
import { enregistrer, lire, lister, supprimer } from '../src/donnees/depot'
import {
  analyserRestauration,
  appliquerRestauration,
  construireExport,
  lireFichier,
  nomFichierExport,
  VERSION_SCHEMA,
} from '../src/donnees/sauvegarde'

let n = 0
let db: BaseLocale
let autre: BaseLocale

beforeEach(() => {
  n++
  db = new BaseLocale(`export-${n}`)
  autre = new BaseLocale(`restauration-${n}`)
})
afterEach(async () => {
  await db.delete()
  await autre.delete()
})

async function remplir() {
  await enregistrer('profil', { prenom: 'Eloane', taille_cm: 173 }, '00000000-0000-4000-8000-000000000001', db)
  const m1 = await enregistrer('mesure', { date: '2026-10-29', poids: 77 }, undefined, db)
  await enregistrer('mesure', { date: '2026-11-05', poids: 76.6 }, undefined, db)
  await enregistrer('course', { distance_km: 4.16, duree_s: 1800 }, undefined, db)
  await supprimer(m1.id, db)
  return { m1 }
}

describe('export', () => {
  it('contient tout, y compris les supprimés et l’historique, avec la version du schéma', async () => {
    await remplir()
    const f = await construireExport(db)
    expect(f.application).toBe('mon-coach')
    expect(f.version_schema).toBe(VERSION_SCHEMA)
    expect(f.enregistrements).toHaveLength(4)
    expect(f.nombres).toEqual({ profil: 1, mesure: 1, course: 1 })
    expect(f.historique.length).toBeGreaterThan(0)
    expect(f.enregistrements.every((e) => !('a_envoyer' in e))).toBe(true)
  })

  it('produit un nom de fichier daté', () => {
    expect(nomFichierExport(new Date(2026, 9, 29, 18, 5))).toBe('mon-coach-export-2026-10-29-1805.json')
  })

  it('aller-retour : un export restauré dans une appli vide redonne exactement les mêmes données', async () => {
    await remplir()
    const f = await construireExport(db)
    const texte = JSON.stringify(f)

    const relu = lireFichier(texte)
    const analyse = await analyserRestauration(relu, autre)
    expect(analyse.totaux.nouveaux).toBe(4)
    expect(analyse.parType.mesure.dansFichier).toBe(1)

    const r = await appliquerRestauration(relu, { remplacerPlusRecents: false }, autre)
    expect(r.ajoutes).toBe(4)
    const apres = await construireExport(autre)
    const trier = (l: { id: string }[]) => [...l].sort((a, b) => a.id.localeCompare(b.id))
    expect(trier(apres.enregistrements)).toEqual(trier(f.enregistrements))
    expect(apres.nombres).toEqual(f.nombres)
    // Les données restaurées partiront vers Supabase.
    expect(await autre.enregistrements.where('a_envoyer').equals(1).count()).toBe(4)
  })
})

describe('restauration', () => {
  it('refuse un fichier qui n’est pas une sauvegarde Mon Coach', () => {
    expect(() => lireFichier('pas du json')).toThrow(/JSON invalide/)
    expect(() => lireFichier('{"application":"autre"}')).toThrow(/Mon Coach/)
    expect(() => lireFichier(JSON.stringify({ application: 'mon-coach', version_schema: 99, enregistrements: [] }))).toThrow(
      /plus récente/,
    )
    expect(() =>
      lireFichier(JSON.stringify({ application: 'mon-coach', version_schema: 1, enregistrements: [{ id: 'x' }] })),
    ).toThrow(/incomplet/)
  })

  it('l’aperçu ne modifie rien', async () => {
    await remplir()
    const f = await construireExport(db)
    await analyserRestauration(f, autre)
    expect(await autre.enregistrements.count()).toBe(0)
  })

  it('ne remplace jamais une donnée plus récente de l’appli sans demander', async () => {
    const m = await enregistrer('mesure', { poids: 77 }, undefined, db)
    const f = await construireExport(db)
    await new Promise((r) => setTimeout(r, 5))
    await enregistrer('mesure', { poids: 75.5 }, m.id, db) // plus récent que le fichier

    const analyse = await analyserRestauration(f, db)
    expect(analyse.totaux.plusRecentsDansAppli).toBe(1)

    const r = await appliquerRestauration(f, { remplacerPlusRecents: false }, db)
    expect(r.gardes).toBe(1)
    expect((await lire(m.id, db))?.donnees).toEqual({ poids: 75.5 })
  })

  it('avec l’option cochée, remplace et archive la version de l’appli', async () => {
    const m = await enregistrer('mesure', { poids: 77 }, undefined, db)
    const f = await construireExport(db)
    await new Promise((r) => setTimeout(r, 5))
    await enregistrer('mesure', { poids: 75.5 }, m.id, db)

    const r = await appliquerRestauration(f, { remplacerPlusRecents: true }, db)
    expect(r.remplaces).toBe(1)
    expect((await lire(m.id, db))?.donnees).toEqual({ poids: 77 })
    const archives = await db.historique.where('id').equals(m.id).toArray()
    expect(archives.some((h) => (h.donnees as { poids: number }).poids === 75.5)).toBe(true)
    // La version restaurée doit gagner à la prochaine synchronisation : date plus récente.
    expect(Date.parse((await lire(m.id, db))!.updated_at)).toBeGreaterThan(Date.parse(f.exporte_le))
  })

  it('restaurer deux fois le même fichier ne crée pas de doublons', async () => {
    await remplir()
    const f = await construireExport(db)
    await appliquerRestauration(f, { remplacerPlusRecents: false }, autre)
    const r2 = await appliquerRestauration(f, { remplacerPlusRecents: false }, autre)
    expect(r2.identiques).toBe(4)
    expect(r2.ajoutes).toBe(0)
    expect(await lister('course', autre)).toHaveLength(1)
    expect(await autre.historique.count()).toBe(f.historique.length)
  })
})
