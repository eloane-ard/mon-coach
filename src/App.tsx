// Structure générale : en-tête, menu, contenu de la page.
import { useEffect, useState, type ReactNode } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router'
import { ESPACES, SOUS_PAGES, espaceDuChemin, estDisponible } from './navigation'
import Menu from './composants/Menu'
import BandeauMiseAJour from './composants/BandeauMiseAJour'
import BandeauSynchro from './composants/BandeauSynchro'
import { useEnLigne } from './composants/useEnLigne'
import { useDemarrageSynchro } from './donnees/service-synchro'
import Accueil from './pages/Accueil'
import BientotDisponible from './pages/BientotDisponible'
import Evolution from './pages/evolution/Evolution'
import SaisieMesure from './pages/evolution/SaisieMesure'
import Parametres from './pages/parametres/Parametres'
import Compte from './pages/parametres/Compte'
import { PageObjectifs, PageProfil } from './pages/parametres/ProfilObjectifs'
import Sauvegardes from './pages/parametres/Sauvegardes'
import Programme from './pages/sport/Programme'
import { PageCourse, SaisieCourse } from './pages/sport/Course'
import { HistoriqueExercice, PageMusculation, SaisieSeance } from './pages/sport/Musculation'
import SaisieAutre from './pages/sport/SaisieAutre'

/** Pages déjà construites, par adresse. Les autres espaces affichent « Bientôt disponible ». */
const PAGES: Record<string, ReactNode> = {
  '/': <Accueil />,
  '/evolution': <Evolution />,
  '/evolution/saisie': <SaisieMesure />,
  '/programme': <Programme />,
  '/programme/autre': <SaisieAutre />,
  '/course': <PageCourse />,
  '/course/saisie': <SaisieCourse />,
  '/musculation': <PageMusculation />,
  '/musculation/seance': <SaisieSeance />,
  '/musculation/exercice/:id': <HistoriqueExercice />,
  '/parametres': <Parametres />,
  '/parametres/compte': <Compte />,
  '/parametres/profil': <PageProfil />,
  '/parametres/objectifs': <PageObjectifs />,
  '/parametres/sauvegardes': <Sauvegardes />,
}

export default function App() {
  const [menuOuvert, setMenuOuvert] = useState(false)
  const enLigne = useEnLigne()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const espace = espaceDuChemin(pathname)
  const sousPage = SOUS_PAGES[pathname] ?? (pathname.startsWith('/musculation/exercice/') ? 'Exercice' : undefined)
  useDemarrageSynchro()

  // On ferme le menu et on remonte en haut de page à chaque changement d'adresse.
  useEffect(() => {
    setMenuOuvert(false)
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="appli">
      <header className="entete">
        {sousPage ? (
          <button className="bouton-menu" onClick={() => navigate(-1)} aria-label="Retour">
            ‹
          </button>
        ) : (
          <button
            className="bouton-menu"
            onClick={() => setMenuOuvert(!menuOuvert)}
            aria-expanded={menuOuvert}
            aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {menuOuvert ? '✕' : '☰'}
          </button>
        )}
        <h1 className="entete-titre">{sousPage ?? espace?.titre ?? 'Mon Coach'}</h1>
        {!enLigne && <span className="pastille-hors-ligne">Hors connexion</span>}
      </header>

      <Menu ouvert={menuOuvert} />

      <main className="contenu">
        <BandeauMiseAJour />
        <BandeauSynchro />
        <Routes>
          {Object.entries(PAGES).map(([chemin, page]) => (
            <Route key={chemin} path={chemin} element={page} />
          ))}
          {ESPACES.filter((e) => !PAGES[e.chemin] || !estDisponible(e)).map((e) => (
            <Route key={e.chemin} path={e.chemin} element={<BientotDisponible espace={e} />} />
          ))}
          <Route path="*" element={<Accueil />} />
        </Routes>
      </main>
    </div>
  )
}
