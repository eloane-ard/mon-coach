// Petit bandeau qui signale un problème de synchronisation ou une connexion à faire.
// Il n'apparaît que lorsqu'il y a quelque chose à faire (ce n'est pas une notification).
import { Link, useLocation } from 'react-router'
import { supabaseConfigure } from '../config'
import { useEtatSynchro, useInfosSynchro } from '../donnees/service-synchro'

export default function BandeauSynchro() {
  const etat = useEtatSynchro()
  const infos = useInfosSynchro()
  const { pathname } = useLocation()
  if (!supabaseConfigure() || pathname === '/parametres/compte' || !etat.sessionChargee) return null

  if (!etat.session) {
    return (
      <Link to="/parametres/compte" className="bandeau bandeau-alerte">
        Connecte-toi pour que tes données soient sauvegardées en ligne. ›
      </Link>
    )
  }
  if (etat.erreur && navigator.onLine) {
    return (
      <Link to="/parametres/compte" className="bandeau bandeau-alerte">
        Synchronisation en échec ({infos?.aEnvoyer ?? '?'} en attente, gardées sur l’appareil). ›
      </Link>
    )
  }
  return null
}
