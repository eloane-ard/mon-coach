// « Ping » anti-pause : fait une vraie requête sur la base pour que Supabase
// ne mette pas le projet en pause (pause après 7 jours sans activité sur l'offre gratuite).
// Vérifie aussi que la dernière sauvegarde automatique a moins de 9 jours :
// sinon le workflow échoue (croix rouge dans GitHub, et e-mail de GitHub).
import { lireConfig, lireTout } from './supabase-rest.mjs'

const config = lireConfig()
const reponse = await fetch(`${config.url}/rest/v1/enregistrements?select=id&limit=1`, {
  headers: config.cle.startsWith('sb_secret_')
    ? { apikey: config.cle }
    : { apikey: config.cle, Authorization: `Bearer ${config.cle}` },
})
if (!reponse.ok) throw new Error(`Supabase ne répond pas correctement : ${reponse.status} ${await reponse.text()}`)
console.log('Supabase répond : projet actif.')

const journal = await lireTout(config, 'journal_sauvegardes', 'fait_le.desc')
const derniere = journal[0]?.fait_le
if (!derniere) {
  console.log('Aucune sauvegarde automatique enregistrée pour l’instant.')
} else {
  const jours = (Date.now() - Date.parse(derniere)) / 86_400_000
  console.log(`Dernière sauvegarde automatique : ${derniere} (il y a ${jours.toFixed(1)} jours).`)
  if (jours > 9) throw new Error('La sauvegarde automatique hebdomadaire n’a pas tourné depuis plus de 9 jours !')
}
