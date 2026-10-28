// TEST DE RESTAURATION (mensuel, automatique)
//
// Vérifie que la dernière sauvegarde se restaure VRAIMENT :
//   1. restaure le fichier SQL (pg_dump) dans une base PostgreSQL de test vide
//      (créée pour l'occasion par GitHub Actions, puis jetée) ;
//   2. compte les enregistrements par type dans cette base restaurée ;
//   3. relit le fichier JSON de la même sauvegarde avec les mêmes contrôles que l'appli ;
//   4. compare les nombres : tout doit être identique, sinon le test échoue (croix rouge).
//
// Utilisation : TEST_DB_URL=postgresql://… node scripts/tester-restauration.mjs [dossier]
import { execFileSync } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const base = process.env.TEST_DB_URL
if (!base) throw new Error('TEST_DB_URL manquant (adresse de la base de test).')

// ---------- Choix de la sauvegarde à tester (la plus récente par défaut) ----------
let dossier = process.argv[2]
if (!dossier) {
  const dates = (await readdir('sauvegardes')).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort()
  if (dates.length === 0) throw new Error('Aucune sauvegarde trouvée dans le dossier « sauvegardes ».')
  dossier = join('sauvegardes', dates.at(-1))
}
console.log(`Sauvegarde testée : ${dossier}`)

const psql = (args, entree) =>
  execFileSync('psql', [base, '-v', 'ON_ERROR_STOP=1', '-q', '-X', ...args], {
    input: entree,
    encoding: 'utf8',
    maxBuffer: 512 * 1024 * 1024,
  })

// ---------- 1. Préparer une base de test qui ressemble à Supabase ----------
const dump = await readFile(join(dossier, 'base.sql'), 'utf8')

// Les lignes appartiennent à un compte (auth.users). On retrouve les identifiants
// des comptes dans le fichier pour les recréer dans la base de test.
const comptes = new Set()
for (const bloc of dump.matchAll(/^COPY public\.(\w+) \(([^)]*)\) FROM stdin;\n([\s\S]*?)^\\\.$/gm)) {
  const colonnes = bloc[2].split(',').map((c) => c.trim().replace(/"/g, ''))
  const i = colonnes.indexOf('user_id')
  if (i < 0) continue
  for (const ligne of bloc[3].split('\n')) {
    const v = ligne.split('\t')[i]
    if (v && v !== '\\N') comptes.add(v)
  }
}

psql([], `
  do $$ begin
    if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
    if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
    if not exists (select from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
  end $$;
  drop schema if exists public cascade;
  drop schema if exists auth cascade;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $f$ select null::uuid $f$;
  ${[...comptes].map((id) => `insert into auth.users values ('${id.replace(/'/g, '')}');`).join('\n')}
`)

// ---------- 2. Restaurer le fichier SQL ----------
psql([], dump)
console.log('Fichier SQL restauré sans erreur.')

const compter = (sql) =>
  Object.fromEntries(
    psql(['-t', '-A', '-F', '\t', '-c', sql])
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((l) => {
        const [k, v] = l.split('\t')
        return [k, Number(v)]
      }),
  )

const parTypeSql = compter(
  'select type, count(*) from public.enregistrements where deleted_at is null group by type order by type',
)
const lignesSql = Number(psql(['-t', '-A', '-c', 'select count(*) from public.enregistrements']).trim())
const historiqueSql = Number(psql(['-t', '-A', '-c', 'select count(*) from public.enregistrements_historique']).trim())

// ---------- 3. Relire le fichier JSON comme le fait l'appli ----------
const json = JSON.parse(await readFile(join(dossier, 'mon-coach.json'), 'utf8'))
if (json.application !== 'mon-coach' || typeof json.version_schema !== 'number')
  throw new Error('Le fichier JSON n’est pas une sauvegarde Mon Coach valide.')
for (const e of json.enregistrements) {
  if (!e.id || !e.type || !e.created_at || !e.updated_at) throw new Error(`Enregistrement incomplet : ${JSON.stringify(e)}`)
}
const parTypeJson = {}
for (const e of json.enregistrements) if (!e.deleted_at) parTypeJson[e.type] = (parTypeJson[e.type] ?? 0) + 1

// ---------- 4. Comparer ----------
const types = [...new Set([...Object.keys(parTypeSql), ...Object.keys(parTypeJson)])].sort()
const tableau = types.map((t) => ({
  type: t,
  'base restaurée': parTypeSql[t] ?? 0,
  'fichier JSON': parTypeJson[t] ?? 0,
  résultat: (parTypeSql[t] ?? 0) === (parTypeJson[t] ?? 0) ? 'OK' : 'ÉCART',
}))
tableau.push({
  type: '(toutes les lignes, supprimées comprises)',
  'base restaurée': lignesSql,
  'fichier JSON': json.enregistrements.length,
  résultat: lignesSql === json.enregistrements.length ? 'OK' : 'ÉCART',
})
tableau.push({
  type: '(anciennes versions)',
  'base restaurée': historiqueSql,
  'fichier JSON': json.historique.length,
  résultat: historiqueSql === json.historique.length ? 'OK' : 'ÉCART',
})
console.table(tableau)

if (tableau.some((l) => l.résultat !== 'OK')) {
  throw new Error('Test de restauration ÉCHOUÉ : les nombres ne correspondent pas.')
}
console.log('✅ Test de restauration réussi : la sauvegarde se restaure entièrement.')
