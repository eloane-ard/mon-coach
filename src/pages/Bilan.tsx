// « Préparer mon bilan » : génère un texte à copier dans une conversation avec Claude.
import { useState } from 'react'
import { Choix, ChampDate, Message } from '../composants/formulaire'
import { RECETTES } from '../contenu/recettes'
import { useListe } from '../donnees/depot'
import { useCourses, useMesures, useObjectifs, useProfil, useReglagesProgramme, useSeancesAutres, useSeancesMuscu } from '../donnees/hooks'
import { useAliments } from '../donnees/hooks-nutrition'
import { bornes, genererBilan, type PeriodeBilan } from '../modele/bilan'
import type { PlanningSemaine } from '../modele/planning'
import { aujourdhui, formatJour } from '../utils/dates'

export default function Bilan() {
  const profil = useProfil()
  const objectifs = useObjectifs()
  const reglages = useReglagesProgramme()
  const mesures = useMesures()
  const courses = useCourses()
  const muscu = useSeancesMuscu()
  const autres = useSeancesAutres()
  const plannings = useListe<PlanningSemaine>('planning_semaine')
  const { index } = useAliments()
  const [periode, setPeriode] = useState<PeriodeBilan>('semaine')
  const [fin, setFin] = useState(aujourdhui())
  const [copie, setCopie] = useState<string | null>(null)

  if (!mesures || !courses || !muscu || !autres || !plannings) return <p className="texte-discret">Chargement…</p>

  const texte = genererBilan(periode, fin, {
    profil,
    objectifs,
    reglages,
    mesures: mesures.map((x) => x.donnees),
    courses: courses.map((x) => x.donnees),
    muscu: muscu.map((x) => x.donnees),
    autres: autres.map((x) => x.donnees),
    plannings: plannings.map((x) => x.donnees),
    recettes: RECETTES,
    aliments: index,
  })
  const b = bornes(periode, fin)

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte)
      setCopie('Bilan copié ! Colle-le dans une conversation avec Claude.')
    } catch {
      setCopie('Copie automatique impossible : sélectionne le texte ci-dessous et copie-le.')
    }
  }

  return (
    <>
      <section className="carte">
        <h2>Préparer mon bilan</h2>
        <p className="texte-discret">
          Un résumé de tes données, à coller dans une conversation avec Claude pour faire le point. Aucune photo n’est incluse.
        </p>
        <Choix
          options={[
            { valeur: 'semaine' as const, texte: 'Semaine' },
            { valeur: 'mois' as const, texte: '30 derniers jours' },
          ]}
          valeur={periode}
          onChange={setPeriode}
        />
        <ChampDate libelle={periode === 'semaine' ? 'Un jour de la semaine voulue' : 'Jusqu’au'} valeur={fin} onChange={setFin} />
        <p className="texte-discret petit">
          Du {formatJour(b.debut)} au {formatJour(b.fin)}
        </p>
        <button className="bouton bouton-principal bouton-large" onClick={copier}>
          📋 Copier le bilan
        </button>
        {copie && <Message type="succes">{copie}</Message>}
      </section>
      <pre className="bilan-texte">{texte}</pre>
    </>
  )
}
