// Bandeau affiché quand une nouvelle version de l'appli est disponible.
// La mise à jour n'est jamais forcée : c'est moi qui appuie sur le bouton,
// pour ne pas interrompre une saisie en cours. (Ce n'est pas une notification.)
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function BandeauMiseAJour() {
  const {
    needRefresh: [miseAJourDispo],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, enregistrement) {
      // Sur iPhone, l'appli reste souvent ouverte en arrière-plan :
      // on vérifie s'il existe une nouvelle version à chaque retour dans l'appli.
      if (!enregistrement) return
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') enregistrement.update().catch(() => {})
      })
    },
  })

  if (!miseAJourDispo) return null
  return (
    <div className="bandeau" role="status">
      <span>Une nouvelle version de l’appli est disponible.</span>
      <button className="bouton bouton-principal" onClick={() => updateServiceWorker(true)}>
        Mettre à jour
      </button>
    </div>
  )
}
