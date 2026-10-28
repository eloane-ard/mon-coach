// Course à pied : saisie rapide (distance + temps → allure calculée) et historique.
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ChampDate, ChampNombre, ChampTexte, Choix, Echelle, Message, Badge } from '../../composants/formulaire'
import { enregistrer, supprimer, useEnregistrement } from '../../donnees/depot'
import { useCourses, useProfil, useReglagesProgramme } from '../../donnees/hooks'
import { etapeDe, semaineEffective } from '../../modele/programme'
import {
  calculerAllure,
  formatAllure,
  formatDuree,
  lireDuree,
  NOMS_TYPES_COURSE,
  SEUIL_DOULEUR,
  type Course,
  type TypeCourse,
} from '../../modele/sport'
import { aujourdhui, formatJourLong, lundiDe } from '../../utils/dates'
import { formatNombre, lireNombre, versChamp } from '../../utils/nombres'

const SENSATIONS = [
  { valeur: 1, texte: '😫' },
  { valeur: 2, texte: '😕' },
  { valeur: 3, texte: '😐' },
  { valeur: 4, texte: '🙂' },
  { valeur: 5, texte: '😄' },
]

export function PageCourse() {
  const courses = useCourses()
  const profil = useProfil()
  const reglages = useReglagesProgramme()
  const liste = useMemo(() => (courses ?? []).slice().reverse(), [courses])
  if (!courses) return <p className="texte-discret">Chargement…</p>

  const lundi = lundiDe(aujourdhui())
  const etape = etapeDe(semaineEffective(profil.date_debut_programme, lundi, reglages))
  const semaine = courses.filter((c) => c.donnees.date >= lundi).map((c) => c.donnees)
  const mois = courses.filter((c) => c.donnees.date >= aujourdhui().slice(0, 8) + '01').map((c) => c.donnees)
  const km = (l: Course[]) => l.reduce((t, c) => t + c.distance_km, 0)
  const faciles = courses.map((c) => c.donnees).filter((c) => c.type === 'facile')
  const derniereFacile = faciles.at(-1)

  return (
    <>
      <Link to="/course/saisie" className="bouton bouton-principal bouton-large">
        ＋ Noter une course
      </Link>
      <section className="carte">
        <h2>{etape.titre}</h2>
        <p className="texte-discret">{etape.description}</p>
        <div className="grille-chiffres">
          <div className="chiffre">
            <span className="chiffre-libelle">Cette semaine</span>
            <span className="chiffre-valeur">{formatNombre(km(semaine))} km</span>
            <span className="chiffre-detail">{semaine.length} course(s)</span>
          </div>
          <div className="chiffre">
            <span className="chiffre-libelle">Ce mois-ci</span>
            <span className="chiffre-valeur">{formatNombre(km(mois))} km</span>
            <span className="chiffre-detail">{mois.length} course(s)</span>
          </div>
          {derniereFacile && (
            <div className="chiffre">
              <span className="chiffre-libelle">Dernière course facile</span>
              <span className="chiffre-valeur">{formatAllure(derniereFacile.allure_s_km)}</span>
              <span className="chiffre-detail">
                {formatNombre(derniereFacile.distance_km, 2)} km en {formatDuree(derniereFacile.duree_s)}
              </span>
            </div>
          )}
        </div>
      </section>

      <h2 className="titre-section">Historique</h2>
      {liste.length === 0 && <p className="texte-discret">Aucune course notée pour l’instant.</p>}
      {liste.map((e) => {
        const c = e.donnees
        return (
          <section className="carte" key={e.id}>
            <div className="carte-entete">
              <h3>{formatJourLong(c.date)}</h3>
              <Badge>{NOMS_TYPES_COURSE[c.type]}</Badge>
            </div>
            <p className="ligne-chiffres">
              <strong>{formatNombre(c.distance_km, 2)} km</strong> · {formatDuree(c.duree_s)} ·{' '}
              <strong>{formatAllure(c.allure_s_km)}</strong>
            </p>
            <p className="texte-discret petit">
              {c.sensations ? `Sensations ${SENSATIONS[c.sensations - 1].texte}` : ''}
              {c.difficulte ? ` · Difficulté ${c.difficulte}/10` : ''}
              {c.fc_moyenne ? ` · FC moy. ${c.fc_moyenne}` : ''}
              {c.fc_max ? ` · FC max ${c.fc_max}` : ''}
              {c.version_courte ? ' · version courte' : ''}
            </p>
            {c.gene_genou !== null && c.gene_genou > 0 && (
              <p className={c.gene_genou > SEUIL_DOULEUR ? 'texte-alerte' : 'texte-discret petit'}>Gêne au genou : {c.gene_genou}/10</p>
            )}
            {c.note && <p className="texte-discret">{c.note}</p>}
            <div className="actions-carte">
              <Link className="bouton bouton-petit" to={`/course/saisie?id=${e.id}`}>
                Modifier
              </Link>
              <button
                className="bouton bouton-petit bouton-danger"
                onClick={() => confirm('Supprimer cette course ?') && supprimer(e.id)}
              >
                Supprimer
              </button>
            </div>
          </section>
        )
      })}
    </>
  )
}

