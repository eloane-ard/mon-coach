// Vérifie que l'appli s'affiche et que la navigation fonctionne.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

// Le service worker n'existe pas dans l'environnement de test : on le remplace par un faux.
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, () => {}], updateServiceWorker: () => {} }),
}))

const { default: App } = await import('../src/App')
const { default: BientotDisponible } = await import('../src/pages/BientotDisponible')

function afficher(adresse = '/') {
  return render(
    <MemoryRouter initialEntries={[adresse]}>
      <App />
    </MemoryRouter>,
  )
}

describe('appli', () => {
  it('affiche l’accueil avec une tuile par espace', () => {
    afficher('/')
    expect(screen.getByRole('heading', { level: 1, name: 'Accueil' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Musculation/ }).length).toBeGreaterThan(0)
  })

  it('affiche « Bientôt disponible » pour un espace des versions suivantes', () => {
    render(
      <MemoryRouter>
        <BientotDisponible espace={{ chemin: '/futur', titre: 'Futur', icone: '🚀', version: 99, resume: 'Plus tard.' }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Bientôt disponible (V99).')).toBeInTheDocument()
  })

  it('ouvre le menu et navigue vers les Paramètres', () => {
    afficher('/')
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    const menu = screen.getByRole('navigation', { name: 'Navigation principale' })
    fireEvent.click(menu.querySelector('a[href="/parametres"]')!)
    expect(screen.getByRole('heading', { level: 1, name: 'Paramètres' })).toBeInTheDocument()
  })

  it('signale quand il n’y a pas de réseau', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    afficher('/')
    expect(screen.getByText('Hors connexion')).toBeInTheDocument()
    vi.restoreAllMocks()
  })
})
