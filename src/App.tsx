// Structure générale : en-tête, menu, contenu de la page.
import { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { ESPACES, espaceDuChemin } from './navigation'
import Menu from './composants/Menu'
import BandeauMiseAJour from './composants/BandeauMiseAJour'
import { useEnLigne } from './composants/useEnLigne'
import Accueil from './pages/Accueil'
import BientotDisponible from './pages/BientotDisponible'
import Parametres from './pages/Parametres'

export default function App() {
  const [menuOuvert, setMenuOuvert] = useState(false)
  const enLigne = useEnLigne()
  const { pathname } = useLocation()
  const espace = espaceDuChemin(pathname)

  // On ferme le menu et on remonte en haut de page à chaque changement d'espace.
  useEffect(() => {
    setMenuOuvert(false)
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="appli">
      <header className="entete">
        <button
          className="bouton-menu"
          onClick={() => setMenuOuvert(!menuOuvert)}
          aria-expanded={menuOuvert}
          aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {menuOuvert ? '✕' : '☰'}
        </button>
        <h1 className="entete-titre">{espace?.titre ?? 'Mon Coach'}</h1>
        {!enLigne && <span className="pastille-hors-ligne">Hors connexion</span>}
      </header>

      <Menu ouvert={menuOuvert} />

      <main className="contenu">
        <BandeauMiseAJour />
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/parametres" element={<Parametres />} />
          {ESPACES.filter((e) => !['/', '/parametres'].includes(e.chemin)).map((e) => (
            <Route key={e.chemin} path={e.chemin} element={<BientotDisponible espace={e} />} />
          ))}
          <Route path="*" element={<Accueil />} />
        </Routes>
      </main>
    </div>
  )
}
