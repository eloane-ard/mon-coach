// Éléments de formulaire réutilisés partout : gros, lisibles, pensés pour le doigt.
import { useId, type ReactNode } from 'react'

/** Champ numérique : accepte la virgule (clavier iPhone français). */
export function ChampNombre(props: {
  libelle: string
  valeur: string
  onChange: (v: string) => void
  unite?: string
  placeholder?: string
  aide?: ReactNode
  entier?: boolean
  badge?: ReactNode
}) {
  const id = useId()
  return (
    <div className="champ">
      <label htmlFor={id}>
        {props.libelle} {props.badge}
      </label>
      <div className="champ-avec-unite">
        <input
          id={id}
          type="text"
          inputMode={props.entier ? 'numeric' : 'decimal'}
          autoComplete="off"
          value={props.valeur}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
        />
        {props.unite && <span className="unite">{props.unite}</span>}
      </div>
      {props.aide && <p className="aide">{props.aide}</p>}
    </div>
  )
}

export function ChampTexte(props: {
  libelle: string
  valeur: string
  onChange: (v: string) => void
  placeholder?: string
  multiligne?: boolean
  type?: string
  aide?: ReactNode
}) {
  const id = useId()
  return (
    <div className="champ">
      <label htmlFor={id}>{props.libelle}</label>
      {props.multiligne ? (
        <textarea id={id} rows={3} value={props.valeur} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} />
      ) : (
        <input
          id={id}
          type={props.type ?? 'text'}
          value={props.valeur}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
        />
      )}
      {props.aide && <p className="aide">{props.aide}</p>}
    </div>
  )
}

export function ChampDate(props: { libelle: string; valeur: string; onChange: (v: string) => void; aide?: ReactNode }) {
  const id = useId()
  return (
    <div className="champ">
      <label htmlFor={id}>{props.libelle}</label>
      <input id={id} type="date" value={props.valeur} onChange={(e) => props.onChange(e.target.value)} />
      {props.aide && <p className="aide">{props.aide}</p>}
    </div>
  )
}

/** Choix parmi quelques options, sous forme de gros boutons côte à côte. */
export function Choix<T extends string | number>(props: {
  libelle?: string
  options: { valeur: T; texte: ReactNode }[]
  valeur: T | null | undefined
  onChange: (v: T) => void
  petit?: boolean
}) {
  return (
    <div className="champ">
      {props.libelle && <span className="libelle">{props.libelle}</span>}
      <div className={`choix ${props.petit ? 'choix-petit' : ''}`} role="radiogroup" aria-label={props.libelle}>
        {props.options.map((o) => (
          <button
            type="button"
            key={String(o.valeur)}
            role="radio"
            aria-checked={props.valeur === o.valeur}
            className={props.valeur === o.valeur ? 'choisi' : ''}
            onClick={() => props.onChange(o.valeur)}
          >
            {o.texte}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Échelle de 0 (ou 1) à 10, par exemple pour la gêne au genou ou la difficulté. */
export function Echelle(props: {
  libelle: string
  valeur: number | null
  onChange: (v: number | null) => void
  min?: number
  max?: number
  aide?: ReactNode
}) {
  const min = props.min ?? 0
  const max = props.max ?? 10
  const valeurs = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  return (
    <div className="champ">
      <span className="libelle">{props.libelle}</span>
      <div className="echelle" role="radiogroup" aria-label={props.libelle}>
        {valeurs.map((v) => (
          <button
            type="button"
            key={v}
            role="radio"
            aria-checked={props.valeur === v}
            className={props.valeur === v ? 'choisi' : ''}
            onClick={() => props.onChange(props.valeur === v ? null : v)}
          >
            {v}
          </button>
        ))}
      </div>
      {props.aide && <p className="aide">{props.aide}</p>}
    </div>
  )
}

export function Message({ type, children }: { type: 'info' | 'succes' | 'alerte' | 'erreur'; children: ReactNode }) {
  return (
    <div className={`message message-${type}`} role={type === 'erreur' || type === 'alerte' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}

export function Badge({ type = 'neutre', children }: { type?: 'neutre' | 'estimation' | 'succes' | 'alerte'; children: ReactNode }) {
  return <span className={`badge badge-${type}`}>{children}</span>
}
