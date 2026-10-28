// Historique et statistiques : graphiques sur 7 jours, 30 jours, 3 mois, 6 mois, 1 an ou depuis le début.
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Badge } from '../composants/formulaire'
import { ChoixPeriode, GraphiqueBarres, GraphiqueLignes } from '../composants/Graphique'
import { EXERCICES, exercice } from '../contenu/exercices'
import { useListe } from '../donnees/depot'
import { useCourses, useMesures, useProfil, useSeancesAutres, useSeancesMuscu } from '../donnees/hooks'
import { serie, type ChampMesure } from '../modele/mesures'
import { suiviPlanning, type PlanningSemaine } from '../modele/planning'
import { activiteParSemaine, dansPeriode, debutPeriode, moyenneMobile, PERIODES, type IdPeriode } from '../modele/statistiques'
import { historiqueExercice } from '../modele/sport'
import { aujourdhui, formatJour, formatJourCourt } from '../utils/dates'

const CLE_PERIODE = 'mon-coach-periode'

export function usePeriode(parDefaut: IdPeriode = '3m'): [IdPeriode, (p: IdPeriode) => void] {
  const [p, setP] = useState<IdPeriode>(() => {
    try {
      return (localStorage.getItem(CLE_PERIODE) as IdPeriode) || parDefaut
    } catch {
      return parDefaut
    }
  })
  return [
    p,
    (n) => {
      setP(n)
      try {
        localStorage.setItem(CLE_PERIODE, n)
      } catch {
        // sans importance
      }
    },
  ]
}

const TOURS: { champ: ChampMesure; nom: string; couleur: 1 | 2 | 3 | 4 | 5 }[] = [
  { champ: 'tour_taille_cm', nom: 'Taille', couleur: 1 },
  { champ: 'tour_hanches_cm', nom: 'Hanches', couleur: 2 },
  { champ: 'tour_cuisse_cm', nom: 'Cuisse', couleur: 3 },
  { champ: 'tour_bras_cm', nom: 'Bras', couleur: 4 },
  { champ: 'tour_poitrine_cm', nom: 'Poitrine', couleur: 5 },
]

