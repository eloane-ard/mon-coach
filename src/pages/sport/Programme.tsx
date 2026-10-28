// « Mon programme sportif » : la semaine, la prochaine séance, les ajustements.
import { useState } from 'react'
import { Link } from 'react-router'
import { Badge, Message } from '../../composants/formulaire'
import { enregistrer } from '../../donnees/depot'
import { useCourses, useProfil, useReglagesProgramme, useSeancesAutres, useSeancesMuscu } from '../../donnees/hooks'
import { ID_REGLAGES_PROGRAMME } from '../../donnees/types'
import {
  ETAPES,
  REGLES,
  etapeDe,
  programmeSemaine,
  prochaineSeancePrevue,
  regularite,
  semaineEffective,
  semaineLegereConseillee,
  numeroSemaine,
  suiviSemaine,
  type JourSuivi,
  type ReglagesProgramme,
  type Statut,
} from '../../modele/programme'
import { prochaineSeance, formatAllure, NOMS_ACTIVITES } from '../../modele/sport'
import { ajouterJours, aujourdhui, formatJour, lundiDe, NOMS_JOURS } from '../../utils/dates'
import { formatNombre } from '../../utils/nombres'

const STATUTS: Record<Statut, { texte: string; type: 'neutre' | 'succes' | 'alerte' | 'estimation' }> = {
  faite: { texte: 'faite ✓', type: 'succes' },
  manquee: { texte: 'manquée', type: 'alerte' },
  aujourdhui: { texte: 'aujourd’hui', type: 'estimation' },
  a_venir: { texte: 'à venir', type: 'neutre' },
  repos: { texte: 'repos', type: 'neutre' },
  optionnelle_passee: { texte: 'non faite (optionnelle)', type: 'neutre' },
}

