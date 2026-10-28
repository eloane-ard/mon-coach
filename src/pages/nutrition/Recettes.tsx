// Recettes : bibliothèque, filtres (envie, temps, ingrédients disponibles), favoris, fiche détaillée.
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Badge, Choix, Message } from '../../composants/formulaire'
import { NOMS_ENVIES, NOMS_REPAS, RECETTES, recette as trouverRecette, type Envie, type Repas } from '../../contenu/recettes'
import { changerFavori, useAliments, useFavoris } from '../../donnees/hooks-nutrition'
import {
  contientApproximatif,
  estVegetarienne,
  FILTRES_VIDES,
  filtrerRecettes,
  valeursPortion,
  type Filtres,
} from '../../modele/nutrition'
import { formatNombre, formatPrix } from '../../utils/nombres'

const CLE_FILTRES = 'mon-coach-filtres-recettes'

function lireFiltres(): Filtres {
  try {
    const t = sessionStorage.getItem(CLE_FILTRES)
    return t ? { ...FILTRES_VIDES, ...JSON.parse(t) } : FILTRES_VIDES
  } catch {
    return FILTRES_VIDES
  }
}

export function PageRecettes() {
  const { liste: aliments, index } = useAliments()
  const favoris = useFavoris()
  const [f, setF] = useState<Filtres>(lireFiltres)
  const [frigoOuvert, setFrigoOuvert] = useState(f.disponibles.length > 0)

  const changer = (nouveaux: Filtres) => {
    setF(nouveaux)
    try {
      sessionStorage.setItem(CLE_FILTRES, JSON.stringify(nouveaux))
    } catch {
      // sans importance
    }
  }
  const resultats = useMemo(() => filtrerRecettes(RECETTES, f, favoris, index), [f, favoris, index])
  const ingredientsPossibles = useMemo(() => {
    const utilises = new Set(RECETTES.flatMap((r) => r.ingredients.map((i) => i.aliment)))
    return aliments.filter((a) => utilises.has(a.id) && !a.basique)
  }, [aliments])

  return (
    <>
      <section className="carte filtres">
        <input
          type="search"
          className="recherche"
          placeholder="Rechercher une recette ou un ingrédient…"
          value={f.texte}
          onChange={(e) => changer({ ...f, texte: e.target.value })}
        />
        <Choix
          petit
          options={[{ valeur: 'tous' as const, texte: 'Tous' }, ...(Object.keys(NOMS_REPAS) as Repas[]).map((r) => ({ valeur: r, texte: NOMS_REPAS[r] }))]}
          valeur={f.repas ?? 'tous'}
          onChange={(v) => changer({ ...f, repas: v === 'tous' ? null : (v as Repas) })}
        />
        <details open={f.envies.length > 0 || f.vegetarien || f.favorisSeulement || !!f.tempsMax}>
        <summary>Envies, temps, favoris</summary>
        <div className="choix choix-petit">
          {(Object.keys(NOMS_ENVIES) as Envie[]).map((e) => (
            <button
              key={e}
              type="button"
              className={f.envies.includes(e) ? 'choisi' : ''}
              aria-pressed={f.envies.includes(e)}
              onClick={() => changer({ ...f, envies: f.envies.includes(e) ? f.envies.filter((x) => x !== e) : [...f.envies, e] })}
            >
              {NOMS_ENVIES[e]}
            </button>
          ))}
          <button type="button" className={f.vegetarien ? 'choisi' : ''} aria-pressed={f.vegetarien} onClick={() => changer({ ...f, vegetarien: !f.vegetarien })}>
            Végétarien
          </button>
          <button
            type="button"
            className={f.favorisSeulement ? 'choisi' : ''}
            aria-pressed={f.favorisSeulement}
            onClick={() => changer({ ...f, favorisSeulement: !f.favorisSeulement })}
          >
            ★ Favoris
          </button>
        </div>
        <Choix
          petit
          libelle="Temps maximum"
          options={[
            { valeur: 0, texte: 'Peu importe' },
            { valeur: 10, texte: '10 min' },
            { valeur: 20, texte: '20 min' },
            { valeur: 30, texte: '30 min' },
          ]}
          valeur={f.tempsMax ?? 0}
          onChange={(v) => changer({ ...f, tempsMax: v || null })}
        />
        </details>
        <button type="button" className="bouton bouton-lien" onClick={() => setFrigoOuvert(!frigoOuvert)}>
          {frigoOuvert ? '▾' : '▸'} Ce que j’ai dans mes placards ({f.disponibles.length})
        </button>
        {frigoOuvert && (
          <>
            <div className="choix choix-petit">
              {ingredientsPossibles.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={f.disponibles.includes(a.id) ? 'choisi' : ''}
                  aria-pressed={f.disponibles.includes(a.id)}
                  onClick={() =>
                    changer({
                      ...f,
                      disponibles: f.disponibles.includes(a.id) ? f.disponibles.filter((x) => x !== a.id) : [...f.disponibles, a.id],
                    })
                  }
                >
                  {a.nom.replace(/ \(.*\)$/, '')}
                </button>
              ))}
            </div>
            <p className="texte-discret petit">Huile, épices, oignon, beurre… sont supposés toujours disponibles.</p>
          </>
        )}
        {(f !== FILTRES_VIDES && JSON.stringify(f) !== JSON.stringify(FILTRES_VIDES)) && (
          <button type="button" className="bouton bouton-petit" onClick={() => changer(FILTRES_VIDES)}>
            Effacer les filtres
          </button>
        )}
      </section>

      <p className="texte-discret">{resultats.length} recette(s)</p>
      {resultats.map(({ recette: r, manquants }) => {
        const v = valeursPortion(r, index)
        return (
          <Link key={r.id} to={`/recettes/${r.id}`} className="carte carte-recette">
            <div className="carte-entete">
              <h3>
                {favoris.has(r.id) && <span className="etoile">★ </span>}
                {r.nom}
              </h3>
            </div>
            <p className="texte-discret petit">
              {r.repas.map((x) => NOMS_REPAS[x]).join(' · ')} · {r.temps_min} min · {v.kcal} kcal · {formatNombre(v.proteines, 0)} g
              de protéines · ≈ {formatPrix(v.prix)}/portion
            </p>
            {f.disponibles.length > 0 && (
              <p className={manquants.length ? 'texte-alerte petit' : 'texte-succes petit'}>
                {manquants.length ? `À acheter : ${manquants.map((m) => index.get(m)?.nom ?? m).join(', ')}` : 'Tout est là !'}
              </p>
            )}
          </Link>
        )
      })}
    </>
  )
}