export default function Statistiques() {
  const [periode, setPeriode] = usePeriode()
  const mesures = useMesures()
  const courses = useCourses()
  const muscu = useSeancesMuscu()
  const autres = useSeancesAutres()
  const plannings = useListe<PlanningSemaine>('planning_semaine')
  const profil = useProfil()
  const [exo, setExo] = useState(EXERCICES[0].id)
  const jour = aujourdhui()

  const m = useMemo(() => dansPeriode((mesures ?? []).map((e) => e.donnees), periode, jour), [mesures, periode, jour])
  const c = useMemo(() => dansPeriode((courses ?? []).map((e) => e.donnees), periode, jour), [courses, periode, jour])
  const s = useMemo(() => dansPeriode((muscu ?? []).map((e) => e.donnees), periode, jour), [muscu, periode, jour])
  const a = useMemo(() => dansPeriode((autres ?? []).map((e) => e.donnees), periode, jour), [autres, periode, jour])

  if (!mesures || !courses || !muscu || !autres) return <p className="texte-discret">Chargement…</p>

  const pesees = serie(m, 'poids_kg')
  const debut = debutPeriode(periode, jour) ?? [profil.date_debut_programme, ...[...m, ...c, ...s, ...a].map((x) => x.date)].sort()[0]
  const semaines = activiteParSemaine(debut, jour, { courses: c, muscu: s, autres: a })
  const histo = historiqueExercice(s, exo)
  const ex = exercice(exo)!
  const suivis = (plannings ?? [])
    .map((p) => p.donnees)
    .filter((p) => p.lundi >= (debutPeriode(periode, jour) ?? '0000') && p.lundi <= jour)
    .sort((x, y) => x.lundi.localeCompare(y.lundi))
    .map((p) => ({ p, r: suiviPlanning(p) }))
    .filter((x) => x.r.renseignes > 0)

  return (
    <>
      <Link to="/statistiques/bilan" className="bouton bouton-principal bouton-large">
        📝 Préparer mon bilan
      </Link>
      <ChoixPeriode options={PERIODES} valeur={periode} onChange={setPeriode} />

      <h2 className="titre-section">Silhouette</h2>
      <GraphiqueLignes
        titre="Poids (kg) : pesées et moyenne sur 7 jours"
        unite="kg"
        series={[
          { id: 'moyenne', nom: 'Moyenne 7 jours', couleur: 1, points: moyenneMobile(pesees) },
          { id: 'pesees', nom: 'Pesées', couleur: 2, forme: 'points', points: pesees },
        ]}
      />
      <GraphiqueLignes
        titre="Mensurations (cm)"
        unite="cm"
        series={TOURS.map((t) => ({ id: t.champ, nom: t.nom, couleur: t.couleur, points: serie(m, t.champ) }))}
      />
      <GraphiqueLignes
        titre={
          <>
            Masse grasse (%) <Badge type="estimation">estimation</Badge>
          </>
        }
        unite="%"
        series={[{ id: 'mg', nom: 'Masse grasse', couleur: 1, estimation: true, points: serie(m, 'masse_grasse_pct') }]}
      />
      <GraphiqueLignes
        titre={
          <>
            Masse musculaire (kg) <Badge type="estimation">estimation</Badge>
          </>
        }
        unite="kg"
        series={[{ id: 'mm', nom: 'Masse musculaire', couleur: 1, estimation: true, points: serie(m, 'masse_musculaire_kg') }]}
      />
      <p className="texte-discret petit">
        Pointillés et points creux = estimations d’impédancemètre, utiles pour la tendance seulement.
      </p>

      <h2 className="titre-section">Course à pied</h2>
      <GraphiqueLignes
        titre="Allure par course (min/km, plus bas = plus rapide)"
        unite="min/km"
        decimales={2}
        series={[{ id: 'allure', nom: 'Allure', couleur: 1, points: c.map((x) => ({ date: x.date, valeur: x.allure_s_km / 60 })) }]}
      />
      <GraphiqueBarres
        titre="Distance par semaine (km)"
        unite="km"
        barres={semaines.map((w) => ({ cle: w.lundi, libelle: formatJourCourt(w.lundi).replace(/^\S+ /, ''), detail: `Semaine du ${formatJour(w.lundi)}`, valeur: w.km }))}
      />

      <h2 className="titre-section">Musculation</h2>
      <select className="selecteur" value={exo} onChange={(e) => setExo(e.target.value)} aria-label="Exercice">
        {EXERCICES.map((e) => (
          <option key={e.id} value={e.id}>
            {e.seance} · {e.nom}
          </option>
        ))}
      </select>
      <GraphiqueLignes
        titre={ex.avecCharge ? `${ex.nom} : charge (kg)` : `${ex.nom} : meilleure série (s)`}
        unite={ex.avecCharge ? 'kg' : 's'}
        series={[
          {
            id: 'charge',
            nom: ex.nom,
            couleur: 1,
            points: histo.map((h) => ({ date: h.date, valeur: ex.avecCharge ? h.chargeMax ?? 0 : Math.max(...h.series.map((x) => x.valeur ?? 0)) })),
          },
        ]}
      />

      <h2 className="titre-section">Régularité</h2>
      <GraphiqueBarres
        titre="Séances par semaine (course + musculation)"
        unite="séances"
        decimales={0}
        objectif={4}
        barres={semaines.map((w) => ({
          cle: w.lundi,
          libelle: formatJourCourt(w.lundi).replace(/^\S+ /, ''),
          detail: `Semaine du ${formatJour(w.lundi)} : ${w.courses} course(s), ${w.muscu} muscu${w.autres ? `, ${w.autres} autre(s)` : ''}`,
          valeur: w.courses + w.muscu,
        }))}
      />
      <GraphiqueBarres
        titre="Repas « j’ai suivi le plan » (%)"
        unite="%"
        decimales={0}
        barres={suivis.map(({ p, r }) => ({
          cle: p.lundi,
          libelle: formatJourCourt(p.lundi).replace(/^\S+ /, ''),
          detail: `Semaine du ${formatJour(p.lundi)} : ${r.suivis}/${r.renseignes} repas`,
          valeur: (r.suivis / r.renseignes) * 100,
        }))}
      />
    </>
  )
}
