// Page affichée pour un espace qui n'est pas encore construit (ou en cours de construction).
import { Link } from 'react-router'
import { estDisponible, type Espace } from '../navigation'

export default function BientotDisponible({ espace }: { espace: Espace }) {
  return (
    <section className="carte page-vide">
      <span className="page-vide-icone" aria-hidden="true">{espace.icone}</span>
      <h2>{espace.titre}</h2>
      <p>{espace.resume}</p>
      <p className="texte-discret">
        {estDisponible(espace)
          ? 'En cours de construction dans cette version.'
          : `Bientôt disponible (V${espace.version}).`}
      </p>
      <Link to="/" className="bouton">Retour à l’accueil</Link>
    </section>
  )
}