export function FicheRecette() {
  const { id } = useParams()
  const r = trouverRecette(id ?? '')
  const { index } = useAliments()
  const favoris = useFavoris()
  const [portions, setPortions] = useState(r?.portions ?? 1)
  if (!r) return <Message type="erreur">Recette introuvable.</Message>

  const v = valeursPortion(r, index)
  const facteur = portions / r.portions
  const favori = favoris.has(r.id)

  return (
    <>
      <section className="carte">
        <div className="carte-entete">
          <h2>{r.nom}</h2>
          <button className={`bouton bouton-petit ${favori ? 'bouton-favori' : ''}`} onClick={() => changerFavori(r.id, !favori)} aria-pressed={favori}>
            {favori ? '★ Favori' : '☆ Favori'}
          </button>
        </div>
        <p className="texte-discret">
          {r.repas.map((x) => NOMS_REPAS[x]).join(' · ')} · {r.temps_min} min
          {estVegetarienne(r, index) ? ' · végétarien' : ''}
        </p>
        <div className="badges">
          {r.envies.map((e) => (
            <Badge key={e}>{NOMS_ENVIES[e]}</Badge>
          ))}
        </div>
      </section>

      <section className="carte">
        <h3>Par portion (estimation)</h3>
        <div className="grille-macros">
          <div>
            <strong>{v.kcal}</strong>
            <small>kcal</small>
          </div>
          <div>
            <strong>{formatNombre(v.proteines, 0)} g</strong>
            <small>protéines</small>
          </div>
          <div>
            <strong>{formatNombre(v.glucides, 0)} g</strong>
            <small>glucides</small>
          </div>
          <div>
            <strong>{formatNombre(v.lipides, 0)} g</strong>
            <small>lipides</small>
          </div>
          <div>
            <strong>{formatNombre(v.fibres, 0)} g</strong>
            <small>fibres</small>
          </div>
          <div>
            <strong>{formatPrix(v.prix)}</strong>
            <small>prix estimé</small>
          </div>
        </div>
        <p className="texte-discret petit">
          Valeurs calculées d’après la table Ciqual (Anses), approximatives (± 10 à 15 %).
          {contientApproximatif(r, index) && ' Cette recette contient un aliment aux valeurs particulièrement incertaines.'}
        </p>
      </section>

      <section className="carte">
        <div className="carte-entete">
          <h3>Ingrédients</h3>
          <div className="compteur">
            <button className="bouton bouton-petit" onClick={() => setPortions(Math.max(1, portions - 1))} aria-label="Moins de portions">
              −
            </button>
            <span>
              {portions} portion{portions > 1 ? 's' : ''}
            </span>
            <button className="bouton bouton-petit" onClick={() => setPortions(portions + 1)} aria-label="Plus de portions">
              +
            </button>
          </div>
        </div>
        <ul className="liste-ingredients">
          {r.ingredients.map((i) => (
            <li key={i.aliment}>
              <span>{facteur === 1 && i.texte ? i.texte : index.get(i.aliment)?.nom ?? i.aliment}</span>
              <span className="texte-discret">{formatNombre(i.g * facteur, 0)} g</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="carte">
        <h3>Étapes</h3>
        <ol>
          {r.etapes.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ol>
      </section>

      {r.alternatives.length > 0 && (
        <section className="carte">
          <h3>Alternatives</h3>
          <ul>
            {r.alternatives.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
