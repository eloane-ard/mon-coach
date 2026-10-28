// Point d'entrée : affiche l'appli dans la page.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import App from './App'
import { demanderStockagePersistant } from './donnees/base-locale'
import './styles.css'

// Demande au navigateur de ne jamais effacer les données locales de lui-même.
demanderStockagePersistant()

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    {/* HashRouter : les adresses ressemblent à « …/mon-coach/#/course ».
        C'est la méthode fiable sur GitHub Pages et hors connexion. */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
