// Évolution physique : résumé, historique des mesures, accès à la saisie.
import { useMemo } from 'react'
import { Link } from 'react-router'
import { Badge } from '../../composants/formulaire'
import { supprimer, useListe } from '../../donnees/depot'
import type { Enregistrement } from '../../donnees/types'
import {
  CHAMPS_MESURE,
  NOMS_SOURCES,
  estEstimation,
  moyennesHebdo,
  serie,
  type Mesure,
} from '../../modele/mesures'
import { formatJour, formatJourLong } from '../../utils/dates'
import { formatNombre } from '../../utils/nombres'
import GraphiquesEvolution from './GraphiquesEvolution'

export default function Evolution() {
  const liste = useListe<Mesure>('mesure')
  const triees = useMemo(
    () => (liste ?? []).slice().sort((a, b) => b.donnees.date.localeCompare(a.donnees.date)),
    [liste],
  )
  const mesures = triees.map((e) => e.donnees)
  const semaines = moyennesHebdo(serie(mesures, 'poids_kg'))
  const derniereSemaine = semaines.at(-1)
  const semainePrecedente = semaines.at(-2)
  const tailles = serie(mesures, 'tour_taille_cm')

  if (liste === undefined) return <p className="texte-discret">Chargement…</p>

  return (
    <>
      <Link to="/evolution/saisie" className="bouton bouton-principal bouton-large">
        ＋ Nouvelle mesure
      </Link>

      <section className="carte">
        <h2>Où j’en suis</h2>
        {mesures.length === 0 ? (
          <p className="texte-discret">Aucune mesure pour l’instant. Commence par ta pesée et tes mensurations.</p>
        ) : (
          <div className="grille-chiffres">
            <div className="chiffre">
              <span className="chiffre-libelle">Poids moyen cette semaine</span>
              <span className="chiffre-valeur">{derniereSemaine ? `${formatNombre(derniereSemaine.moyenne)} kg` : '—'}</span>
              {derniereSemaine && semainePrecedente && (
                <span className="chiffre-detail">
                  {formatEcart(derniereSemaine.moyenne - semainePrecedente.moyenne, 'kg')} vs semaine précédente
                </span>
              )}
            </div>
            <div className="chiffre">
              <span className="chiffre-libelle">Tour de taille</span>
              <span className="chiffre-valeur">{tailles.length ? `${formatNombre(tailles.at(-1)!.valeur)} cm` : '—'}</span>
              {tailles.length > 1 && (
                <span className="chiffre-detail">{formatEcart(tailles.at(-1)!.valeur - tailles[0].valeur, 'cm')} depuis le début</span>
              )}
            </div>
          </div>
        )}
        <p className="texte-discret petit">
          Le juge, c’est la moyenne de la semaine et le tour de taille, pas une pesée isolée.
        </p>
      </section>

      <GraphiquesEvolution mesures={mesures} />

      <h2 className="titre-section">Historique</h2>
      {triees.map((e) => (
        <CarteMesure key={e.id} enr={e} />
      ))}
    </>
  )
}

function formatEcart(n: number, unite: string): string {
  const signe = n > 0 ? '+' : n < 0 ? '−' : '±'
  return `${signe}${formatNombre(Math.abs(n))} ${unite}`
}

function CarteMesure({ enr }: { enr: Enregistrement<Mesure> }) {
  const m = enr.donnees
  return (
    <section className="carte carte-mesure">
      <div className="carte-entete">
        <h3>{formatJourLong(m.date)}</h3>
        <div className="actions-carte">
          <Link className="bouton bouton-petit" to={`/evolution/saisie?id=${enr.id}`}>
            Modifier
          </Link>
          <button
            className="bouton bouton-petit bouton-danger"
            onClick={() => {
              if (confirm(`Supprimer la mesure du ${formatJour(m.date)} ? (Elle reste récupérable dans les sauvegardes.)`))
                supprimer(enr.id)
            }}
          >
            Supprimer
          </button>
        </div>
      </div>
      <dl className="liste-mesures">
        {CHAMPS_MESURE.filter((c) => m.valeurs[c.champ] !== undefined).map((c) => {
          const estim = estEstimation(c.champ, m.sources[c.champ])
          return (
            <div key={c.champ} className={estim ? 'valeur-estimee' : ''}>
              <dt>
                {c.nom} {estim && <Badge type="estimation">estimation</Badge>}
              </dt>
              <dd>
                {formatNombre(m.valeurs[c.champ])} {c.unite}
                <span className="source"> · {NOMS_SOURCES[m.sources[c.champ] ?? 'autre']}</span>
              </dd>
            </div>
          )
        })}
      </dl>
      {m.note && <p className="texte-discret">{m.note}</p>}
    </section>
  )
}
