// Note la sauvegarde dans la table « journal_sauvegardes » de Supabase,
// pour que l'écran « État des sauvegardes » de l'appli affiche sa date.
//
// Utilisation : node scripts/noter-sauvegarde.mjs <nb_enregistrements> <dossier>
import { ajouter, lireConfig } from './supabase-rest.mjs'

const nb = Number(process.argv[2])
const dossier = process.argv[3] ?? ''
await ajouter(lireConfig(), 'journal_sauvegardes', {
  origine: 'github-actions',
  nb_enregistrements: Number.isFinite(nb) ? nb : null,
  details: { dossier, depot: process.env.GITHUB_REPOSITORY ?? null, execution: process.env.GITHUB_RUN_ID ?? null },
})
console.log('Sauvegarde notée dans le journal.')
