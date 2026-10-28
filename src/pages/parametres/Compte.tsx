// Compte et synchronisation : connexion par code reçu par e-mail, état de la synchronisation.
import { useState } from 'react'
import { ChampTexte, Message } from '../../composants/formulaire'
import { supabaseConfigure } from '../../config'
import { lancerSynchro, useEtatSynchro, useInfosSynchro } from '../../donnees/service-synchro'
import { envoyerCode, seDeconnecter, verifierCode } from '../../donnees/supabase'
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
  const [code, setCode] = useState('')
  const [etape, setEtape] = useState<'email' | 'code'>('email')
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function action(f: () => Promise<void>) {
    setErreur(null)
    setEnCours(true)
    try {
      await f()
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e))
    } finally {
      setEnCours(false)
    }
  }

  return (
    <section className="carte">
      <h2>Connexion</h2>
      {etape === 'email' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            action(async () => {
              await envoyerCode(email)
              setEtape('code')
            })
          }}
        >
          <p className="texte-discret">Tu vas recevoir un code par e-mail. Pas de mot de passe à retenir.</p>
          <ChampTexte libelle="Adresse e-mail" type="email" valeur={email} onChange={setEmail} />
          <button className="bouton bouton-principal bouton-large" disabled={enCours || !email.includes('@')}>
            {enCours ? 'Envoi…' : 'Recevoir un code'}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            action(() => verifierCode(email, code))
          }}
        >
          <p>Code envoyé à {email}. Il est valable une heure.</p>
          <div className="champ">
            <label htmlFor="code">Code reçu</label>
            <input
              id="code"
              className="champ-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
            />
          </div>
          <button className="bouton bouton-principal bouton-large" disabled={enCours || code.length < 6}>
            {enCours ? 'Vérification…' : 'Se connecter'}
          </button>
          <button type="button" className="bouton bouton-lien" onClick={() => setEtape('email')}>
            Changer d’adresse ou renvoyer un code
          </button>
        </form>
      )}
      {erreur && <Message type="erreur">{erreur}</Message>}
    </section>
  )
}
