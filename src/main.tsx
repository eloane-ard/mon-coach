// Point d'entrée : affiche l'appli dans la page.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import App from './App'
import './styles.css'

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    {/* HashRouter : les adresses ressemblent à « …/mon-coach/#/course ».
        C'est la méthode fiable sur GitHub Pages et hors connexion. */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
