// Saisie d'une autre activité (marche active, vélo…), par exemple la version « fatigue » du vendredi.
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ChampDate, ChampNombre, ChampTexte, Choix, Message } from '../../composants/formulaire'
import { enregistrer } from '../../donnees/depot'
import { NOMS_ACTIVITES, type SeanceAutre } from '../../modele/sport'
import { aujourdhui } from '../../utils/dates'
import { lireNombre } from '../../utils/nombres'

export default function SaisieAutre() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [date, setDate] = useState(params.get('date') ?? aujourdhui())
  const [activite, setActivite] = useState<SeanceAutre['activite']>((params.get('activite') as SeanceAutre['activite']) ?? 'marche')
  const [duree, setDuree] = useState(params.get('duree') ?? '30')
  const [note, setNote] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  async function valider() {
    const d = lireNombre(duree)
    if (!d || d <= 0) return setErreur('Indique une durée en minutes.')
    await enregistrer<SeanceAutre>('seance_autre', { date, activite, duree_min: d, note: note.trim() || undefined })
    navigate(-1)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        valider()
      }}
    >
      <section className="carte">
        <ChampDate libelle="Date" valeur={date} onChange={setDate} />
        <Choix
          libelle="Activité"
          options={(Object.keys(NOMS_ACTIVITES) as SeanceAutre['activite'][]).map((a) => ({ valeur: a, texte: NOMS_ACTIVITES[a] }))}
          valeur={activite}
          onChange={setActivite}
        />
        <ChampNombre libelle="Durée" unite="min" entier valeur={duree} onChange={setDuree} />
        <ChampTexte libelle="Note (facultatif)" valeur={note} onChange={setNote} />
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
