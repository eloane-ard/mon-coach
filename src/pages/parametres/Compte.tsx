// Compte et synchronisation : connexion par e-mail et mot de passe, état de la synchronisation.
import { useState } from 'react'
import { ChampTexte, Message } from '../../composants/formulaire'
import { supabaseConfigure } from '../../config'
import { lancerSynchro, useEtatSynchro, useInfosSynchro } from '../../donnees/service-synchro'
import { creerCompte, seConnecter, seDeconnecter } from '../../donnees/supabase'
import { formatDateHeure } from '../../utils/dates'

export default function Compte() {
  const etat = useEtatSynchro()
  const infos = useInfosSynchro()

  if (!supabaseConfigure()) {
    return (
      <section className="carte">
        <h2>Mode local</h2>
        <p>
          La base en ligne (Supabase) n’est pas encore branchée. Tout ce que tu saisis est enregistré sur cet appareil
          uniquement.
        </p>
        <Message type="alerte">Ne saisis pas encore de vraies données : elles ne seraient que sur cet appareil.</Message>
      </section>
    )
  }

  if (!etat.sessionChargee) return <p className="texte-discret">Chargement…</p>
  if (!etat.session) return <FormulaireConnexion />

  return (
    <>
      <section className="carte">
        <h2>Connectée</h2>
        <p>{etat.session.user.email}</p>
      </section>
      <section className="carte">
        <h2>Synchronisation</h2>
        <dl className="liste-infos">
          <dt>Dernière synchronisation</dt>
          <dd>{formatDateHeure(infos?.derniere)}</dd>
          <dt>Modifications en attente d’envoi</dt>
          <dd>{infos?.aEnvoyer ?? '…'}</dd>
          {etat.dernierBilan && etat.dernierBilan.conflits > 0 && (
            <>
              <dt>Conflits résolus</dt>
              <dd>{etat.dernierBilan.conflits} (anciennes versions gardées dans l’historique)</dd>
            </>
          )}
        </dl>
        {etat.erreur && <Message type="erreur">{etat.erreur}</Message>}
        <button className="bouton bouton-principal bouton-large" disabled={etat.enCours} onClick={() => lancerSynchro()}>
          {etat.enCours ? 'Synchronisation…' : 'Synchroniser maintenant'}
        </button>
      </section>
      <section className="carte">
        <h2>Se déconnecter</h2>
        <p className="texte-discret">
          Les données restent sur cet appareil. Pense à te reconnecter pour qu’elles continuent d’être envoyées en ligne.
        </p>
        <button
          className="bouton"
          onClick={() => {
            const attente = infos?.aEnvoyer ?? 0
            const texte =
              attente > 0
                ? `${attente} modification(s) n’ont pas encore été envoyées en ligne. Elles restent sur cet appareil. Se déconnecter quand même ?`
                : 'Se déconnecter ?'
            if (confirm(texte)) seDeconnecter()
          }}
        >
          Se déconnecter
        </button>
      </section>
    </>
  )
}

function FormulaireConnexion() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [mode, setMode] = useState<'connexion' | 'creation'>('connexion')
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const creation = mode === 'creation'
  const valide = email.includes('@') && motDePasse.length >= (creation ? 8 : 1)

  async function valider() {
    setErreur(null)
    setEnCours(true)
    try {
      if (creation) await creerCompte(email, motDePasse)
      else await seConnecter(email, motDePasse)
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e))
    } finally {
      setEnCours(false)
    }
  }

  return (
    <section className="carte">
      <h2>{creation ? 'Créer mon compte' : 'Connexion'}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          valider()
        }}
      >
        <ChampTexte libelle="Adresse e-mail" type="email" valeur={email} onChange={setEmail} />
        <div className="champ">
          <label htmlFor="mot-de-passe">Mot de passe</label>
          <input
            id="mot-de-passe"
            type="password"
            autoComplete={creation ? 'new-password' : 'current-password'}
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
          {creation && (
            <p className="aide">Au moins 8 caractères. Accepte la proposition de l’iPhone de l’enregistrer dans le trousseau.</p>
          )}
        </div>
        <button className="bouton bouton-principal bouton-large" disabled={enCours || !valide}>
          {enCours ? 'Patiente…' : creation ? 'Créer mon compte' : 'Se connecter'}
        </button>
      </form>
      <button type="button" className="bouton bouton-lien" onClick={() => setMode(creation ? 'connexion' : 'creation')}>
        {creation ? 'J’ai déjà un compte : me connecter' : 'Première fois ? Créer mon compte'}
      </button>
      {erreur && <Message type="erreur">{erreur}</Message>}
    </section>
  )
}
