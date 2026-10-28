// Export JSON complet de la base Supabase, au MÊME format que le bouton « Exporter mes données »
// de l'appli : ce fichier peut donc être restauré directement avec « Restaurer une sauvegarde ».
//
// Utilisation (dans GitHub Actions) :
//   node scripts/exporter-json.mjs sauvegardes/2026-11-01/mon-coach.json
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { lireConfig, lireTout } from './supabase-rest.mjs'

const destination = process.argv[2]
if (!destination) throw new Error('Indique le fichier de destination.')

const config = lireConfig()
const lignes = await lireTout(config, 'enregistrements', 'recu_le.asc,id.asc')
const historique = await lireTout(config, 'enregistrements_historique', 'numero.asc')

// Même forme que dans l'appli (src/donnees/sauvegarde.ts).
const enregistrements = lignes.map((l) => ({
  id: l.id,
  type: l.type,
  donnees: l.donnees,
  created_at: l.created_at,
  updated_at: l.updated_at,
  deleted_at: l.deleted_at,
}))
const nombres = {}
for (const e of enregistrements) if (!e.deleted_at) nombres[e.type] = (nombres[e.type] ?? 0) + 1

const fichier = {
  application: 'mon-coach',
  version_schema: 1,
  exporte_le: new Date().toISOString(),
  origine: 'sauvegarde automatique GitHub Actions',
  nombres,
  enregistrements,
  historique: historique.map((h) => ({
    id: h.enregistrement_id,
    type: h.type,
    donnees: h.donnees,
    created_at: h.created_at,
    updated_at: h.updated_at,
    deleted_at: h.deleted_at,
    motif: h.motif,
    archive_le: h.archive_le,
  })),
}

await mkdir(dirname(destination), { recursive: true })
await writeFile(destination, JSON.stringify(fichier, null, 2))

const total = Object.values(nombres).reduce((a, b) => a + b, 0)
console.log(`Export JSON : ${enregistrements.length} lignes (${total} actives), ${historique.length} anciennes versions.`)
console.table(nombres)

// Pour l'étape suivante du workflow (journal des sauvegardes).
if (process.env.GITHUB_OUTPUT) {
  await writeFile(process.env.GITHUB_OUTPUT, `nb_enregistrements=${total}\nnb_lignes=${enregistrements.length}\n`, {
    flag: 'a',
  })
}
