// Musculation : séance du jour (charges pré-remplies), historique des séances et par exercice.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Badge, ChampDate, ChampTexte, Echelle, Message } from '../../composants/formulaire'
import { ECHAUFFEMENT, EXERCICES, REGLES_SEANCE, exercice, exercicesDe, type TypeSeance } from '../../contenu/exercices'
import { enregistrer, supprimer, useEnregistrement } from '../../donnees/depot'
import { useProfil, useReglagesProgramme, useSeancesMuscu } from '../../donnees/hooks'
import {
  SEUIL_DOULEUR,
  geneMaxSeance,
  historiqueExercice,
  prochaineSeance,
  suggestion,
  type ExerciceRealise,
  type SeanceMuscu,
} from '../../modele/sport'
import { aujourdhui, formatJour, formatJourLong, lundiDe } from '../../utils/dates'
import { formatNombre, lireNombre, versChamp } from '../../utils/nombres'

// ---------- Page principale ----------

export function PageMusculation() {
  const seances = useSeancesMuscu()
  const profil = useProfil()
  const reglages = useReglagesProgramme()
  if (!seances) return <p className="texte-discret">Chargement…</p>
  const suivante = prochaineSeance(seances.map((s) => s.donnees))
  const legere = reglages.semaines_legeres.includes(lundiDe(aujourdhui()))
  const liste = seances.slice().reverse()

  return (
    <>
      <section className="carte carte-prochaine">
        <h2>Prochaine séance : {suivante}</h2>
        <p className="texte-discret">
          {exercicesDe(suivante)
            .map((e) => e.nom)
            .join(' · ')}
        </p>
        {legere && <Badge type="estimation">semaine légère : 2 séries</Badge>}
        <div className="boutons-seance">
          <Link className="bouton bouton-principal" to={`/musculation/seance?type=${suivante}${legere ? '&legere=1' : ''}`}>
            Commencer la séance {suivante}
          </Link>
          <Link className="bouton" to={`/musculation/seance?type=${suivante}&version=courte`}>
            Version courte
          </Link>
        </div>
        <p className="texte-discret petit">
          Faire l’autre séance à la place :{' '}
          <Link to={`/musculation/seance?type=${suivante === 'A' ? 'B' : 'A'}`}>séance {suivante === 'A' ? 'B' : 'A'}</Link>
        </p>
        {!profil.reprise_jambes_validee && (
          <Message type="alerte">Reprise des jambes à faire valider par le kiné ou le médecin.</Message>
        )}
      </section>

      <h2 className="titre-section">Historique par exercice</h2>
      <nav className="liste-liens">
        {EXERCICES.map((e) => (
          <Link key={e.id} to={`/musculation/exercice/${e.id}`} className="lien-ligne lien-compact">
            <span>{e.seance}</span>
            <span>
              <strong>{e.nom}</strong>
            </span>
          </Link>
        ))}
      </nav>

      <h2 className="titre-section">Séances passées</h2>
      {liste.length === 0 && <p className="texte-discret">Aucune séance pour l’instant.</p>}
      {liste.map((enr) => {
        const s = enr.donnees
        const gene = geneMaxSeance(s)
        return (
          <section className="carte" key={enr.id}>
            <div className="carte-entete">
              <h3>
                Séance {s.type} · {formatJourLong(s.date)}
              </h3>
              {s.version === 'courte' && <Badge>courte</Badge>}
            </div>
            <ul className="liste-simple">
              {s.exercices
                .filter((x) => x.series.length > 0 || x.arrete)
                .map((x) => (
                  <li key={x.exercice_id}>
                    {exercice(x.exercice_id)?.nom ?? x.exercice_id} : {resumeSeries(x)}
                    {x.arrete && ' (arrêté)'}
                  </li>
                ))}
            </ul>
            {gene !== null && gene > 0 && (
              <p className={gene > SEUIL_DOULEUR ? 'texte-alerte' : 'texte-discret petit'}>Gêne au genou max : {gene}/10</p>
            )}
            {s.note && <p className="texte-discret">{s.note}</p>}
            <div className="actions-carte">
              <Link className="bouton bouton-petit" to={`/musculation/seance?id=${enr.id}`}>
                Modifier
              </Link>
              <button className="bouton bouton-petit bouton-danger" onClick={() => confirm('Supprimer cette séance ?') && supprimer(enr.id)}>
                Supprimer
              </button>
            </div>
          </section>
        )
      })}
    </>
  )
}

function resumeSeries(x: ExerciceRealise): string {
  const ex = exercice(x.exercice_id)
  return x.series
    .map((s) => (ex?.mesure === 'secondes' ? `${s.valeur} s` : `${s.valeur}${s.charge_kg !== null ? ` × ${formatNombre(s.charge_kg)} kg` : ''}`))
    .join(', ')
}

