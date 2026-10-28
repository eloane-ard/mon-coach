// Accueil : tableau de bord de la semaine (programme, prochaine séance, performances, évolution, repas, régularité).
import { Link } from 'react-router'
import { Badge } from '../composants/formulaire'
import { NOMS_REPAS, RECETTES, recette } from '../contenu/recettes'
import { useCourses, useMesures, useObjectifs, useProfil, useReglagesProgramme, useSeancesAutres, useSeancesMuscu } from '../donnees/hooks'
import { useAliments } from '../donnees/hooks-nutrition'
import { moyennesHebdo, serie } from '../modele/mesures'
import { valeursPortion } from '../modele/nutrition'
import { REPAS_DU_JOUR, totalJour } from '../modele/planning'
import { etapeDe, numeroSemaine, prochaineSeancePrevue, programmeSemaine, regularite, semaineEffective, suiviSemaine } from '../modele/programme'
import { activiteParSemaine, semainesRegulieres } from '../modele/statistiques'
import { formatAllure, formatDuree, NOMS_TYPES_COURSE, prochaineSeance } from '../modele/sport'
import { ajouterJours, aujourdhui, formatJour, jourSemaine, lundiDe, NOMS_JOURS, NOMS_JOURS_COURTS } from '../utils/dates'
import { formatNombre } from '../utils/nombres'
import { enregistrerPlanning, usePlanning } from './nutrition/Planning'

