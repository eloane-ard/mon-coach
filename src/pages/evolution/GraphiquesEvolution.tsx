// Graphiques de l'évolution physique : poids (pesées + moyenne 7 jours) et tour de taille.
import { Link } from 'react-router'
import { ChoixPeriode, GraphiqueLignes } from '../../composants/Graphique'
import { serie, type Mesure } from '../../modele/mesures'
import { dansPeriode, moyenneMobile, PERIODES } from '../../modele/statistiques'
import { aujourdhui } from '../../utils/dates'
import { usePeriode } from '../Statistiques'

export default function GraphiquesEvolution({ mesures }: { mesures: Mesure[] }) {
  const [periode, setPeriode] = usePeriode()
  if (mesures.length === 0) return null
  const m = dansPeriode(mesures, periode, aujourdhui())
  const pesees = serie(m, 'poids_kg')
  return (
    <>
      <ChoixPeriode options={PERIODES} valeur={periode} onChange={setPeriode} />
      <GraphiqueLignes
        titre="Poids (kg)"
        unite="kg"
        series={[
          { id: 'moyenne', nom: 'Moyenne 7 jours', couleur: 1, points: moyenneMobile(pesees) },
          { id: 'pesees', nom: 'Pesées', couleur: 2, forme: 'points', points: pesees },
        ]}
      />
      <GraphiqueLignes titre="Tour de taille (cm)" unite="cm" series={[{ id: 'taille', nom: 'Tour de taille', couleur: 1, points: serie(m, 'tour_taille_cm') }]} />
      <p className="texte-discret petit">
        Mensurations détaillées et estimations : <Link to="/statistiques">Historique et statistiques</Link>
      </p>
    </>
  )
}