export default function Programme() {
  const profil = useProfil()
  const reglages = useReglagesProgramme()
  const courses = useCourses()
  const muscu = useSeancesMuscu()
  const autres = useSeancesAutres()
  const jour = aujourdhui()
  const [lundi, setLundi] = useState(lundiDe(jour))

  if (!courses || !muscu || !autres) return <p className="texte-discret">Chargement…</p>

  const debut = profil.date_debut_programme
  const prevues = programmeSemaine(debut, lundi, reglages)
  const suivi = suiviSemaine(prevues, jour, {
    courses: courses.map((c) => c.donnees),
    muscu: muscu.map((m) => m.donnees),
    autres: autres.map((a) => a.donnees),
  })
  const reg = regularite(suivi)
  const semaine = numeroSemaine(debut, lundi)
  const effective = semaineEffective(debut, lundi, reglages)
  const etape = etapeDe(effective)
  const estSemaineCourante = lundi === lundiDe(jour)
  const prochaine = estSemaineCourante ? prochaineSeancePrevue(suivi) : undefined
  const typeMuscu = prochaineSeance(muscu.map((m) => m.donnees))
  const legere = reglages.semaines_legeres.includes(lundi)
  const conseilLeger = estSemaineCourante && semaineLegereConseillee(debut, lundi, reglages)
  const manquees = suivi.filter((j) => j.statut === 'manquee').length

  async function changerReglages(r: ReglagesProgramme) {
    await enregistrer('reglage_programme', r, ID_REGLAGES_PROGRAMME)
  }

  return (
    <>
      <div className="navigation-semaine">
        <button className="bouton bouton-petit" onClick={() => setLundi(ajouterJours(lundi, -7))} aria-label="Semaine précédente">
          ‹
        </button>
        <div>
          <strong>{semaine >= 1 ? `Semaine ${semaine}` : 'Avant le programme'}</strong>
          <small>du {formatJour(lundi)}</small>
        </div>
        <button className="bouton bouton-petit" onClick={() => setLundi(ajouterJours(lundi, 7))} aria-label="Semaine suivante">
          ›
        </button>
      </div>

      {semaine >= 1 && (
        <section className="carte">
          <h2>
            {etape.titre} {legere && <Badge type="estimation">semaine légère</Badge>}
          </h2>
          <p className="texte-discret">{etape.description}</p>
          <p>
            <strong>
              Régularité : {reg.faites}/{reg.prevues} séances
            </strong>
            {reg.bonus > 0 && ` (+${reg.bonus} en plus)`}
          </p>
        </section>
      )}

      {prochaine && (
        <section className="carte carte-prochaine">
          <h2>Prochaine séance · {prochaine.statut === 'aujourdhui' ? 'aujourd’hui' : NOMS_JOURS[prochaine.prevue.jour].toLowerCase()}</h2>
          <p>
            <strong>{prochaine.prevue.categorie === 'muscu' ? `Musculation ${typeMuscu}` : prochaine.prevue.titre}</strong>
          </p>
          <p className="texte-discret">{prochaine.prevue.detail}</p>
          <BoutonsSeance jour={prochaine} typeMuscu={typeMuscu} legere={legere} />
        </section>
      )}

      {manquees > 0 && estSemaineCourante && (
        <Message type="info">
          {manquees} séance(s) manquée(s) cette semaine : pas de rattrapage en doublant, on reprend simplement à la suivante.
        </Message>
      )}
      {conseilLeger && (
        <Message type="info">
          Ça fait 4 semaines normales : c’est le moment d’une semaine plus légère (2 séries au lieu de 3).
          <button
            className="bouton bouton-petit"
            onClick={() => changerReglages({ ...reglages, semaines_legeres: [...reglages.semaines_legeres, lundi] })}
          >
            Faire une semaine légère
          </button>
        </Message>
      )}

      <h2 className="titre-section">La semaine</h2>
      {suivi.map((j) => (
        <CarteJour key={j.prevue.date} j={j} typeMuscu={typeMuscu} legere={legere} />
      ))}

      {semaine >= 1 && (
        <section className="carte">
          <h2>Ajuster</h2>
          <label className="case">
            <input
              type="checkbox"
              checked={legere}
              onChange={(e) =>
                changerReglages({
                  ...reglages,
                  semaines_legeres: e.target.checked
                    ? [...reglages.semaines_legeres, lundi]
                    : reglages.semaines_legeres.filter((l) => l !== lundi),
                })
              }
            />
            Semaine légère (2 séries par exercice)
          </label>
          <label className="case">
            <input
              type="checkbox"
              checked={reglages.etapes_refaites.includes(lundi)}
              onChange={(e) =>
                changerReglages({
                  ...reglages,
                  etapes_refaites: e.target.checked
                    ? [...reglages.etapes_refaites, lundi]
                    : reglages.etapes_refaites.filter((l) => l !== lundi),
                })
              }
            />
            Cette étape était trop dure : la refaire la semaine suivante
          </label>
          <p className="texte-discret petit">
            Étapes : {Object.values(ETAPES).map((e) => e.titre).join(' · ')}. Semaine de progression actuelle : {effective}.
          </p>
        </section>
      )}

      <details className="carte">
        <summary>
          <strong>Les règles du programme</strong>
        </summary>
        <ul>
          {REGLES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        {!profil.reprise_jambes_validee && (
          <Message type="alerte">Reprise des jambes à faire valider par le kiné ou le médecin (Paramètres → Profil).</Message>
        )}
      </details>
    </>
  )
}

function BoutonsSeance({ jour, typeMuscu, legere }: { jour: JourSuivi; typeMuscu: 'A' | 'B'; legere: boolean }) {
  const p = jour.prevue
  if (p.categorie === 'muscu') {
    return (
      <div className="boutons-seance">
        <Link className="bouton bouton-principal" to={`/musculation/seance?type=${typeMuscu}&date=${p.date}${legere ? '&legere=1' : ''}`}>
          Commencer la séance {typeMuscu}
        </Link>
        <Link className="bouton" to={`/musculation/seance?type=${typeMuscu}&version=courte&date=${p.date}`}>
          Version courte (fatigue)
        </Link>
      </div>
    )
  }
  if (p.categorie === 'course' || p.categorie === 'optionnelle') {
    return (
      <div className="boutons-seance">
        <Link className="bouton bouton-principal" to={`/course/saisie?type=${p.typeCourse ?? 'facile'}&date=${p.date}`}>
          Noter ma course
        </Link>
        {p.categorie === 'optionnelle' ? (
          <Link className="bouton" to={`/programme/autre?activite=marche&duree=30&date=${p.date}`}>
            Marche active à la place
          </Link>
        ) : (
          <Link className="bouton" to={`/course/saisie?type=facile&courte=1&date=${p.date}`}>
            Version courte (20 min)
          </Link>
        )}
      </div>
    )
  }
  return null
}

function CarteJour({ j, typeMuscu, legere }: { j: JourSuivi; typeMuscu: 'A' | 'B'; legere: boolean }) {
  const s = STATUTS[j.statut]
  const p = j.prevue
  const actif = j.statut === 'aujourdhui' || j.statut === 'manquee' || j.statut === 'a_venir'
  return (
    <section className={`carte carte-jour statut-${j.statut}`}>
      <div className="carte-entete">
        <h3>
          {NOMS_JOURS[p.jour]} <span className="texte-discret">{formatJour(p.date)}</span>
        </h3>
        <Badge type={s.type}>{s.texte}</Badge>
      </div>
      <p>
        <strong>{p.categorie === 'muscu' && j.muscu.length === 0 ? `${p.titre}` : p.titre}</strong>
      </p>
      {p.detail && <p className="texte-discret petit">{p.detail}</p>}
      {p.categorie !== 'repos' && <p className="texte-discret petit">Jour de fatigue : {p.versionCourte}</p>}

      {j.courses.map((c, i) => (
        <p key={`c${i}`} className="fait">
          🏃‍♀️ {formatNombre(c.distance_km, 2)} km · {formatAllure(c.allure_s_km)}
        </p>
      ))}
      {j.muscu.map((m, i) => (
        <p key={`m${i}`} className="fait">
          🏋️‍♀️ Séance {m.type}
          {m.version === 'courte' ? ' (courte)' : ''}
        </p>
      ))}
      {j.autres.map((a, i) => (
        <p key={`a${i}`} className="fait">
          🚶‍♀️ {NOMS_ACTIVITES[a.activite]} {a.duree_min} min
        </p>
      ))}
      {actif && j.statut !== 'a_venir' && <BoutonsSeance jour={j} typeMuscu={typeMuscu} legere={legere} />}
      {j.statut === 'repos' && (
        <Link className="bouton bouton-petit" to={`/programme/autre?activite=marche&date=${p.date}`}>
          Noter une marche
        </Link>
      )}
    </section>
  )
}