export default function Accueil() {
  const profil = useProfil()
  const objectifs = useObjectifs()
  const reglages = useReglagesProgramme()
  const courses = useCourses()
  const muscu = useSeancesMuscu()
  const autres = useSeancesAutres()
  const mesures = useMesures()
  const jour = aujourdhui()
  const lundi = lundiDe(jour)
  const planning = usePlanning(lundi)
  const { index } = useAliments()

  if (!courses || !muscu || !autres || !mesures) return <p className="texte-discret">Chargement…</p>

  const faites = { courses: courses.map((x) => x.donnees), muscu: muscu.map((x) => x.donnees), autres: autres.map((x) => x.donnees) }
  const suivi = suiviSemaine(programmeSemaine(profil.date_debut_programme, lundi, reglages), jour, faites)
  const reg = regularite(suivi)
  const prochaine = prochaineSeancePrevue(suivi)
  const typeMuscu = prochaineSeance(faites.muscu)
  const semaine = numeroSemaine(profil.date_debut_programme, lundi)
  const etape = etapeDe(semaineEffective(profil.date_debut_programme, lundi, reglages))

  const derniereCourse = faites.courses.at(-1)
  const derniereMuscu = faites.muscu.at(-1)

  const m = mesures.map((x) => x.donnees)
  const semainesPoids = moyennesHebdo(serie(m, 'poids_kg'))
  const poidsSemaine = semainesPoids.at(-1)
  const premierPoids = semainesPoids[0]
  const tailles = serie(m, 'tour_taille_cm')

  const activite = activiteParSemaine(ajouterJours(lundi, -12 * 7), jour, faites)
  const enSerie = semainesRegulieres(activite, objectifs.seances_par_semaine_min ?? 4, lundi)

  const p = planning?.donnees
  const repasDuJour = p?.jours[jourSemaine(jour)]
  const totalDuJour = repasDuJour ? totalJour(repasDuJour, RECETTES, index) : null

  async function basculer(repas: (typeof REPAS_DU_JOUR)[number]) {
    if (!p || !repasDuJour) return
    const actuel = repasDuJour[repas]
    if (!actuel) return
    const suivant = actuel.suivi === null ? true : actuel.suivi === true ? false : null
    const j = jourSemaine(jour)
    await enregistrerPlanning({ ...p, jours: p.jours.map((x, i) => (i === j ? { ...x, [repas]: { ...actuel, suivi: suivant } } : x)) })
  }

  return (
    <>
      <section className="carte carte-bienvenue">
        <h2>Bonjour {profil.prenom} 👋</h2>
        <p className="texte-discret">
          {NOMS_JOURS[jourSemaine(jour)]} {formatJour(jour)}
          {semaine >= 1 ? ` · semaine ${semaine} du programme · ${etape.titre}` : ` · le programme commence le ${formatJour(profil.date_debut_programme)}`}
        </p>
      </section>

      <section className="carte">
        <div className="carte-entete">
          <h2>Ma semaine</h2>
          <Link to="/programme" className="bouton bouton-petit">
            Programme ›
          </Link>
        </div>
        <div className="semaine-points" aria-label="Séances de la semaine">
          {suivi.map((j) => (
            <div key={j.prevue.date} className={`jour-point statut-${j.statut}`} title={`${NOMS_JOURS[j.prevue.jour]} : ${j.prevue.titre}`}>
              <span>{NOMS_JOURS_COURTS[j.prevue.jour]}</span>
              <i>{j.statut === 'faite' ? '✓' : j.statut === 'manquee' ? '–' : j.prevue.categorie === 'repos' ? '' : '○'}</i>
            </div>
          ))}
        </div>
        <p>
          <strong>
            {reg.faites}/{reg.prevues} séances
          </strong>
          {reg.bonus > 0 && ` (+${reg.bonus})`}
          {enSerie > 0 && (
            <span className="texte-succes">
              {' '}
              · {enSerie} semaine{enSerie > 1 ? 's' : ''} régulière{enSerie > 1 ? 's' : ''} d’affilée
            </span>
          )}
        </p>
        {prochaine && (
          <div className="prochaine-accueil">
            <p>
              <strong>
                {prochaine.statut === 'aujourdhui' ? 'Aujourd’hui' : NOMS_JOURS[prochaine.prevue.jour]} :{' '}
                {prochaine.prevue.categorie === 'muscu' ? `musculation ${typeMuscu}` : prochaine.prevue.titre.toLowerCase()}
              </strong>
            </p>
            {prochaine.statut === 'aujourdhui' && (
              <Link
                className="bouton bouton-principal bouton-large"
                to={
                  prochaine.prevue.categorie === 'muscu'
                    ? `/musculation/seance?type=${typeMuscu}&date=${jour}`
                    : `/course/saisie?type=${prochaine.prevue.typeCourse ?? 'facile'}&date=${jour}`
                }
              >
                {prochaine.prevue.categorie === 'muscu' ? `Commencer la séance ${typeMuscu}` : 'Noter ma course'}
              </Link>
            )}
          </div>
        )}
      </section>

      {repasDuJour ? (
        <section className="carte">
          <div className="carte-entete">
            <h2>Mes repas du jour</h2>
            {totalDuJour && (
              <span className="texte-discret petit">
                {Math.round(totalDuJour.kcal)} kcal · {formatNombre(totalDuJour.proteines, 0)} g P
              </span>
            )}
          </div>
          {REPAS_DU_JOUR.map((repas) => {
            const pr = repasDuJour[repas]
            const r = pr ? recette(pr.recette_id) : undefined
            if (!r || !pr) return null
            return (
              <div className="ligne-repas ligne-repas-accueil" key={repas}>
                <span className="repas-nom">{NOMS_REPAS[repas]}</span>
                <Link to={`/recettes/${r.id}`} className="repas-recette">
                  {r.nom}
                  <small>{Math.round(valeursPortion(r, index).kcal * pr.portions)} kcal</small>
                </Link>
                <button className={`bouton-suivi suivi-${String(pr.suivi)}`} onClick={() => basculer(repas)} aria-label={`J’ai suivi le plan pour : ${NOMS_REPAS[repas]}`}>
                  {pr.suivi === null ? '○' : pr.suivi ? '✓' : '✗'}
                </button>
              </div>
            )
          })}
        </section>
      ) : (
        <section className="carte">
          <h2>Mes repas</h2>
          <p className="texte-discret">Pas encore de planning cette semaine.</p>
          <Link to="/planning-repas" className="bouton bouton-petit">
            Préparer le planning
          </Link>
        </section>
      )}

      <section className="carte">
        <div className="carte-entete">
          <h2>Où j’en suis</h2>
          <Link to="/evolution/saisie" className="bouton bouton-petit">
            ＋ Mesure
          </Link>
        </div>
        <div className="grille-chiffres">
          <div className="chiffre">
            <span className="chiffre-libelle">Poids moyen (semaine)</span>
            <span className="chiffre-valeur">{poidsSemaine ? `${formatNombre(poidsSemaine.moyenne)} kg` : '—'}</span>
            {poidsSemaine && premierPoids && poidsSemaine !== premierPoids && (
              <span className="chiffre-detail">{formatEcart(poidsSemaine.moyenne - premierPoids.moyenne, 'kg')} depuis le début</span>
            )}
          </div>
          <div className="chiffre">
            <span className="chiffre-libelle">Tour de taille</span>
            <span className="chiffre-valeur">{tailles.length ? `${formatNombre(tailles.at(-1)!.valeur)} cm` : '—'}</span>
            {tailles.length > 1 && <span className="chiffre-detail">{formatEcart(tailles.at(-1)!.valeur - tailles[0].valeur, 'cm')} depuis le début</span>}
          </div>
        </div>
        <p className="texte-discret petit">
          Objectif : −{objectifs.perte_masse_grasse_kg_min} à −{objectifs.perte_masse_grasse_kg_max} kg de masse grasse en {objectifs.duree_mois_min} à{' '}
          {objectifs.duree_mois_max} mois, soit {formatNombre(objectifs.perte_hebdo_kg_min)} à {formatNombre(objectifs.perte_hebdo_kg_max)} kg par semaine.
        </p>
      </section>

      <section className="carte">
        <h2>Dernières performances</h2>
        {!derniereCourse && !derniereMuscu && <p className="texte-discret">Rien de noté pour l’instant.</p>}
        {derniereCourse && (
          <p>
            🏃‍♀️ <strong>{formatAllure(derniereCourse.allure_s_km)}</strong> · {formatNombre(derniereCourse.distance_km, 2)} km en{' '}
            {formatDuree(derniereCourse.duree_s)} <Badge>{NOMS_TYPES_COURSE[derniereCourse.type]}</Badge>
            <br />
            <small className="texte-discret">{formatJour(derniereCourse.date)}</small>
          </p>
        )}
        {derniereMuscu && (
          <p>
            🏋️‍♀️ <strong>Séance {derniereMuscu.type}</strong> · {derniereMuscu.exercices.filter((e) => e.series.length).length} exercices
            <br />
            <small className="texte-discret">{formatJour(derniereMuscu.date)}</small>
          </p>
        )}
        <Link to="/statistiques" className="bouton bouton-petit">
          Graphiques ›
        </Link>
      </section>

      <nav className="grille-espaces">
        <Link to="/course/saisie" className="tuile">
          <span className="tuile-icone">🏃‍♀️</span>
          <span className="tuile-titre">Noter une course</span>
        </Link>
        <Link to="/courses" className="tuile">
          <span className="tuile-icone">🛒</span>
          <span className="tuile-titre">Liste de courses</span>
        </Link>
        <Link to="/recettes" className="tuile">
          <span className="tuile-icone">📖</span>
          <span className="tuile-titre">Recettes</span>
        </Link>
        <Link to="/parametres/sauvegardes" className="tuile">
          <span className="tuile-icone">💾</span>
          <span className="tuile-titre">Sauvegardes</span>
        </Link>
      </nav>

      <p className="note-sante">Cette appli ne remplace pas un professionnel de santé. Les besoins affichés sont des estimations.</p>
    </>
  )
}

function formatEcart(n: number, unite: string): string {
  const signe = n > 0 ? '+' : n < 0 ? '−' : '±'
  return `${signe}${formatNombre(Math.abs(n))} ${unite}`
}