export function SaisieCourse() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const navigate = useNavigate()
  const existante = useEnregistrement<Course>(id ?? '—')
  const courtePrevue = params.get('courte') === '1'

  const [date, setDate] = useState(params.get('date') ?? aujourdhui())
  const [type, setType] = useState<TypeCourse>((params.get('type') as TypeCourse) ?? 'facile')
  const [distance, setDistance] = useState('')
  const [duree, setDuree] = useState('')
  const [sensations, setSensations] = useState<number | null>(null)
  const [difficulte, setDifficulte] = useState<number | null>(null)
  const [fcMoy, setFcMoy] = useState('')
  const [fcMax, setFcMax] = useState('')
  const [genou, setGenou] = useState<number | null>(null)
  const [courte, setCourte] = useState(courtePrevue)
  const [note, setNote] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [pret, setPret] = useState(!id)

  useEffect(() => {
    if (!id || pret || existante === undefined) return
    if (existante) {
      const c = existante.donnees
      setDate(c.date)
      setType(c.type)
      setDistance(versChamp(c.distance_km))
      setDuree(formatDuree(c.duree_s))
      setSensations(c.sensations)
      setDifficulte(c.difficulte)
      setFcMoy(versChamp(c.fc_moyenne))
      setFcMax(versChamp(c.fc_max))
      setGenou(c.gene_genou)
      setCourte(c.version_courte)
      setNote(c.note ?? '')
    }
    setPret(true)
  }, [id, existante, pret])

  const d = lireNombre(distance)
  const s = lireDuree(duree)
  const allure = d && s ? calculerAllure(d, s) : null

  async function valider() {
    if (!d || d <= 0 || d > 100) return setErreur('Indique la distance en km (ex. 4,2).')
    if (!s) return setErreur('Indique le temps (ex. 30 ou 30:15).')
    const course: Course = {
      date,
      type,
      distance_km: d,
      duree_s: s,
      allure_s_km: Math.round(calculerAllure(d, s)!),
      sensations,
      difficulte,
      fc_moyenne: lireNombre(fcMoy),
      fc_max: lireNombre(fcMax),
      gene_genou: genou,
      version_courte: courte,
      note: note.trim() || undefined,
    }
    await enregistrer('course', course, id ?? undefined)
    navigate(-1)
  }

  if (!pret) return <p className="texte-discret">Chargement…</p>

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        valider()
      }}
    >
      <section className="carte">
        <ChampDate libelle="Date" valeur={date} onChange={setDate} />
        <Choix
          libelle="Type de séance"
          options={(Object.keys(NOMS_TYPES_COURSE) as TypeCourse[]).map((t) => ({ valeur: t, texte: NOMS_TYPES_COURSE[t] }))}
          valeur={type}
          onChange={setType}
        />
        <div className="grille-champs">
          <ChampNombre libelle="Distance" unite="km" valeur={distance} onChange={setDistance} placeholder="4,2" />
          <div className="champ">
            <label htmlFor="duree">Temps</label>
            <input id="duree" inputMode="text" value={duree} onChange={(e) => setDuree(e.target.value)} placeholder="30:15" />
          </div>
        </div>
        <p className="allure-calculee">
          Allure : <strong>{formatAllure(allure)}</strong>
        </p>
        <label className="case">
          <input type="checkbox" checked={courte} onChange={(e) => setCourte(e.target.checked)} />
          Version courte (jour de fatigue)
        </label>
      </section>

      <section className="carte">
        <Choix libelle="Sensations" options={SENSATIONS} valeur={sensations} onChange={setSensations} />
        <Echelle
          libelle="Difficulté ressentie"
          min={1}
          valeur={difficulte}
          onChange={setDifficulte}
          aide="1 = très facile · 5 = je peux encore parler · 10 = effort maximal"
        />
        <Echelle libelle="Gêne au genou" valeur={genou} onChange={setGenou} aide="0 = aucune · au-delà de 3 : on s’arrête et on en parle au kiné." />
        {genou !== null && genou > SEUIL_DOULEUR && (
          <Message type="alerte">Gêne au-dessus de 3/10 : ralentis, privilégie le plat, et parles-en au kiné si ça continue.</Message>
        )}
      </section>

      <details className="carte">
        <summary>Fréquence cardiaque et note (facultatif)</summary>
        <div className="grille-champs">
          <ChampNombre libelle="FC moyenne" unite="bpm" entier valeur={fcMoy} onChange={setFcMoy} />
          <ChampNombre libelle="FC max" unite="bpm" entier valeur={fcMax} onChange={setFcMax} />
        </div>
        <ChampTexte libelle="Note" multiligne valeur={note} onChange={setNote} placeholder="Parcours, météo, pauses…" />
      </details>

      {erreur && <Message type="erreur">{erreur}</Message>}
      <div className="barre-actions">
        <button type="button" className="bouton" onClick={() => navigate(-1)}>
          Annuler
        </button>
        <button className="bouton bouton-principal">Enregistrer</button>
      </div>
    </form>
  )
}