// ---------- Historique d'un exercice ----------

export function HistoriqueExercice() {
  const { id } = useParams()
  const seances = useSeancesMuscu()
  const ex = exercice(id ?? '')
  if (!ex) return <Message type="erreur">Exercice inconnu.</Message>
  if (!seances) return <p className="texte-discret">Chargement…</p>
  const historique = historiqueExercice(
    seances.map((s) => s.donnees),
    ex.id,
  ).reverse()
  const sugg = suggestion(
    ex,
    seances.map((s) => s.donnees),
  )
  const record = Math.max(0, ...historique.map((h) => h.chargeMax ?? 0))

  return (
    <>
      <section className="carte">
        <h2>{ex.nom}</h2>
        <p className="texte-discret">
          Séance {ex.seance} · objectif {ex.min} à {ex.max} {ex.mesure === 'secondes' ? 'secondes' : 'répétitions'}
        </p>
        <ul>
          {ex.consignes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <Message type={sugg.progression ? 'succes' : 'info'}>
          Prochaine fois : {sugg.charge_kg !== null ? `${formatNombre(sugg.charge_kg)} kg · ` : ''}
          {sugg.message}
        </Message>
        {ex.avecCharge && record > 0 && <p>Charge la plus lourde : <strong>{formatNombre(record)} kg</strong></p>}
      </section>
      {historique.length === 0 && <p className="texte-discret">Pas encore fait.</p>}
      {historique.length > 0 && (
        <section className="carte">
          <table className="tableau">
            <thead>
              <tr>
                <th>Date</th>
                <th>Séries</th>
                <th className="nombre">Genou</th>
              </tr>
            </thead>
            <tbody>
              {historique.map((h) => (
                <tr key={h.date}>
                  <td>{formatJour(h.date)}</td>
                  <td>
                    {h.series
                      .map((s) => (ex.mesure === 'secondes' ? `${s.valeur} s` : `${s.valeur}×${formatNombre(s.charge_kg)} kg`))
                      .join(' · ')}
                  </td>
                  <td className="nombre">{h.gene ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  )
}

// ---------- Saisie d'une séance ----------

interface SerieSaisie {
  valeur: string
  charge: string
  faite: boolean
}
interface ExerciceSaisi {
  exercice_id: string
  series: SerieSaisie[]
  gene_genou: number | null
  arrete: boolean
  note: string
}
interface Brouillon {
  date: string
  type: TypeSeance
  version: 'complete' | 'courte'
  semaine_legere: boolean
  exercices: ExerciceSaisi[]
  duree: string
  note: string
}

const CLE_BROUILLON = 'mon-coach-brouillon-seance'

function lireBrouillon(): Brouillon | null {
  try {
    const t = localStorage.getItem(CLE_BROUILLON)
    return t ? (JSON.parse(t) as Brouillon) : null
  } catch {
    return null
  }
}
function ecrireBrouillon(b: Brouillon | null) {
  try {
    if (b) localStorage.setItem(CLE_BROUILLON, JSON.stringify(b))
    else localStorage.removeItem(CLE_BROUILLON)
  } catch {
    // stockage indisponible : pas de brouillon, sans conséquence
  }
}

export function SaisieSeance() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const navigate = useNavigate()
  const existante = useEnregistrement<SeanceMuscu>(id ?? '—')
  const seances = useSeancesMuscu()
  const profil = useProfil()
  const [b, setB] = useState<Brouillon | null>(null)
  const [repriseBrouillon, setRepriseBrouillon] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const minuterie = useMinuterie()

  // Préparation du formulaire : séance existante, brouillon, ou nouvelle séance pré-remplie.
  useEffect(() => {
    if (b || !seances) return
    if (id) {
      if (existante === undefined) return
      if (existante) setB(versBrouillon(existante.donnees))
      return
    }
    const brouillon = lireBrouillon()
    if (brouillon) {
      setB(brouillon)
      setRepriseBrouillon(true)
      return
    }
    const type = (params.get('type') as TypeSeance) ?? prochaineSeance(seances.map((s) => s.donnees))
    const courte = params.get('version') === 'courte'
    const legere = params.get('legere') === '1'
    const date = params.get('date') ?? aujourdhui()
    const nbSeries = courte ? REGLES_SEANCE.seriesCourte : legere ? REGLES_SEANCE.seriesSemaineLegere : REGLES_SEANCE.series
    setB({
      date,
      type,
      version: courte ? 'courte' : 'complete',
      semaine_legere: legere,
      exercices: exercicesDe(type, courte).map((ex) => {
        const s = suggestion(
          ex,
          seances.map((x) => x.donnees),
          date,
        )
        return {
          exercice_id: ex.id,
          series: Array.from({ length: nbSeries }, () => ({ valeur: String(s.objectif), charge: versChamp(s.charge_kg), faite: false })),
          gene_genou: null,
          arrete: false,
          note: '',
        }
      }),
      duree: '',
      note: '',
    })
  }, [b, seances, id, existante, params])

  // Brouillon enregistré à chaque modification (si l'appli se ferme en pleine séance, rien n'est perdu).
  useEffect(() => {
    if (b && !id) ecrireBrouillon(b)
  }, [b, id])

  const suggestions = useMemo(() => {
    if (!b || !seances) return {}
    return Object.fromEntries(
      b.exercices.map((x) => [
        x.exercice_id,
        suggestion(
          exercice(x.exercice_id)!,
          seances.filter((s) => s.id !== id).map((s) => s.donnees),
          b.date,
        ),
      ]),
    )
  }, [b, seances, id])

  if (!b) return <p className="texte-discret">Chargement…</p>
  if (id && existante === null) return <Message type="erreur">Cette séance n’existe pas.</Message>

  const maj = (i: number, f: (x: ExerciceSaisi) => ExerciceSaisi) =>
    setB({ ...b, exercices: b.exercices.map((x, j) => (j === i ? f(x) : x)) })

  async function valider() {
    const seance: SeanceMuscu = {
      date: b!.date,
      type: b!.type,
      version: b!.version,
      semaine_legere: b!.semaine_legere,
      exercices: b!.exercices.map((x) => ({
        exercice_id: x.exercice_id,
        series: x.series
          .filter((s) => s.faite)
          .map((s) => ({ valeur: lireNombre(s.valeur), charge_kg: lireNombre(s.charge) })),
        gene_genou: x.gene_genou,
        arrete: x.arrete,
        note: x.note.trim() || undefined,
      })),
      duree_min: lireNombre(b!.duree),
      note: b!.note.trim() || undefined,
    }
    if (seance.exercices.every((x) => x.series.length === 0)) {
      return setErreur('Aucune série validée : appuie sur ✓ pour chaque série faite.')
    }
    await enregistrer('seance_muscu', seance, id ?? undefined)
    if (!id) ecrireBrouillon(null)
    navigate('/musculation', { replace: true })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        valider()
      }}
    >
      {repriseBrouillon && (
        <Message type="info">
          Séance en cours reprise là où tu l’avais laissée.{' '}
          <button
            type="button"
            className="bouton bouton-petit"
            onClick={() => {
              if (!confirm('Abandonner cette séance en cours ?')) return
              ecrireBrouillon(null)
              setB(null)
              setRepriseBrouillon(false)
            }}
          >
            Recommencer à zéro
          </button>
        </Message>
      )}

      <section className="carte">
        <h2>
          Séance {b.type} {b.version === 'courte' && <Badge>version courte</Badge>}{' '}
          {b.semaine_legere && <Badge type="estimation">semaine légère</Badge>}
        </h2>
        <ChampDate libelle="Date" valeur={b.date} onChange={(v) => setB({ ...b, date: v })} />
        <details>
          <summary>Échauffement (10 min)</summary>
          <ul>
            {ECHAUFFEMENT.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </details>
        <p className="texte-discret petit">
          {REGLES_SEANCE.reposSecondes} s de repos entre les séries. Garde 2 à 3 répétitions « en réserve ». Appuie sur ✓ après
          chaque série : le repos se lance.
        </p>
        {!profil.reprise_jambes_validee && (
          <Message type="alerte">Reprise des jambes pas encore validée par le kiné : exercices de jambes avec prudence.</Message>
        )}
      </section>

      {minuterie.restant > 0 && (
        <div className="minuterie" role="timer" onClick={minuterie.arreter}>
          Repos : {Math.floor(minuterie.restant / 60)}:{String(minuterie.restant % 60).padStart(2, '0')}{' '}
          <small>(toucher pour arrêter)</small>
        </div>
      )}

      {b.exercices.map((x, i) => {
        const ex = exercice(x.exercice_id)!
        const sugg = suggestions[x.exercice_id]
        return (
          <section className={`carte carte-exercice ${x.arrete ? 'arrete' : ''}`} key={x.exercice_id}>
            <div className="carte-entete">
              <h3>
                {i + 1}. {ex.nom}
              </h3>
              {ex.jambes && <Badge type="alerte">genou</Badge>}
            </div>
            <details>
              <summary>Consignes</summary>
              <ul>
                {ex.consignes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </details>
            {sugg && (
              <p className={`petit ${sugg.progression ? 'texte-succes' : 'texte-discret'}`}>
                {sugg.progression ? '⬆︎ ' : ''}
                {sugg.message}
              </p>
            )}
            <div className="series">
              <div className="serie entete-serie">
                <span>Série</span>
                {ex.avecCharge && <span>Charge (kg)</span>}
                <span>{ex.mesure === 'secondes' ? 'Secondes' : 'Répétitions'}</span>
                <span></span>
              </div>
              {x.series.map((s, k) => (
                <div className={`serie ${s.faite ? 'faite' : ''}`} key={k}>
                  <span>{k + 1}</span>
                  {ex.avecCharge && (
                    <input
                      inputMode="decimal"
                      aria-label={`Charge série ${k + 1}`}
                      value={s.charge}
                      onChange={(e) =>
                        maj(i, (y) => ({
                          ...y,
                          // Changer la charge d'une série met à jour les suivantes non faites.
                          series: y.series.map((z, m) => (m === k || (m > k && !z.faite) ? { ...z, charge: e.target.value } : z)),
                        }))
                      }
                    />
                  )}
                  <input
                    inputMode="numeric"
                    aria-label={`${ex.mesure === 'secondes' ? 'Secondes' : 'Répétitions'} série ${k + 1}`}
                    value={s.valeur}
                    onChange={(e) =>
                      maj(i, (y) => ({ ...y, series: y.series.map((z, m) => (m === k ? { ...z, valeur: e.target.value } : z)) }))
                    }
                  />
                  <button
                    type="button"
                    className={`bouton-coche ${s.faite ? 'coche' : ''}`}
                    aria-label={`Série ${k + 1} ${s.faite ? 'faite' : 'à valider'}`}
                    onClick={() => {
                      maj(i, (y) => ({ ...y, series: y.series.map((z, m) => (m === k ? { ...z, faite: !z.faite } : z)) }))
                      if (!s.faite) minuterie.lancer(REGLES_SEANCE.reposSecondes)
                    }}
                  >
                    ✓
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="bouton bouton-lien"
                onClick={() =>
                  maj(i, (y) => ({ ...y, series: [...y.series, { ...(y.series.at(-1) ?? { valeur: '', charge: '' }), faite: false }] }))
                }
              >
                ＋ Ajouter une série
              </button>
            </div>
            {ex.jambes && (
              <Echelle
                libelle="Gêne au genou"
                valeur={x.gene_genou}
                onChange={(v) => maj(i, (y) => ({ ...y, gene_genou: v, arrete: v !== null && v > SEUIL_DOULEUR ? true : y.arrete }))}
              />
            )}
            {x.gene_genou !== null && x.gene_genou > SEUIL_DOULEUR && (
              <Message type="alerte">Douleur au-dessus de 3/10 : on arrête cet exercice. Note-le pour en parler au kiné.</Message>
            )}
            <label className="case">
              <input type="checkbox" checked={x.arrete} onChange={(e) => maj(i, (y) => ({ ...y, arrete: e.target.checked }))} />
              Exercice arrêté (douleur ou instabilité)
            </label>
          </section>
        )
      })}

      <section className="carte">
        <div className="grille-champs">
          <div className="champ">
            <label htmlFor="duree-seance">Durée (min)</label>
            <input id="duree-seance" inputMode="numeric" value={b.duree} onChange={(e) => setB({ ...b, duree: e.target.value })} />
          </div>
        </div>
        <ChampTexte libelle="Note" multiligne valeur={b.note} onChange={(v) => setB({ ...b, note: v })} placeholder="Forme, sommeil, machine occupée…" />
      </section>

      {erreur && <Message type="erreur">{erreur}</Message>}
      <div className="barre-actions">
        <button type="button" className="bouton" onClick={() => navigate(-1)}>
          Plus tard
        </button>
        <button className="bouton bouton-principal">Terminer la séance</button>
      </div>
    </form>
  )
}

function versBrouillon(s: SeanceMuscu): Brouillon {
  return {
    date: s.date,
    type: s.type,
    version: s.version,
    semaine_legere: s.semaine_legere,
    exercices: s.exercices.map((x) => ({
      exercice_id: x.exercice_id,
      series: x.series.map((y) => ({ valeur: versChamp(y.valeur), charge: versChamp(y.charge_kg), faite: true })),
      gene_genou: x.gene_genou,
      arrete: x.arrete,
      note: x.note ?? '',
    })),
    duree: versChamp(s.duree_min),
    note: s.note ?? '',
  }
}

/** Compte à rebours du temps de repos (affiché dans la page, sans notification). */
function useMinuterie() {
  const [fin, setFin] = useState<number | null>(null)
  const [, forcer] = useState(0)
  const ref = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  useEffect(() => {
    clearInterval(ref.current)
    if (fin) ref.current = setInterval(() => forcer((n) => n + 1), 500)
    return () => clearInterval(ref.current)
  }, [fin])
  const restant = fin ? Math.max(0, Math.ceil((fin - Date.now()) / 1000)) : 0
  if (fin && restant === 0) setTimeout(() => setFin(null), 0)
  return { restant, lancer: (s: number) => setFin(Date.now() + s * 1000), arreter: () => setFin(null) }
}
