// Menu de navigation : panneau qui s'ouvre sur iPhone, colonne fixe sur grand écran (PC).
import { NavLink } from 'react-router'
import { ESPACES, estDisponible } from '../navigation'

export default function Menu({ ouvert }: { ouvert: boolean }) {
  return (
    <nav className={`menu ${ouvert ? 'menu-ouvert' : ''}`} aria-label="Navigation principale">
      <ul>
        {ESPACES.map((e) => (
          <li key={e.chemin}>
            <NavLink to={e.chemin} end className={({ isActive }) => `menu-lien ${isActive ? 'actif' : ''}`}>
              <span className="menu-icone" aria-hidden="true">{e.icone}</span>
              <span className="menu-titre">{e.titre}</span>
              {!estDisponible(e) && <span className="badge-version">V{e.version}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
