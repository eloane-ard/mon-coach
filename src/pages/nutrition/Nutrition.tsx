// Nutrition : besoins estimés, repères du jour, bibliothèque d'aliments (consultation, ajout, modification).
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Badge, ChampNombre, ChampTexte, Message } from '../../composants/formulaire'
import { RAYONS, type Aliment, type Rayon } from '../../contenu/aliments'
import { useMesures, useObjectifs, useProfil } from '../../donnees/hooks'
import { enregistrerAliment, useAliments } from '../../donnees/hooks-nutrition'
import { moyenneGlissante7j, serie } from '../../modele/mesures'
import { contientExclu, estimerBesoins } from '../../modele/nutrition'
import { formatNombre, formatPrix, lireNombre, versChamp } from '../../utils/nombres'

export function PageNutrition() {
  const profil = useProfil()
  const objectifs = useObjectifs()
  const mesures = useMesures()
  const { liste } = useAliments()
  const [recherche, setRecherche] = useState('')
  const [rayon, setRayon] = useState<Rayon | ''>('')

  const poidsActuel = useMemo(() => {
    const s = serie((mesures ?? []).map((m) => m.donnees), 'poids_kg')
    if (s.length === 0) return null
    return moyenneGlissante7j(s, s.at(-1)!.date) ?? s.at(-1)!.valeur
  }, [mesures])
  const poids = poidsActuel ?? profil.poids_depart_kg ?? 0
  const besoins = estimerBesoins(profil, poids)

  const filtres = liste.filter(
    (a) => (!rayon || a.rayon === rayon) && (!recherche.trim() || a.nom.toLowerCase().includes(recherche.trim().toLowerCase())),
  )

  return (
    <>
      <section className="carte">
        <h2>Mes repères du jour</h2>
        <table className="tableau">
          <tbody>
            <tr>
              <td>Calories</td>
              <td className="nombre">
                {objectifs.kcal_min}–{objectifs.kcal_max} kcal
              </td>
            </tr>
            <tr>
              <td>Protéines</td>
              <td className="nombre">
                {objectifs.proteines_g_min}–{objectifs.proteines_g_max} g
              </td>
            </tr>
            <tr>
              <td>Lipides</td>
              <td className="nombre">
                {objectifs.lipides_g_min}–{objectifs.lipides_g_max} g
              </td>
            </tr>
            <tr>
              <td>Glucides</td>
              <td className="nombre">
                {objectifs.glucides_g_min}–{objectifs.glucides_g_max} g
              </td>
            </tr>
            <tr>
              <td>Fibres</td>
              <td className="nombre">
                {objectifs.fibres_g_min}–{objectifs.fibres_g_max} g
              </td>
            </tr>
            <tr>
              <td>Eau</td>
              <td className="nombre">~{formatNombre(objectifs.eau_l)} L + 0,5 L par heure de sport</td>
            </tr>
          </tbody>
        </table>
        <ul className="petit">
          <li>Des protéines à chaque repas.</li>
          <li>Une douceur prévue dans la journée, pas d’interdit.</li>
          <li>Petit-déjeuner rassasiant la plupart du temps (les gâteaux restent possibles de temps en temps).</li>
          <li>Week-end : sodas et alcool avec modération, comptés dans l’équilibre de la semaine.</li>
        </ul>
        <Link to="/parametres/objectifs" className="bouton bouton-petit">
          Modifier mes objectifs
        </Link>
      </section>

      {besoins && (
        <section className="carte">
          <h2>
            Estimation actualisée <Badge type="estimation">estimation</Badge>
          </h2>
          <p className="texte-discret">
            Avec {poidsActuel ? `ton poids moyen actuel (${formatNombre(poids)} kg)` : `ton poids de départ (${formatNombre(poids)} kg)`} :
          </p>
          <dl className="liste-infos">
            <dt>Métabolisme de base</dt>
            <dd>≈ {besoins.metabolismeBase} kcal</dd>
            <dt>Entretien (× {formatNombre(profil.facteur_activite)})</dt>
            <dd>≈ {besoins.entretien} kcal</dd>
            <dt>Cible (déficit 15 à 20 %)</dt>
            <dd>
              ≈ {besoins.cibleMin}–{besoins.cibleMax} kcal
            </dd>
            <dt>Protéines (1,6 à 1,8 g/kg)</dt>
            <dd>
              {besoins.proteinesMin}–{besoins.proteinesMax} g
            </dd>
          </dl>
          <p className="texte-discret petit">
            Formule de Mifflin-St Jeor : marge d’erreur de 10 à 15 %. À recalibrer après 3 à 4 semaines selon la moyenne de poids
            et le tour de taille. Ce ne sont pas des conseils d’un diététicien ou d’un médecin.
          </p>
        </section>
      )}

      <h2 className="titre-section">Bibliothèque d’aliments</h2>
      <section className="carte filtres">
        <input type="search" className="recherche" placeholder="Rechercher un aliment…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        <select className="selecteur" value={rayon} onChange={(e) => setRayon(e.target.value as Rayon | '')} aria-label="Rayon">
          <option value="">Tous les rayons</option>
          {RAYONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <Link to="/nutrition/aliment" className="bouton bouton-petit">
          ＋ Ajouter un aliment
        </Link>
      </section>
      <p className="texte-discret petit">
        Valeurs pour 100 g, d’après la table Ciqual de l’Anses (arrondies, approximatives). Prix estimés à corriger avec tes tickets.
      </p>
      {filtres.map((a) => (
        <Link key={a.id} to={`/nutrition/aliment?id=${a.id}`} className="carte carte-aliment">
          <strong>
            {a.nom} {a.tresApproximatif && <Badge type="alerte">très approximatif</Badge>}
          </strong>
          <span className="texte-discret petit">
            {a.kcal} kcal · P {formatNombre(a.proteines)} · G {formatNombre(a.glucides)} · L {formatNombre(a.lipides)} · F{' '}
            {formatNombre(a.fibres)} · {formatPrix(a.prix_kg)}/kg
          </span>
        </Link>
      ))}
    </>
  )
}

const VIDE: Aliment = {
  id: '',
  nom: '',
  rayon: 'Épicerie salée',
  kcal: 0,
  proteines: 0,
  glucides: 0,
  lipides: 0,
  fibres: 0,
  prix_kg: 0,
  conditionnement_g: 500,
  conditionnement: '',
  source: 'Saisi par moi (étiquette)',
}

const CHAMPS: [keyof Aliment, string, string][] = [
  ['kcal', 'Calories', 'kcal'],
  ['proteines', 'Protéines', 'g'],
  ['glucides', 'Glucides', 'g'],
  ['lipides', 'Lipides', 'g'],
  ['fibres', 'Fibres', 'g'],
  ['prix_kg', 'Prix au kilo', '€'],
  ['conditionnement_g', 'Taille du paquet', 'g'],
]

export function SaisieAliment() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const navigate = useNavigate()
  const { index, perso } = useAliments()
  const [a, setA] = useState<Aliment | null>(null)
  const [textes, setTextes] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    if (a) return
    const base = id ? index.get(id) : undefined
    if (id && !base) return
    const valeur = base ?? VIDE
    setA(valeur)
    setTextes(Object.fromEntries(CHAMPS.map(([k]) => [k, versChamp(valeur[k] as number)])))
  }, [id, index, a])

  if (!a) return <p className="texte-discret">Chargement…</p>

  async function valider() {
    if (!a!.nom.trim()) return setErreur('Indique un nom.')
    if (contientExclu(a!.nom)) return setErreur('Cet aliment fait partie de ceux que tu n’aimes pas.')
    const nombres: Partial<Aliment> = {}
    for (const [k, nom] of CHAMPS) {
      const n = lireNombre(textes[k])
      if (n === null || n < 0) return setErreur(`${nom} : valeur invalide.`)
      ;(nombres as Record<string, number>)[k] = n
    }
    const final: Aliment = {
      ...a!,
      ...nombres,
      id: a!.id || `perso_${crypto.randomUUID().slice(0, 8)}`,
      conditionnement: a!.conditionnement || `${textes.conditionnement_g} g`,
      source: id && a!.source.startsWith('Ciqual') ? `${a!.source} (modifié par moi)` : a!.source,
    }
    await enregistrerAliment(final)
    navigate(-1)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        valider()
      }}
    >
      {id && !perso.has(id) && <Message type="info">Aliment de la bibliothèque : tes modifications (ex. le prix) seront gardées.</Message>}
      <section className="carte">
        <ChampTexte libelle="Nom" valeur={a.nom} onChange={(v) => setA({ ...a, nom: v })} />
        <div className="champ">
          <label htmlFor="rayon">Rayon</label>
          <select id="rayon" className="selecteur" value={a.rayon} onChange={(e) => setA({ ...a, rayon: e.target.value as Rayon })}>
            {RAYONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <p className="texte-discret petit">Valeurs pour 100 g (regarde l’étiquette).</p>
        <div className="grille-champs">
          {CHAMPS.map(([k, nom, unite]) => (
            <ChampNombre key={k} libelle={nom} unite={unite} valeur={textes[k] ?? ''} onChange={(v) => setTextes({ ...textes, [k]: v })} />
          ))}
        </div>
        <ChampTexte libelle="Conditionnement" valeur={a.conditionnement} onChange={(v) => setA({ ...a, conditionnement: v })} placeholder="ex. paquet de 500 g" />
        <label className="case">
          <input type="checkbox" checked={!!a.animal} onChange={(e) => setA({ ...a, animal: e.target.checked })} />
          Viande ou poisson
        </label>
        <p className="texte-discret petit">Source : {a.source}</p>
      </section>
      {erreur && <Message type="erreur">{erreur}</Message>}
      <div className="barre-actions">
        <button type="button" className="bouton" onClick={() => navigate(-1)}>
          Annuler
        </button>
        <button className="bouton bouton-principal">Enregistrer</button>
      </div>
    </form>
  )
}
