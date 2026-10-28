// Planning des repas sur 7 jours : génération automatique, alternatives, case « j'ai suivi le plan ».
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Message } from '../../composants/formulaire'
import { NOMS_REPAS, RECETTES, recette } from '../../contenu/recettes'
import { enregistrer, useEnregistrement } from '../../donnees/depot'
import { useObjectifs } from '../../donnees/hooks'
import { useAliments, useFavoris } from '../../donnees/hooks-nutrition'
import { idStable, valeursPortion } from '../../modele/nutrition'
import {
  alternatives,
  genererPlanning,
  listeCourses,
  remplacerRepas,
  REPAS_DU_JOUR,
  suiviPlanning,
  totalJour,
  totalSemaine,
  type PlanningSemaine,
} from '../../modele/planning'
import { ajouterJours, aujourdhui, formatJour, lundiDe, NOMS_JOURS } from '../../utils/dates'
import { formatNombre, formatPrix } from '../../utils/nombres'
import type { Repas } from '../../contenu/recettes'

export const idPlanning = (lundi: string) => idStable(`planning:${lundi}`)

export function usePlanning(lundi: string) {
  return useEnregistrement<PlanningSemaine>(idPlanning(lundi))
}

export function enregistrerPlanning(p: PlanningSemaine) {
  return enregistrer('planning_semaine', p, idPlanning(p.lundi))
}

function useSemaineChoisie(): [string, (l: string) => void] {
  const [params, setParams] = useSearchParams()
  const lundi = params.get('semaine') ?? lundiDe(aujourdhui())
  return [lundi, (l) => setParams({ semaine: l }, { replace: true })]
}

export function NavigationSemaine({ lundi, onChange }: { lundi: string; onChange: (l: string) => void }) {
  const courante = lundiDe(aujourdhui())
  return (
    <div className="navigation-semaine">
      <button className="bouton bouton-petit" onClick={() => onChange(ajouterJours(lundi, -7))} aria-label="Semaine précédente">
        ‹
      </button>
      <div>
        <strong>{lundi === courante ? 'Cette semaine' : lundi === ajouterJours(courante, 7) ? 'Semaine prochaine' : 'Semaine'}</strong>
        <small>
          du {formatJour(lundi)} au {formatJour(ajouterJours(lundi, 6))}
        </small>
      </div>
      <button className="bouton bouton-petit" onClick={() => onChange(ajouterJours(lundi, 7))} aria-label="Semaine suivante">
        ›
      </button>
    </div>
  )
}

export function PagePlanning() {
  const [lundi, setLundi] = useSemaineChoisie()
  const enr = usePlanning(lundi)
  const { index } = useAliments()
  const favoris = useFavoris()
  const objectifs = useObjectifs()
  const jour = aujourdhui()

  if (enr === undefined) return <p className="texte-discret">Chargement…</p>

  async function generer(remplacer: boolean) {
    if (remplacer && !confirm('Remplacer tout le planning de cette semaine par un nouveau ?')) return
    const p = genererPlanning(lundi, { recettes: RECETTES, aliments: index, objectifs, favoris, graine: Math.floor(Math.random() * 1e9) })
    await enregistrerPlanning(p)
  }

  if (!enr) {
    return (
      <>
        <NavigationSemaine lundi={lundi} onChange={setLundi} />
        <section className="carte">
          <h2>Pas encore de planning</h2>
          <p className="texte-discret">
            L’appli propose un menu de 7 jours qui respecte tes repères (calories, protéines), avec des plats de 30 minutes maximum en
            semaine. Le plat du soir est cuisiné pour 2 : la 2e portion fait le déjeuner du lendemain.
          </p>
          <button className="bouton bouton-principal bouton-large" onClick={() => generer(false)}>
            Proposer un planning
          </button>
        </section>
      </>
    )
  }

  const p = enr.donnees
  const semaine = totalSemaine(p, RECETTES, index)
  const cout = listeCourses(p, RECETTES, index).coutUtilise
  const suivi = suiviPlanning(p)

  async function basculerSuivi(j: number, repas: Repas) {
    const actuel = p.jours[j][repas]
    if (!actuel) return
    const suivant = actuel.suivi === null ? true : actuel.suivi === true ? false : null
    const jours = p.jours.map((x, i) => (i === j ? { ...x, [repas]: { ...actuel, suivi: suivant } } : x))
    await enregistrerPlanning({ ...p, jours })
  }

  return (
    <>
      <NavigationSemaine lundi={lundi} onChange={setLundi} />
      <section className="carte">
        <div className="grille-chiffres">
          <div className="chiffre">
            <span className="chiffre-libelle">Moyenne par jour</span>
            <span className="chiffre-valeur">{Math.round(semaine.kcal / 7)} kcal</span>
            <span className="chiffre-detail">
              {formatNombre(semaine.proteines / 7, 0)} g de protéines · objectif {objectifs.kcal_min}–{objectifs.kcal_max} kcal
            </span>
          </div>
          <div className="chiffre">
            <span className="chiffre-libelle">Coût estimé</span>
            <span className="chiffre-valeur">{formatPrix(cout)}</span>
            <span className="chiffre-detail">
              budget {objectifs.budget_courses_min}–{objectifs.budget_courses_max} €
            </span>
          </div>
        </div>
        {objectifs.budget_courses_max && cout > objectifs.budget_courses_max && (
          <p className="texte-alerte petit">
            Au-dessus du budget : remplace un plat par une recette moins chère (lentilles, œufs, pâtes au thon…) ou ajuste les
            prix des aliments avec tes tickets.
          </p>
        )}
        <p className="texte-discret petit">
          Repas suivis : {suivi.suivis}/{suivi.renseignes} renseignés · Estimations (± 10 à 15 %).
        </p>
        <div className="boutons-seance">
          <Link className="bouton bouton-principal" to={`/courses?semaine=${lundi}`}>
            🛒 Liste de courses
          </Link>
          <button className="bouton" onClick={() => generer(true)}>
            Nouveau planning
          </button>
        </div>
      </section>

      {p.jours.map((j, i) => {
        const date = ajouterJours(lundi, i)
        const t = totalJour(j, RECETTES, index)
        return (
          <section className={`carte carte-jour ${date === jour ? 'statut-aujourdhui' : ''}`} key={i}>
            <div className="carte-entete">
              <h3>
                {NOMS_JOURS[i]} <span className="texte-discret">{formatJour(date)}</span>
              </h3>
              <span className="texte-discret petit">
                {Math.round(t.kcal)} kcal · {formatNombre(t.proteines, 0)} g P
              </span>
            </div>
            {REPAS_DU_JOUR.map((repas) => {
              const pr = j[repas]
              const r = pr ? recette(pr.recette_id) : undefined
              return (
                <div className="ligne-repas" key={repas}>
                  <span className="repas-nom">{NOMS_REPAS[repas]}</span>
                  {r && pr ? (
                    <>
                      <Link to={`/recettes/${r.id}`} className="repas-recette">
                        {r.nom}
                        <small>
                          {Math.round(valeursPortion(r, index).kcal * pr.portions)} kcal
                          {pr.portions !== 1 ? ` · ${formatNombre(pr.portions, 2)} portion` : ''}
                          {repas === 'dejeuner' && p.jours[(i + 6) % 7].diner?.recette_id === r.id ? ' · restes de la veille' : ''}
                        </small>
                      </Link>
                      <button
                        className={`bouton-suivi suivi-${String(pr.suivi)}`}
                        onClick={() => basculerSuivi(i, repas)}
                        aria-label={`J’ai suivi le plan : ${pr.suivi === null ? 'non renseigné' : pr.suivi ? 'oui' : 'non'}`}
                      >
                        {pr.suivi === null ? '○' : pr.suivi ? '✓' : '✗'}
                      </button>
                      <Link className="bouton bouton-petit" to={`/planning-repas/changer?semaine=${lundi}&jour=${i}&repas=${repas}`}>
                        ⇄
                      </Link>
                    </>
                  ) : (
                    <Link className="bouton bouton-petit" to={`/planning-repas/changer?semaine=${lundi}&jour=${i}&repas=${repas}`}>
                      ＋ Ajouter
                    </Link>
                  )}
                </div>
              )
            })}
          </section>
        )
      })}
      <p className="texte-discret petit">○ pas renseigné · ✓ j’ai suivi le plan · ✗ pas suivi (toucher pour changer)</p>
    </>
  )
}

