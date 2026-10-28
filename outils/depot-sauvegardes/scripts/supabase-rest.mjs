// Petits outils pour lire et écrire dans Supabase avec la clé secrète (service_role).
// Utilisés UNIQUEMENT par GitHub Actions, dans le dépôt privé de sauvegarde.
// La clé secrète vient des secrets GitHub : elle n'est jamais écrite dans un fichier.

export function lireConfig() {
  const url = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '')
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !cle) {
    throw new Error('Secrets manquants : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans GitHub.')
  }
  return { url, cle }
}

function entetes(cle, extra = {}) {
  // Les nouvelles clés « sb_secret_… » se passent uniquement dans « apikey » ;
  // les anciennes clés « service_role » (JWT) aussi dans « Authorization ».
  const h = { apikey: cle, 'Content-Type': 'application/json', ...extra }
  if (!cle.startsWith('sb_secret_')) h.Authorization = `Bearer ${cle}`
  return h
}

/** Lit TOUTES les lignes d'une table, par pages de 1000. */
export async function lireTout({ url, cle }, table, ordre) {
  const lignes = []
  const taille = 1000
  for (let debut = 0; ; debut += taille) {
    const reponse = await fetch(`${url}/rest/v1/${table}?select=*&order=${ordre}`, {
      headers: entetes(cle, { Range: `${debut}-${debut + taille - 1}`, 'Range-Unit': 'items' }),
    })
    if (!reponse.ok && reponse.status !== 206) {
      throw new Error(`Lecture de ${table} impossible : ${reponse.status} ${await reponse.text()}`)
    }
    const page = await reponse.json()
    lignes.push(...page)
    if (page.length < taille) break
  }
  return lignes
}

/** Ajoute une ligne dans une table. */
export async function ajouter({ url, cle }, table, ligne) {
  const reponse = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: entetes(cle, { Prefer: 'return=minimal' }),
    body: JSON.stringify(ligne),
  })
  if (!reponse.ok) throw new Error(`Écriture dans ${table} impossible : ${reponse.status} ${await reponse.text()}`)
}
