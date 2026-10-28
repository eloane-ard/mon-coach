// Liste de courses générée depuis le planning de la semaine : regroupée par rayon, avec le budget.
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ChampTexte, Message } from '../../composants/formulaire'
import { RECETTES } from '../../contenu/recettes'
import { enregistrer, useEnregistrement } from '../../donnees/depot'
import { useObjectifs } from '../../donnees/hooks'
import { useAliments } from '../../donnees/hooks-nutrition'
import { idStable } from '../../modele/nutrition'
import { listeCourses, texteListe } from '../../modele/planning'
import { aujourdhui, lundiDe } from '../../utils/dates'
import { formatNombre, formatPrix } from '../../utils/nombres'
import { NavigationSemaine, usePlanning } from './Planning'

interface CoursesSemaine {
  lundi: string
  /** Articles cochés (achetés ou déjà dans les placards). */
  coches: Record<string, boolean>
  /** Articles ajoutés à la main. */
  ajouts: { texte: string; coche: boolean }[]
}

export function PageCourses() {
  const [params, setParams] = useSearchParams()
  const lundi = params.get('semaine') ?? lundiDe(aujourdhui())
  const planning = usePlanning(lundi)
  const idListe = idStable(`courses:${lundi}`)
  const etat = useEnregistrement<CoursesSemaine>(idListe)
  const { index } = useAliments()
  const objectifs = useObjectifs()
  const [ajout, setAjout] = useState('')
  const [copie, setCopie] = useState<string | null>(null)

  const liste = useMemo(() => (planning ? listeCourses(planning.donnees, RECETTES, index) : null), [planning, index])
  if (planning === undefined || etat === undefined) return <p className="texte-discret">Chargement…</p>

  const changerSemaine = (l: string) => setParams({ semaine: l }, { replace: true })
  const e: CoursesSemaine = etat?.donnees ?? { lundi, coches: {}, ajouts: [] }
  const sauver = (n: CoursesSemaine) => enregistrer('courses_semaine', n, idListe)

  if (!planning || !liste) {
    return (
      <>
        <NavigationSemaine lundi={lundi} onChange={changerSemaine} />
        <Message type="info">
          Pas de planning pour cette semaine. <Link to={`/planning-repas?semaine=${lundi}`}>Créer le planning</Link>
        </Message>
      </>
    )
  }

  const restant = liste.parRayon.flatMap((g) => g.lignes).filter((l) => !e.coches[l.aliment.id])
  const coutRestant = restant.reduce((t, l) => t + l.coutPaquets, 0)

  async function copier() {
    const texte = [texteListe(liste!, e.coches), ...e.ajouts.filter((a) => !a.coche).map((a) => `☐ ${a.texte}`)].join('\n')
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ text: texte, title: 'Liste de courses' })
      else {
        await navigator.clipboard.writeText(texte)
        setCopie('Liste copiée : colle-la dans Notes ou un message.')
      }
    } catch {
      // partage annulé
    }
  }

  return (
    <>
      <NavigationSemaine lundi={lundi} onChange={changerSemaine} />
      <section className="carte">
        <div className="grille-chiffres">
          <div className="chiffre">
            <span className="chiffre-libelle">Coût des repas de la semaine</span>
            <span className="chiffre-valeur">{formatPrix(liste.coutUtilise)}</span>
            <span className="chiffre-detail">
              budget {objectifs.budget_courses_min}–{objectifs.budget_courses_max} €
            </span>
          </div>
          <div className="chiffre">
            <span className="chiffre-libelle">Ticket si tu achètes tout</span>
            <span className="chiffre-valeur">{formatPrix(coutRestant)}</span>
            <span className="chiffre-detail">paquets entiers, hors cases cochées</span>
          </div>
        </div>
        <p className="texte-discret petit">
          Prix estimés (marques distributeur Leclerc). Coche ce que tu as déjà : le ticket estimé baisse. Les paquets entamés
          servent les semaines suivantes.
        </p>
        <button className="bouton bouton-large" onClick={copier}>
          Copier / partager la liste
        </button>
        {copie && <Message type="succes">{copie}</Message>}
      </section>

      {liste.parRayon.map((g) => (
        <section className="carte" key={g.rayon}>
          <h3>{g.rayon}</h3>
          {g.lignes.map((l) => (
            <label key={l.aliment.id} className={`case ligne-course ${e.coches[l.aliment.id] ? 'cochee' : ''}`}>
              <input
                type="checkbox"
                checked={!!e.coches[l.aliment.id]}
                onChange={(ev) => sauver({ ...e, coches: { ...e.coches, [l.aliment.id]: ev.target.checked } })}
              />
              <span>
                <strong>{l.aliment.nom}</strong>
                <small>
                  {l.paquets} × {l.aliment.conditionnement} · {formatNombre(l.grammes, 0)} g utilisés · ≈ {formatPrix(l.coutPaquets)}
                </small>
              </span>
            </label>
          ))}
        </section>
      ))}

      <section className="carte">
        <h3>À ajouter moi-même</h3>
        {e.ajouts.map((a, i) => (
          <label key={i} className={`case ligne-course ${a.coche ? 'cochee' : ''}`}>
            <input
              type="checkbox"
              checked={a.coche}
              onChange={(ev) => sauver({ ...e, ajouts: e.ajouts.map((x, j) => (j === i ? { ...x, coche: ev.target.checked } : x)) })}
            />
            <span>{a.texte}</span>
          </label>
        ))}
        <form
          className="ligne-ajout"
          onSubmit={(ev) => {
            ev.preventDefault()
            if (!ajout.trim()) return
            sauver({ ...e, ajouts: [...e.ajouts, { texte: ajout.trim(), coche: false }] })
            setAjout('')
          }}
        >
          <ChampTexte libelle="Article" valeur={ajout} onChange={setAjout} placeholder="ex. papier toilette" />
          <button className="bouton">Ajouter</button>
        </form>
      </section>

      {liste.basiques.length > 0 && (
        <section className="carte">
          <h3>Placards : à vérifier</h3>
          <p className="texte-discret petit">Utilisés en petite quantité : vérifie qu’il en reste.</p>
          <p>{liste.basiques.map((l) => l.aliment.nom).join(' · ')}</p>
        </section>
      )}
    </>
  )
}
