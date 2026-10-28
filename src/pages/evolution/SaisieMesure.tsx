// Formulaire de saisie (ou de correction) d'une mesure corporelle.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ChampDate, ChampNombre, ChampTexte, Choix, Message, Badge } from '../../composants/formulaire'
import { enregistrer, useEnregistrement, useListe } from '../../donnees/depot'
import {
  CHAMPS_MESURE,
  NOMS_SOURCES,
  SOURCE_PAR_DEFAUT,
  SOURCES_PAR_GROUPE,
  verifierMesure,
  type ChampMesure,
  type DefinitionChamp,
  type Mesure,
  type SourceMesure,
} from '../../modele/mesures'
import { aujourdhui } from '../../utils/dates'
import { formatNombre, lireNombre, versChamp } from '../../utils/nombres'

type Groupe = DefinitionChamp['groupe']
const GROUPES: { groupe: Groupe; titre: string; aide?: string }[] = [
  { groupe: 'poids', titre: 'Poids' },
  { groupe: 'tours', titre: 'Mensurations', aide: 'Toutes les 2 à 4 semaines suffisent. Toujours au même endroit, le matin.' },
  {
    groupe: 'composition',
    titre: 'Composition (estimations)',
    aide: 'Valeurs de l’impédancemètre : ce sont des estimations, utiles pour la tendance seulement.',
  },
]

export default function SaisieMesure() {
  const [params] = useSearchParams()
  const idModifie = params.get('id')
  const navigate = useNavigate()
  const existante = useEnregistrement<Mesure>(idModifie ?? '—')
  const toutes = useListe<Mesure>('mesure')

  // Dernière mesure : sert à pré-remplir les sources et à afficher les dernières valeurs en indication.
  const derniere = useMemo(
    () => (toutes ?? []).slice().sort((a, b) => b.donnees.date.localeCompare(a.donnees.date))[0]?.donnees,
    [toutes],
  )

  const [date, setDate] = useState(aujourdhui())
  const [valeurs, setValeurs] = useState<Partial<Record<ChampMesure, string>>>({})
  const [sources, setSources] = useState<Record<Groupe, SourceMesure>>(SOURCE_PAR_DEFAUT)
  const [note, setNote] = useState('')
  const [erreurs, setErreurs] = useState<string[]>([])
  const [initialise, setInitialise] = useState(false)

  // Pré-remplissage (une seule fois, quand les données sont chargées).
  useEffect(() => {
    if (initialise) return
    if (idModifie) {
      if (existante === undefined) return
      if (existante) {
        const m = existante.donnees
        setDate(m.date)
        setValeurs(Object.fromEntries(Object.entries(m.valeurs).map(([k, v]) => [k, versChamp(v)])))
        const s = { ...SOURCE_PAR_DEFAUT }
        for (const def of CHAMPS_MESURE) if (m.sources[def.champ]) s[def.groupe] = m.sources[def.champ]!
        setSources(s)
        setNote(m.note ?? '')
      }
      setInitialise(true)
    } else if (toutes !== undefined) {
      if (derniere) {
        const s = { ...SOURCE_PAR_DEFAUT }
        for (const def of CHAMPS_MESURE) if (derniere.sources[def.champ]) s[def.groupe] = derniere.sources[def.champ]!
        setSources(s)
      }
      setInitialise(true)
    }
  }, [idModifie, existante, toutes, derniere, initialise])

  async function valider() {
    const mesure: Mesure = { date, valeurs: {}, sources: {}, note: note.trim() || undefined }
    for (const def of CHAMPS_MESURE) {
      const n = lireNombre(valeurs[def.champ])
      if (valeurs[def.champ]?.trim() && n === null) {
        setErreurs([`${def.nom} : « ${valeurs[def.champ]} » n’est pas un nombre.`])
        return
      }
      if (n !== null) {
        mesure.valeurs[def.champ] = n
        mesure.sources[def.champ] = sources[def.groupe]
      }
    }
    const pb = verifierMesure(mesure)
    setErreurs(pb)
    if (pb.length > 0) return
    await enregistrer('mesure', mesure, idModifie ?? undefined)
    navigate('/evolution', { replace: true })
  }

  if (idModifie && existante === null) {
    return <Message type="erreur">Cette mesure n’existe pas (ou a été supprimée).</Message>
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        valider()
      }}
    >
      <section className="carte">
        <h2>{idModifie ? 'Corriger la mesure' : 'Nouvelle mesure'}</h2>
        <ChampDate libelle="Date" valeur={date} onChange={setDate} />
      </section>

      {GROUPES.map(({ groupe, titre, aide }) => (
        <section className="carte" key={groupe}>
          <h2>{titre}</h2>
          {aide && <p className="texte-discret">{aide}</p>}
          <Choix
            libelle="Source"
            petit
            options={SOURCES_PAR_GROUPE[groupe].map((s) => ({ valeur: s, texte: NOMS_SOURCES[s] }))}
            valeur={sources[groupe]}
            onChange={(s) => setSources({ ...sources, [groupe]: s })}
          />
          <div className="grille-champs">
            {CHAMPS_MESURE.filter((c) => c.groupe === groupe).map((def) => (
              <ChampNombre
                key={def.champ}
                libelle={def.nom}
                unite={def.unite}
                valeur={valeurs[def.champ] ?? ''}
                onChange={(v) => setValeurs({ ...valeurs, [def.champ]: v })}
                placeholder={
                  derniere?.valeurs[def.champ] !== undefined ? `dernière : ${formatNombre(derniere.valeurs[def.champ])}` : ''
                }
                badge={def.estimation ? <Badge type="estimation">estimation</Badge> : undefined}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="carte">
        <ChampTexte libelle="Note (facultatif)" valeur={note} onChange={setNote} placeholder="Ex. après le sport, cycle…" multiligne />
      </section>

      {erreurs.length > 0 && (
        <Message type="erreur">
          {erreurs.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </Message>
      )}

      <div className="barre-actions">
        <button type="button" className="bouton" onClick={() => navigate(-1)}>
          Annuler
        </button>
        <button type="submit" className="bouton bouton-principal">
          Enregistrer
        </button>
      </div>
    </form>
  )
}
