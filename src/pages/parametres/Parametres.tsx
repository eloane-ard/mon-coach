// Paramètres : accès au compte, au profil, aux objectifs et aux sauvegardes.
import { Link } from 'react-router'
import { supabaseConfigure } from '../../config'
import { useEtatSynchro, useInfosSynchro } from '../../donnees/service-synchro'

export default function Parametres() {
  const etat = useEtatSynchro()
  const infos = useInfosSynchro()
  const dateVersion = new Date(__DATE_VERSION__).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })

  const resumeCompte = !supabaseConfigure()
    ? 'Mode local (base en ligne pas encore branchée)'
    : etat.session
      ? `Connectée · ${infos?.aEnvoyer ? `${infos.aEnvoyer} en attente d’envoi` : 'tout est synchronisé'}`
      : 'Non connectée'

  return (
    <>
      <nav className="liste-liens">
        <Link to="/parametres/compte" className="lien-ligne">
          <span>👤</span>
          <span>
            <strong>Compte et synchronisation</strong>
            <small>{resumeCompte}</small>
          </span>
        </Link>
        <Link to="/parametres/profil" className="lien-ligne">
          <span>🪪</span>
          <span>
            <strong>Profil</strong>
            <small>Âge, taille, santé, début du programme</small>
          </span>
        </Link>
        <Link to="/parametres/objectifs" className="lien-ligne">
          <span>🎯</span>
          <span>
            <strong>Objectifs</strong>
            <small>Silhouette, sport, nutrition, budget</small>
          </span>
        </Link>
        <Link to="/parametres/sauvegardes" className="lien-ligne">
          <span>💾</span>
          <span>
            <strong>Sauvegardes</strong>
            <small>État des sauvegardes, export, restauration</small>
          </span>
        </Link>
      </nav>

      <section className="carte">
        <h2>À propos</h2>
        <dl className="liste-infos">
          <dt>Version de l’appli</dt>
          <dd>{dateVersion}</dd>
          <dt>Mode d’affichage</dt>
          <dd>{modeAffichage()}</dd>
        </dl>
        <p className="texte-discret petit">
          Cette appli ne remplace pas un professionnel de santé. Les besoins nutritionnels affichés sont des estimations.
        </p>
      </section>
    </>
  )
}

/** Indique si l'appli est ouverte depuis l'écran d'accueil (installée) ou dans le navigateur. */
function modeAffichage(): string {
  const installee =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return installee ? 'Appli installée (écran d’accueil)' : 'Navigateur'
}
