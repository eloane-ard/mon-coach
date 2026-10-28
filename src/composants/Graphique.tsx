// Graphiques simples en SVG (sans bibliothèque) : courbes et barres, avec info-bulle au toucher.
// Règles suivies : une seule échelle verticale par graphique, traits fins, légende dès 2 séries,
// tableau des données disponible, estimations visuellement distinguées (pointillés, points creux).
import { useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { depuisJour, formatJour, formatJourCourt } from '../utils/dates'
import { formatNombre } from '../utils/nombres'

export interface SerieGraphique {
  id: string
  nom: string
  /** Emplacement de couleur 1 à 5 (palette validée pour les daltonismes, clair et sombre). */
  couleur: 1 | 2 | 3 | 4 | 5
  points: { date: string; valeur: number }[]
  /** Série estimée (impédancemètre) : trait en pointillés et points creux. */
  estimation?: boolean
  /** « points » : seulement des points (pesées) ; « ligne » : courbe avec points. */
  forme?: 'ligne' | 'points'
}

const LARGEUR = 360
const MARGE = { haut: 12, droite: 8, bas: 22, gauche: 34 }

function graduations(min: number, max: number, n = 4): number[] {
  if (min === max) return [min]
  const brut = (max - min) / n
  const puissance = 10 ** Math.floor(Math.log10(brut))
  const pas = [1, 2, 2.5, 5, 10].map((m) => m * puissance).find((p) => p >= brut)!
  const debut = Math.ceil(min / pas) * pas
  const g: number[] = []
  for (let v = debut; v <= max + pas / 1000; v += pas) g.push(Math.round(v * 1000) / 1000)
  return g
}

export function GraphiqueLignes(props: {
  titre: ReactNode
  series: SerieGraphique[]
  unite: string
  hauteur?: number
  decimales?: number
  vide?: string
}) {
  const hauteur = props.hauteur ?? 170
  const [survol, setSurvol] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const idTitre = useId()
  const series = props.series.filter((s) => s.points.length > 0)
  const tous = series.flatMap((s) => s.points)

  const echelles = useMemo(() => {
    if (tous.length === 0) return null
    const temps = tous.map((p) => depuisJour(p.date).getTime())
    let t0 = Math.min(...temps)
    let t1 = Math.max(...temps)
    if (t0 === t1) {
      t0 -= 86_400_000 * 3
      t1 += 86_400_000 * 3
    }
    const vals = tous.map((p) => p.valeur)
    let v0 = Math.min(...vals)
    let v1 = Math.max(...vals)
    const marge = Math.max((v1 - v0) * 0.15, Math.abs(v1) * 0.01, 0.5)
    v0 -= marge
    v1 += marge
    const x = (d: string) => MARGE.gauche + ((depuisJour(d).getTime() - t0) / (t1 - t0)) * (LARGEUR - MARGE.gauche - MARGE.droite)
    const y = (v: number) => MARGE.haut + (1 - (v - v0) / (v1 - v0)) * (hauteur - MARGE.haut - MARGE.bas)
    return { x, y, t0, t1, ticks: graduations(v0, v1) }
  }, [tous, hauteur])

  if (!echelles) {
    return (
      <figure className="graphique">
        <figcaption className="graphique-titre">{props.titre}</figcaption>
        <p className="texte-discret petit graphique-vide">{props.vide ?? 'Pas encore de données sur cette période.'}</p>
      </figure>
    )
  }

  const dates = [...new Set(tous.map((p) => p.date))].sort()
  const datesAxe = [dates[0], dates[Math.floor((dates.length - 1) / 2)], dates.at(-1)!].filter((d, i, t) => t.indexOf(d) === i)

  function survoler(clientX: number) {
    const svg = svgRef.current
    if (!svg) return
    const r = svg.getBoundingClientRect()
    const xSvg = ((clientX - r.left) / r.width) * LARGEUR
    let meilleure = dates[0]
    for (const d of dates) if (Math.abs(echelles!.x(d) - xSvg) < Math.abs(echelles!.x(meilleure) - xSvg)) meilleure = d
    setSurvol(meilleure)
  }

  const valeursSurvol = survol
    ? series.map((s) => ({ s, p: s.points.find((p) => p.date === survol) })).filter((x) => x.p)
    : []

  return (
    <figure className="graphique viz" aria-labelledby={idTitre}>
      <figcaption id={idTitre} className="graphique-titre">
        {props.titre}
      </figcaption>
      {series.length >= 2 && (
        <div className="legende">
          {series.map((s) => (
            <span key={s.id}>
              <svg width="18" height="10" aria-hidden="true">
                <line x1="1" y1="5" x2="17" y2="5" className={`trait-${s.couleur}`} strokeDasharray={s.estimation ? '4 3' : undefined} />
              </svg>
              {s.nom}
            </span>
          ))}
        </div>
      )}
      <div className="graphique-zone">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${LARGEUR} ${hauteur}`}
          role="img"
          aria-label={`Graphique en ${props.unite}`}
          onPointerMove={(e) => survoler(e.clientX)}
          onPointerDown={(e) => survoler(e.clientX)}
          onPointerLeave={() => setSurvol(null)}
        >
          {echelles.ticks.map((t) => (
            <g key={t}>
              <line className="grille" x1={MARGE.gauche} x2={LARGEUR - MARGE.droite} y1={echelles.y(t)} y2={echelles.y(t)} />
              <text className="axe" x={MARGE.gauche - 6} y={echelles.y(t) + 4} textAnchor="end">
                {formatNombre(t, 1)}
              </text>
            </g>
          ))}
          {datesAxe.map((d, i) => (
            <text
              key={d}
              className="axe"
              x={echelles.x(d)}
              y={hauteur - 6}
              textAnchor={i === 0 ? 'start' : i === datesAxe.length - 1 ? 'end' : 'middle'}
            >
              {formatJourCourt(d)}
            </text>
          ))}
          {series.map((s) => {
            const pts = s.points.slice().sort((a, b) => a.date.localeCompare(b.date))
            const chemin = pts.map((p, i) => `${i ? 'L' : 'M'}${echelles.x(p.date).toFixed(1)},${echelles.y(p.valeur).toFixed(1)}`).join(' ')
            return (
              <g key={s.id}>
                {s.forme !== 'points' && pts.length > 1 && (
                  <path d={chemin} className={`trait-${s.couleur}`} fill="none" strokeDasharray={s.estimation ? '6 4' : undefined} />
                )}
                {pts.map((p) => (
                  <circle
                    key={p.date}
                    cx={echelles.x(p.date)}
                    cy={echelles.y(p.valeur)}
                    r={s.forme === 'points' ? 3.5 : pts.length > 40 ? 0 : 4}
                    className={s.estimation ? `point-creux-${s.couleur}` : `point-${s.couleur}`}
                  />
                ))}
              </g>
            )
          })}
          {survol && (
            <line className="curseur" x1={echelles.x(survol)} x2={echelles.x(survol)} y1={MARGE.haut} y2={hauteur - MARGE.bas} />
          )}
          {valeursSurvol.map(({ s, p }) => (
            <circle key={s.id} cx={echelles.x(p!.date)} cy={echelles.y(p!.valeur)} r={6} className={`point-${s.couleur} point-actif`} />
          ))}
          {/* Grande zone invisible : facile à toucher avec le doigt */}
          <rect x={0} y={0} width={LARGEUR} height={hauteur} fill="transparent" />
        </svg>
        {survol && valeursSurvol.length > 0 && (
          <div
            className="info-bulle"
            style={{ left: `${Math.min(75, Math.max(5, (echelles.x(survol) / LARGEUR) * 100 - 12))}%` }}
            role="status"
          >
            <strong>{formatJour(survol)}</strong>
            {valeursSurvol.map(({ s, p }) => (
              <span key={s.id}>
                <i className={`pastille-${s.couleur}`} /> {series.length > 1 ? `${s.nom} : ` : ''}
                {formatNombre(p!.valeur, props.decimales ?? 1)} {props.unite}
                {s.estimation ? ' (estimation)' : ''}
              </span>
            ))}
          </div>
        )}
      </div>
      <TableauDonnees series={series} unite={props.unite} decimales={props.decimales} />
    </figure>
  )
}

function TableauDonnees({ series, unite, decimales }: { series: SerieGraphique[]; unite: string; decimales?: number }) {
  const dates = [...new Set(series.flatMap((s) => s.points.map((p) => p.date)))].sort().reverse()
  return (
    <details className="tableau-donnees">
      <summary>Voir les données</summary>
      <div className="defilement">
        <table className="tableau">
          <thead>
            <tr>
              <th>Date</th>
              {series.map((s) => (
                <th key={s.id} className="nombre">
                  {s.nom}
                  {s.estimation ? ' (estim.)' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.map((d) => (
              <tr key={d}>
                <td>{formatJour(d)}</td>
                {series.map((s) => {
                  const p = s.points.find((x) => x.date === d)
                  return (
                    <td key={s.id} className="nombre">
                      {p ? `${formatNombre(p.valeur, decimales ?? 1)} ${unite}` : '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

/** Barres verticales (une par semaine), avec une ligne d'objectif facultative. */
export function GraphiqueBarres(props: {
  titre: ReactNode
  barres: { cle: string; libelle: string; valeur: number; detail?: string }[]
  unite: string
  objectif?: number
  decimales?: number
}) {
  const hauteur = 150
  const [survol, setSurvol] = useState<string | null>(null)
  const idTitre = useId()
  if (props.barres.length === 0) {
    return (
      <figure className="graphique">
        <figcaption className="graphique-titre">{props.titre}</figcaption>
        <p className="texte-discret petit graphique-vide">Pas encore de données sur cette période.</p>
      </figure>
    )
  }
  const max = Math.max(...props.barres.map((b) => b.valeur), props.objectif ?? 0, 1) * 1.15
  const ticks = graduations(0, max, 3)
  const zone = LARGEUR - MARGE.gauche - MARGE.droite
  const pas = zone / props.barres.length
  const largeurBarre = Math.min(24, pas - 2)
  const y = (v: number) => MARGE.haut + (1 - v / max) * (hauteur - MARGE.haut - MARGE.bas)
  const base = y(0)
  const etiquettes = props.barres.length <= 8 ? props.barres : props.barres.filter((_, i) => i % Math.ceil(props.barres.length / 6) === 0)
  const actif = props.barres.find((b) => b.cle === survol)

  return (
    <figure className="graphique viz" aria-labelledby={idTitre}>
      <figcaption id={idTitre} className="graphique-titre">
        {props.titre}
      </figcaption>
      <div className="graphique-zone">
        <svg viewBox={`0 0 ${LARGEUR} ${hauteur}`} role="img" aria-label={`Graphique en barres, ${props.unite}`} onPointerLeave={() => setSurvol(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line className="grille" x1={MARGE.gauche} x2={LARGEUR - MARGE.droite} y1={y(t)} y2={y(t)} />
              <text className="axe" x={MARGE.gauche - 6} y={y(t) + 4} textAnchor="end">
                {formatNombre(t, 1)}
              </text>
            </g>
          ))}
          {props.barres.map((b, i) => {
            const cx = MARGE.gauche + pas * i + pas / 2
            const h = base - y(b.valeur)
            const x0 = cx - largeurBarre / 2
            const r = Math.min(4, h, largeurBarre / 2)
            // Coins arrondis en haut seulement (la barre part de la ligne de base).
            const d =
              h <= 0
                ? ''
                : `M${x0},${base} V${base - h + r} Q${x0},${base - h} ${x0 + r},${base - h} H${x0 + largeurBarre - r} Q${x0 + largeurBarre},${base - h} ${x0 + largeurBarre},${base - h + r} V${base} Z`
            return (
              <g key={b.cle} onPointerEnter={() => setSurvol(b.cle)} onPointerDown={() => setSurvol(b.cle)}>
                <rect x={cx - pas / 2} y={MARGE.haut} width={pas} height={base - MARGE.haut} fill="transparent" />
                {d && <path d={d} className={`barre ${survol === b.cle ? 'barre-active' : ''}`} />}
              </g>
            )
          })}
          {props.objectif !== undefined && (
            <>
              <line className="ligne-objectif-graph" x1={MARGE.gauche} x2={LARGEUR - MARGE.droite} y1={y(props.objectif)} y2={y(props.objectif)} />
              <text className="axe" x={LARGEUR - MARGE.droite} y={y(props.objectif) - 4} textAnchor="end">
                objectif {formatNombre(props.objectif)}
              </text>
            </>
          )}
          <line className="axe-base" x1={MARGE.gauche} x2={LARGEUR - MARGE.droite} y1={base} y2={base} />
          {etiquettes.map((b) => {
            const i = props.barres.indexOf(b)
            return (
              <text key={b.cle} className="axe" x={MARGE.gauche + pas * i + pas / 2} y={hauteur - 6} textAnchor="middle">
                {b.libelle}
              </text>
            )
          })}
        </svg>
        {actif && (
          <div className="info-bulle" style={{ left: `${Math.min(70, Math.max(5, ((props.barres.indexOf(actif) + 0.5) / props.barres.length) * 100 - 12))}%` }} role="status">
            <strong>{actif.detail ?? actif.libelle}</strong>
            <span>
              {formatNombre(actif.valeur, props.decimales ?? 1)} {props.unite}
            </span>
          </div>
        )}
      </div>
      <details className="tableau-donnees">
        <summary>Voir les données</summary>
        <table className="tableau">
          <tbody>
            {props.barres
              .slice()
              .reverse()
              .map((b) => (
                <tr key={b.cle}>
                  <td>{b.detail ?? b.libelle}</td>
                  <td className="nombre">
                    {formatNombre(b.valeur, props.decimales ?? 1)} {props.unite}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

/** Sélecteur de période, à placer une seule fois au-dessus des graphiques. */
export function ChoixPeriode<T extends string>(props: { options: { id: T; nom: string }[]; valeur: T; onChange: (v: T) => void }) {
  return (
    <div className="choix choix-petit choix-periode" role="radiogroup" aria-label="Période">
      {props.options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={props.valeur === o.id} className={props.valeur === o.id ? 'choisi' : ''} onClick={() => props.onChange(o.id)}>
          {o.nom}
        </button>
      ))}
    </div>
  )
}
