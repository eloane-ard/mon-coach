// Profil et objectifs. Pré-remplis avec la conception tant que rien n'est enregistré.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChampDate, ChampNombre, ChampTexte, Choix, Message } from '../../composants/formulaire'
import { enregistrer, useEnregistrement } from '../../donnees/depot'
import { ID_OBJECTIFS, ID_PROFIL } from '../../donnees/types'
import { OBJECTIFS_PAR_DEFAUT, PROFIL_PAR_DEFAUT, type Objectifs, type Profil } from '../../modele/profil'
import { lireNombre, versChamp } from '../../utils/nombres'

type Textes<T> = Record<keyof T, string>

function versTextes<T extends object>(o: T): Textes<T> {
  return Object.fromEntries(
    Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? versChamp(v) : v === null ? '' : String(v)]),
  ) as Textes<T>
}

export function PageProfil() {
  const enr = useEnregistrement<Profil>(ID_PROFIL)
  const navigate = useNavigate()
  const [p, setP] = useState<Profil | null>(null)
  const [age, setAge] = useState('')
  const [taille, setTaille] = useState('')
  const [poids, setPoids] = useState('')
  const [facteur, setFacteur] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    if (enr === undefined || p) return
    const valeur = { ...PROFIL_PAR_DEFAUT, ...(enr?.donnees ?? {}) }
    setP(valeur)
    setAge(versChamp(valeur.age))
    setTaille(versChamp(valeur.taille_cm))
    setPoids(versChamp(valeur.poids_depart_kg))
    setFacteur(versChamp(valeur.facteur_activite))
  }, [enr, p])

  if (!p) return <p className="texte-discret">Chargement…</p>

  async function valider() {
    const f = lireNombre(facteur)
    if (f === null || f < 1.2 || f > 2.2) return setErreur('Le facteur d’activité doit être entre 1,2 et 2,2.')
    await enregistrer<Profil>(
      'profil',
      { ...p!, age: lireNombre(age), taille_cm: lireNombre(taille), poids_depart_kg: lireNombre(poids), facteur_activite: f },
      ID_PROFIL,
    )
    navigate('/parametres')
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        valider()
      }}
    >
      {enr === null && <Message type="info">Valeurs reprises de ta conception : vérifie-les puis enregistre.</Message>}
      <section className="carte">
        <h2>Profil</h2>
        <ChampTexte libelle="Prénom" valeur={p.prenom} onChange={(v) => setP({ ...p, prenom: v })} />
        <Choix
          libelle="Sexe (pour l’estimation des besoins)"
          options={[
            { valeur: 'femme', texte: 'Femme' },
            { valeur: 'homme', texte: 'Homme' },
          ]}
          valeur={p.sexe}
          onChange={(v) => setP({ ...p, sexe: v })}
        />
        <div className="grille-champs">
          <ChampNombre libelle="Âge" unite="ans" entier valeur={age} onChange={setAge} />
          <ChampNombre libelle="Taille" unite="cm" entier valeur={taille} onChange={setTaille} />
          <ChampNombre libelle="Poids de départ" unite="kg" valeur={poids} onChange={setPoids} />
          <ChampNombre
            libelle="Facteur d’activité"
            valeur={facteur}
            onChange={setFacteur}
            aide="1,5 = 4 à 5 séances par semaine (conception)."
          />
        </div>
        <ChampDate
          libelle="Début du programme (semaine 1)"
          valeur={p.date_debut_programme}
          onChange={(v) => setP({ ...p, date_debut_programme: v })}
        />
      </section>
      <section className="carte">
        <h2>Santé</h2>
        <ChampTexte libelle="Notes" multiligne valeur={p.notes_sante} onChange={(v) => setP({ ...p, notes_sante: v })} />
        <Choix
          libelle="Reprise des jambes validée par le kiné ou le médecin"
          options={[
            { valeur: 'non', texte: 'Pas encore' },
            { valeur: 'oui', texte: 'Oui, validée' },
          ]}
          valeur={p.reprise_jambes_validee ? 'oui' : 'non'}
          onChange={(v) => setP({ ...p, reprise_jambes_validee: v === 'oui' })}
        />
      </section>
      {erreur && <Message type="erreur">{erreur}</Message>}
      <div className="barre-actions">
        <button type="button" className="bouton" onClick={() => navigate('/parametres')}>
          Annuler
        </button>
        <button className="bouton bouton-principal">Enregistrer</button>
      </div>
    </form>
  )
}