export function ChangerRepas() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const lundi = params.get('semaine') ?? lundiDe(aujourdhui())
  const jour = Number(params.get('jour') ?? 0)
  const repas = (params.get('repas') ?? 'diner') as Repas
  const enr = usePlanning(lundi)
  const { index } = useAliments()
  const favoris = useFavoris()
  const [avecRestes, setAvecRestes] = useState(true)

  if (enr === undefined) return <p className="texte-discret">Chargement…</p>
  if (!enr) return <Message type="erreur">Pas de planning pour cette semaine.</Message>
  const p = enr.donnees
  const actuel = p.jours[jour]?.[repas]?.recette_id ?? ''
  const liste = alternatives(RECETTES, repas, actuel, index).sort((a, b) => Number(favoris.has(b.id)) - Number(favoris.has(a.id)))
  const lie =
    repas === 'diner'
      ? p.jours[(jour + 1) % 7].dejeuner?.recette_id === actuel
      : repas === 'dejeuner'
        ? p.jours[(jour + 6) % 7].diner?.recette_id === actuel
        : false

  async function choisir(id: string | null) {
    if (id === null) {
      const jours = p.jours.map((x, i) => (i === jour ? { ...x, [repas]: null } : x))
      await enregistrerPlanning({ ...p, jours })
    } else {
      await enregistrerPlanning(remplacerRepas(p, jour, repas, id, avecRestes))
    }
    navigate(-1)
  }

  const refKcal = actuel && recette(actuel) ? valeursPortion(recette(actuel)!, index).kcal : null

  return (
    <>
      <section className="carte">
        <h2>
          {NOMS_REPAS[repas]} du {NOMS_JOURS[jour].toLowerCase()}
        </h2>
        {actuel && (
          <p className="texte-discret">
            Actuellement : {recette(actuel)?.nom} ({refKcal} kcal)
          </p>
        )}
        {lie && (
          <label className="case">
            <input type="checkbox" checked={avecRestes} onChange={(e) => setAvecRestes(e.target.checked)} />
            Changer aussi {repas === 'diner' ? 'le déjeuner du lendemain (restes)' : 'le dîner de la veille (même plat)'}
          </label>
        )}
        {actuel && (
          <button className="bouton bouton-petit bouton-danger" onClick={() => choisir(null)}>
            Retirer ce repas
          </button>
        )}
      </section>
      {liste.map((r) => {
        const v = valeursPortion(r, index)
        return (
          <button key={r.id} className="carte carte-recette carte-bouton" onClick={() => choisir(r.id)}>
            <strong>
              {favoris.has(r.id) && <span className="etoile">★ </span>}
              {r.nom}
            </strong>
            <span className="texte-discret petit">
              {v.kcal} kcal · {formatNombre(v.proteines, 0)} g de protéines · {r.temps_min} min · ≈ {formatPrix(v.prix)}
            </span>
          </button>
        )
      })}
    </>
  )
}
