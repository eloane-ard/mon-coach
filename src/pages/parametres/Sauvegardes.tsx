// Écran « Sauvegardes » : état des sauvegardes, export manuel, restauration avec aperçu.
import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Message } from '../../composants/formulaire'
import { base } from '../../donnees/base-locale'
import { useEnregistrement } from '../../donnees/depot'
import {
  analyserRestauration,
  appliquerRestauration,
  compterParType,
  construireExport,
  lireFichier,
  noterExport,
  proposerFichier,
  type Analyse,
  type EtatSauvegardes,
  type ResultatRestauration,
} from '../../donnees/sauvegarde'
import { useInfosSynchro } from '../../donnees/service-synchro'
import { lireDerniereSauvegardeAuto } from '../../donnees/supabase'
import { ID_ETAT_SAUVEGARDES, NOMS_TYPES } from '../../donnees/types'
import { supabaseConfigure } from '../../config'
import { formatDateHeure } from '../../utils/dates'

const JOURS_ALERTE_AUTO = 8
const JOURS_ALERTE_MANUEL = 30

function ilYA(iso: string | null | undefined): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - Date.parse(iso)) / 86_400_000)
}

export default function Sauvegardes() {
  return (
    <>
      <EtatDesSauvegardes />
      <Exporter />
      <Restaurer />
      <section className="carte">
        <h2>Les photos</h2>
        <p className="texte-discret">
          Les photos de progression restent uniquement sur ton téléphone : elles ne sont ni synchronisées, ni dans les
          exports. Garde une copie dans ta Photothèque.
        </p>
      </section>
    </>
  )
}

function EtatDesSauvegardes() {
  const infos = useInfosSynchro()
  const etat = useEnregistrement<EtatSauvegardes>(ID_ETAT_SAUVEGARDES)
  const comptes = useLiveQuery(async () => compterParType(await base.enregistrements.toArray()))
  const nbHistorique = useLiveQuery(() => base.historique.count())
  const [auto, setAuto] = useState<{ fait_le: string; nb_enregistrements: number | null } | null | 'inconnu'>('inconnu')

  useEffect(() => {
    if (!supabaseConfigure()) return setAuto(null)
    lireDerniereSauvegardeAuto().then(setAuto).catch(() => setAuto(null))
  }, [])

  const dernierExport = etat?.donnees.dernier_export_manuel
  const joursAuto = auto && auto !== 'inconnu' ? ilYA(auto.fait_le) : null
  const joursExport = ilYA(dernierExport?.date)

  return (
    <section className="carte">
      <h2>État des sauvegardes</h2>
      <dl className="liste-infos">
        <dt>Sauvegarde automatique</dt>
        <dd>
          {auto === 'inconnu'
            ? '…'
            : auto
              ? `${formatDateHeure(auto.fait_le)}${auto.nb_enregistrements !== null ? ` (${auto.nb_enregistrements} enregistrements)` : ''}`
              : supabaseConfigure()
                ? 'aucune trouvée (ou hors connexion)'
                : 'pas encore en place'}
        </dd>
        <dt>Dernier export manuel</dt>
        <dd>{dernierExport ? formatDateHeure(dernierExport.date) : 'jamais'}</dd>
        <dt>Dernière synchronisation</dt>
        <dd>{supabaseConfigure() ? formatDateHeure(infos?.derniere) : 'mode local'}</dd>
        {supabaseConfigure() && (
          <>
            <dt>En attente d’envoi</dt>
            <dd>{infos?.aEnvoyer ?? '…'}</dd>
          </>
        )}
      </dl>

      {joursAuto !== null && joursAuto > JOURS_ALERTE_AUTO && (
        <Message type="alerte">La dernière sauvegarde automatique date de {joursAuto} jours. Vérifie GitHub Actions.</Message>
      )}
      {(joursExport === null || joursExport > JOURS_ALERTE_MANUEL) && (
        <Message type="info">Pense à faire un export manuel au moins une fois par mois.</Message>
      )}

      <h3>Mes données sur cet appareil</h3>
      <table className="tableau">
        <tbody>
          {Object.entries(comptes ?? {})
            .sort(([a], [b]) => (NOMS_TYPES[a] ?? a).localeCompare(NOMS_TYPES[b] ?? b))
            .map(([type, n]) => (
              <tr key={type}>
                <td>{NOMS_TYPES[type] ?? type}</td>
                <td className="nombre">{n}</td>
              </tr>
            ))}
          <tr className="discret">
            <td>Anciennes versions gardées</td>
            <td className="nombre">{nbHistorique ?? '…'}</td>
          </tr>
        </tbody>
      </table>
      {comptes && Object.keys(comptes).length === 0 && <p className="texte-discret">Aucune donnée pour l’instant.</p>}
    </section>
  )
}

