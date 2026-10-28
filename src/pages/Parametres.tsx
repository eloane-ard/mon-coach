// Paramètres : profil, objectifs et sauvegardes viendront dans les prochaines étapes de la V1.
export default function Parametres() {
  const dateVersion = new Date(__DATE_VERSION__).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  return (
    <>
      <section className="carte">
        <h2>Profil et objectifs</h2>
        <p className="texte-discret">Arrive à l’étape 4 de la V1.</p>
      </section>
      <section className="carte">
        <h2>Sauvegardes</h2>
        <p className="texte-discret">
          Export, restauration et état des sauvegardes arrivent à l’étape 6 de la V1.
        </p>
      </section>
      <section className="carte">
        <h2>À propos</h2>
        <dl className="liste-infos">
          <dt>Version de l’appli</dt>
          <dd>{dateVersion}</dd>
          <dt>Mode d’affichage</dt>
          <dd>{modeAffichage()}</dd>
        </dl>
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
