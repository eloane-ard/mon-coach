// Accueil provisoire : accès rapide à tous les espaces.
// Le vrai tableau de bord arrivera en V5.
import { Link } from 'react-router'
import { ESPACES, estDisponible } from '../navigation'

export default function Accueil() {
  const espaces = ESPACES.filter((e) => e.chemin !== '/')
  return (
    <>
      <section className="carte carte-bienvenue">
        <h2>Bonjour Eloane 👋</h2>
        <p>
          L’appli est en construction (V1 – Fondations). Les espaces marqués d’une version
          arriveront au fur et à mesure.
        </p>
      </section>

      <div className="grille-espaces">
        {espaces.map((e) => {
          const dispo = estDisponible(e)
          return (
            <Link key={e.chemin} to={e.chemin} className={`tuile ${dispo ? '' : 'tuile-a-venir'}`}>
              <span className="tuile-icone" aria-hidden="true">{e.icone}</span>
              <span className="tuile-titre">{e.titre}</span>
              {!dispo && <span className="badge-version">V{e.version}</span>}
            </Link>
          )
        })}
      </div>

      <p className="note-sante">
        Cette appli ne remplace pas un professionnel de santé. Les besoins affichés sont des
        estimations.
      </p>
    </>
  )
}