const GROUPES_OBJECTIFS: { titre: string; aide?: string; lignes: [keyof Objectifs, keyof Objectifs | null, string, string][] }[] = [
  {
    titre: 'Silhouette',
    lignes: [
      ['perte_masse_grasse_kg_min', 'perte_masse_grasse_kg_max', 'Masse grasse à perdre', 'kg'],
      ['duree_mois_min', 'duree_mois_max', 'En combien de temps', 'mois'],
      ['perte_hebdo_kg_min', 'perte_hebdo_kg_max', 'Perte par semaine visée', 'kg'],
      ['poids_cible_kg', null, 'Poids visé (facultatif)', 'kg'],
      ['tour_taille_cible_cm', null, 'Tour de taille visé (facultatif)', 'cm'],
    ],
  },
  {
    titre: 'Sport',
    lignes: [['seances_par_semaine_min', 'seances_par_semaine_max', 'Séances par semaine', 'séances']],
  },
  {
    titre: 'Nutrition (estimations)',
    aide: 'Repères estimés, avec une marge d’erreur de 10 à 15 %. À recalibrer après 3 à 4 semaines.',
    lignes: [
      ['kcal_min', 'kcal_max', 'Calories par jour', 'kcal'],
      ['proteines_g_min', 'proteines_g_max', 'Protéines', 'g'],
      ['lipides_g_min', 'lipides_g_max', 'Lipides', 'g'],
      ['glucides_g_min', 'glucides_g_max', 'Glucides', 'g'],
      ['fibres_g_min', 'fibres_g_max', 'Fibres', 'g'],
      ['eau_l', null, 'Eau (hors sport)', 'L'],
    ],
  },
  {
    titre: 'Budget',
    lignes: [['budget_courses_min', 'budget_courses_max', 'Courses par semaine', '€']],
  },
]

export function PageObjectifs() {
  const enr = useEnregistrement<Objectifs>(ID_OBJECTIFS)
  const navigate = useNavigate()
  const [t, setT] = useState<Textes<Objectifs> | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    if (enr === undefined || t) return
    setT(versTextes({ ...OBJECTIFS_PAR_DEFAUT, ...(enr?.donnees ?? {}) }))
  }, [enr, t])

  if (!t) return <p className="texte-discret">Chargement…</p>

  async function valider() {
    const o = {} as Objectifs
    for (const cle of Object.keys(OBJECTIFS_PAR_DEFAUT) as (keyof Objectifs)[]) {
      const n = lireNombre(t![cle])
      if (t![cle]?.trim() && n === null) return setErreur(`« ${t![cle]} » n’est pas un nombre.`)
      o[cle] = n
    }
    await enregistrer('objectifs', o, ID_OBJECTIFS)
    navigate('/parametres')
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        valider()
      }}
    >
      {enr === null && <Message type="info">Valeurs reprises de ta conception : vérifie-les puis enregistre.</Message>}
      {GROUPES_OBJECTIFS.map((g) => (
        <section className="carte" key={g.titre}>
          <h2>{g.titre}</h2>
          {g.aide && <p className="texte-discret">{g.aide}</p>}
          {g.lignes.map(([min, max, nom, unite]) => (
            <div key={min} className="ligne-objectif">
              <span className="libelle">{nom}</span>
              <div className="grille-champs">
                <ChampNombre libelle={max ? 'de' : 'valeur'} unite={unite} valeur={t[min]} onChange={(v) => setT({ ...t, [min]: v })} />
                {max && <ChampNombre libelle="à" unite={unite} valeur={t[max]} onChange={(v) => setT({ ...t, [max]: v })} />}
              </div>
            </div>
          ))}
        </section>
      ))}
      {erreur && <Message type="erreur">{erreur}</Message>}
      <div className="barre-actions">
        <button type="button" className="bouton" onClick={() => navigate('/parametres')}>
          Annuler
        </button>
        <button className="bouton bouton-principal">Enregistrer</button>
      </div>
    </form>
  )
}
