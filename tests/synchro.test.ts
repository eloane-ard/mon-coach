// Tests de la synchronisation : rien ne doit jamais être perdu.
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BaseLocale } from '../src/donnees/base-locale'
import { enregistrer, lire, lister, supprimer } from '../src/donnees/depot'
import { appliquerDistant, compterAEnvoyer, synchroniser } from '../src/donnees/synchro'
import { FauxServeur } from './faux-serveur'

let n = 0
let telephone: BaseLocale
let pc: BaseLocale
let serveur: FauxServeur

beforeEach(() => {
  n++
  telephone = new BaseLocale(`telephone-${n}`)
  pc = new BaseLocale(`pc-${n}`)
  serveur = new FauxServeur()
})
afterEach(async () => {
  await telephone.delete()
  await pc.delete()
})

describe('synchronisation', () => {
  it('enregistre localement même sans réseau, puis envoie au retour du réseau', async () => {
    serveur.enPanne = true
    const m = await enregistrer('mesure', { date: '2026-10-29', poids: 77 }, undefined, telephone)
    await expect(synchroniser(serveur, telephone)).rejects.toThrow()
    expect(await compterAEnvoyer(telephone)).toBe(1)
    expect((await lire(m.id, telephone))?.donnees).toEqual({ date: '2026-10-29', poids: 77 })

    serveur.enPanne = false
    const bilan = await synchroniser(serveur, telephone)
    expect(bilan.envoyes).toBe(1)
    expect(await compterAEnvoyer(telephone)).toBe(0)
    expect(serveur.lignes.get(m.id)?.donnees).toEqual({ date: '2026-10-29', poids: 77 })
  })

  it('une saisie faite sur le téléphone arrive sur le PC', async () => {
    const m = await enregistrer('mesure', { poids: 76.5 }, undefined, telephone)
    await synchroniser(serveur, telephone)
    const bilan = await synchroniser(serveur, pc)
    expect(bilan.recus).toBe(1)
    expect((await lire(m.id, pc))?.donnees).toEqual({ poids: 76.5 })
    expect(await compterAEnvoyer(pc)).toBe(0)
  })

  it('la suppression est logique et se propage sans rien effacer', async () => {
    const m = await enregistrer('mesure', { poids: 76 }, undefined, telephone)
    await synchroniser(serveur, telephone)
    await synchroniser(serveur, pc)
    await supprimer(m.id, pc)
    await synchroniser(serveur, pc)
    await synchroniser(serveur, telephone)

    expect(await lister('mesure', telephone)).toHaveLength(0)
    const brut = await telephone.enregistrements.get(m.id)
    expect(brut?.deleted_at).not.toBeNull()
    expect(brut?.donnees).toEqual({ poids: 76 }) // le contenu est toujours là
    expect(serveur.lignes.get(m.id)?.deleted_at).not.toBeNull()
  })

  it('conflit : la modification la plus récente gagne, l’autre est archivée des deux côtés', async () => {
    const m = await enregistrer('mesure', { poids: 77 }, undefined, telephone)
    await synchroniser(serveur, telephone)
    await synchroniser(serveur, pc)

    // Les deux appareils modifient hors connexion : d'abord le téléphone, puis le PC (plus récent).
    await enregistrer('mesure', { poids: 76.8 }, m.id, telephone)
    await new Promise((r) => setTimeout(r, 5))
    await enregistrer('mesure', { poids: 76.2 }, m.id, pc)

    await synchroniser(serveur, pc) // le PC envoie en premier
    const bilan = await synchroniser(serveur, telephone) // le téléphone envoie une version plus ancienne

    expect(bilan.conflits).toBe(1)
    expect((await lire(m.id, telephone))?.donnees).toEqual({ poids: 76.2 })
    expect(serveur.lignes.get(m.id)?.donnees).toEqual({ poids: 76.2 })
    // La version perdante du téléphone n'est pas perdue :
    const archivesTel = await telephone.historique.where('id').equals(m.id).toArray()
    expect(archivesTel.some((h) => (h.donnees as { poids: number }).poids === 76.8)).toBe(true)
    expect(serveur.historique.some((h) => (h.donnees as { poids: number }).poids === 76.8)).toBe(true)
  })

  it('conflit à la réception : la version locale perdante est archivée et renvoyée pour l’historique du serveur', async () => {
    const m = await enregistrer('mesure', { poids: 76.9 }, undefined, telephone) // pas encore envoyée
    const plusRecente = {
      ...(await telephone.enregistrements.get(m.id))!,
      donnees: { poids: 76.4 },
      updated_at: new Date(Date.now() + 60_000).toISOString(),
    }
    const perdante = await appliquerDistant(plusRecente, telephone)
    expect(perdante?.donnees).toEqual({ poids: 76.9 })
    expect((await lire(m.id, telephone))?.donnees).toEqual({ poids: 76.4 })
    const archives = await telephone.historique.where('id').equals(m.id).toArray()
    expect(archives.some((h) => h.motif.startsWith('conflit'))).toBe(true)
  })

  it('une modification locale plus récente n’est pas écrasée par la réception', async () => {
    const m = await enregistrer('mesure', { poids: 77 }, undefined, telephone)
    await synchroniser(serveur, telephone)
    await synchroniser(serveur, pc)
    await enregistrer('mesure', { poids: 75 }, m.id, pc)
    await synchroniser(serveur, pc)
    await new Promise((r) => setTimeout(r, 5))
    await enregistrer('mesure', { poids: 74 }, m.id, telephone) // la plus récente
    await synchroniser(serveur, telephone)
    await synchroniser(serveur, pc)
    expect((await lire(m.id, telephone))?.donnees).toEqual({ poids: 74 })
    expect((await lire(m.id, pc))?.donnees).toEqual({ poids: 74 })
    expect(serveur.lignes.get(m.id)?.donnees).toEqual({ poids: 74 })
  })

  it('synchronise de gros volumes par lots', async () => {
    for (let i = 0; i < 650; i++) await enregistrer('course', { numero: i }, undefined, telephone)
    const bilan = await synchroniser(serveur, telephone)
    expect(bilan.envoyes).toBe(650)
    expect(serveur.lignes.size).toBe(650)
    const bilanPc = await synchroniser(serveur, pc)
    expect(bilanPc.recus).toBe(650)
    expect(await lister('course', pc)).toHaveLength(650)
  })

  it('une modification faite pendant l’envoi reste « à envoyer »', async () => {
    const m = await enregistrer('mesure', { poids: 77 }, undefined, telephone)
    const pousserOrigine = serveur.pousser.bind(serveur)
    serveur.pousser = async (lignes) => {
      const r = await pousserOrigine(lignes)
      await enregistrer('mesure', { poids: 78 }, m.id, telephone) // saisie pendant l'envoi
      serveur.pousser = pousserOrigine
      return r
    }
    await synchroniser(serveur, telephone)
    // La nouvelle valeur a été envoyée dans un second lot ou reste en attente : jamais perdue.
    expect((await lire(m.id, telephone))?.donnees).toEqual({ poids: 78 })
    await synchroniser(serveur, telephone)
    expect(serveur.lignes.get(m.id)?.donnees).toEqual({ poids: 78 })
    expect(await compterAEnvoyer(telephone)).toBe(0)
  })
})