function Exporter() {
  const [message, setMessage] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function exporter() {
    setEnCours(true)
    setMessage(null)
    try {
      const fichier = await construireExport()
      const resultat = await proposerFichier(fichier)
      if (resultat !== 'annule') {
        await noterExport(fichier)
        setMessage(
          resultat === 'partage'
            ? 'Fichier prêt. Choisis « Enregistrer dans Fichiers » (iCloud Drive) pour le garder.'
            : 'Fichier téléchargé. Range-le dans un dossier sauvegardé (OneDrive, clé USB…).',
        )
      }
    } catch (e) {
      setMessage(`Export impossible : ${e instanceof Error ? e.message : e}`)
    } finally {
      setEnCours(false)
    }
  }

  return (
    <section className="carte">
      <h2>Exporter mes données</h2>
      <p className="texte-discret">
        Crée un fichier avec toutes tes données (sauf les photos). À faire avant chaque grosse mise à jour de l’appli.
      </p>
      <button className="bouton bouton-principal bouton-large" onClick={exporter} disabled={enCours}>
        {enCours ? 'Préparation…' : '⬇︎ Exporter mes données'}
      </button>
      {message && <Message type="succes">{message}</Message>}
    </section>
  )
}

function Restaurer() {
  const entree = useRef<HTMLInputElement>(null)
  const [analyse, setAnalyse] = useState<Analyse | null>(null)
  const [nomFichier, setNomFichier] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [remplacer, setRemplacer] = useState(false)
  const [resultat, setResultat] = useState<ResultatRestauration | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function choisir(f: File | undefined) {
    setErreur(null)
    setAnalyse(null)
    setResultat(null)
    setRemplacer(false)
    if (!f) return
    try {
      setNomFichier(f.name)
      const fichier = lireFichier(await f.text())
      setAnalyse(await analyserRestauration(fichier))
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e))
    } finally {
      if (entree.current) entree.current.value = ''
    }
  }

  async function confirmer() {
    if (!analyse) return
    const t = analyse.totaux
    const aEcrire = t.nouveaux + t.plusRecentsDansFichier + (remplacer ? t.plusRecentsDansAppli : 0)
    if (!confirm(`Confirmer la restauration ? ${aEcrire} enregistrement(s) seront ajoutés ou remplacés. Les versions remplacées sont gardées dans l’historique.`))
      return
    setEnCours(true)
    try {
      setResultat(await appliquerRestauration(analyse.fichier, { remplacerPlusRecents: remplacer }))
      setAnalyse(null)
    } catch (e) {
      setErreur(`Restauration interrompue, rien n’a été modifié : ${e instanceof Error ? e.message : e}`)
    } finally {
      setEnCours(false)
    }
  }

  const t = analyse?.totaux

  return (
    <section className="carte">
      <h2>Restaurer une sauvegarde</h2>
      <p className="texte-discret">
        Choisis un fichier d’export. Tu verras d’abord un aperçu : rien n’est écrit sans ta confirmation, et aucune donnée
        plus récente n’est remplacée sans ton accord.
      </p>
      <input
        ref={entree}
        type="file"
        accept="application/json,.json"
        className="cache"
        onChange={(e) => choisir(e.target.files?.[0])}
      />
      <button className="bouton bouton-large" onClick={() => entree.current?.click()}>
        Choisir un fichier…
      </button>

      {erreur && <Message type="erreur">{erreur}</Message>}

      {analyse && t && (
        <div className="apercu">
          <h3>Aperçu de « {nomFichier} »</h3>
          <p className="texte-discret">Exporté le {formatDateHeure(analyse.fichier.exporte_le)}</p>
          <table className="tableau">
            <thead>
              <tr>
                <th>Type</th>
                <th className="nombre">Dans le fichier</th>
                <th className="nombre">À ajouter</th>
                <th className="nombre">Plus récents dans le fichier</th>
                <th className="nombre">Plus récents dans l’appli</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analyse.parType).map(([type, a]) => (
                <tr key={type}>
                  <td>{NOMS_TYPES[type] ?? type}</td>
                  <td className="nombre">{a.dansFichier}</td>
                  <td className="nombre">{a.nouveaux}</td>
                  <td className="nombre">{a.plusRecentsDansFichier}</td>
                  <td className="nombre">{a.plusRecentsDansAppli}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            {t.nouveaux} à ajouter · {t.plusRecentsDansFichier} à mettre à jour · {t.identiques} déjà identiques
          </p>
          {t.plusRecentsDansAppli > 0 && (
            <>
              <Message type="alerte">
                {t.plusRecentsDansAppli} enregistrement(s) sont plus récents dans l’appli que dans le fichier. Par défaut,
                ils sont gardés tels quels.
              </Message>
              <label className="case">
                <input type="checkbox" checked={remplacer} onChange={(e) => setRemplacer(e.target.checked)} />
                Remplacer aussi ces données plus récentes par celles du fichier
              </label>
            </>
          )}
          <div className="barre-actions">
            <button className="bouton" onClick={() => setAnalyse(null)}>
              Annuler
            </button>
            <button
              className="bouton bouton-principal"
              onClick={confirmer}
              disabled={enCours || t.nouveaux + t.plusRecentsDansFichier + (remplacer ? t.plusRecentsDansAppli : 0) === 0}
            >
              {enCours ? 'Restauration…' : 'Restaurer'}
            </button>
          </div>
        </div>
      )}

      {resultat && (
        <Message type="succes">
          Restauration terminée : {resultat.ajoutes} ajouté(s), {resultat.remplaces} remplacé(s), {resultat.gardes} gardé(s)
          tel(s) quel(s), {resultat.identiques} déjà identique(s).
          {supabaseConfigure() && ' Les données vont être envoyées en ligne.'}
        </Message>
      )}
    </section>
  )
}
