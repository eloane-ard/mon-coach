// Photos de progression : uniquement sur cet appareil, avec comparaison avant / après.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChampDate, Choix, Message } from '../../composants/formulaire'
import { ajouterPhoto, basePhotos, NOMS_VUES, partagerPhoto, type Photo, type Vue } from '../../donnees/photos'
import { aujourdhui, formatJour } from '../../utils/dates'

/** Affiche une photo stockée (crée une adresse temporaire pour l'image). */
function Image({ photo, alt, style }: { photo: Photo; alt: string; style?: React.CSSProperties }) {
  const url = useMemo(() => URL.createObjectURL(photo.image), [photo])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return <img src={url} alt={alt} style={style} />
}

export default function Photos() {
  const photos = useLiveQuery(() => basePhotos.photos.orderBy('date').reverse().toArray())
  const entree = useRef<HTMLInputElement>(null)
  const [date, setDate] = useState(aujourdhui())
  const [vue, setVue] = useState<Vue>('face')
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [mode, setMode] = useState<'galerie' | 'comparer'>('galerie')

  async function choisir(f: File | undefined) {
    if (!f) return
    setEnCours(true)
    setMessage(null)
    try {
      await ajouterPhoto(f, date, vue)
      setMessage({ type: 'succes', texte: 'Photo ajoutée (sur cet appareil uniquement).' })
    } catch (e) {
      setMessage({ type: 'erreur', texte: `Impossible d’ajouter la photo : ${e instanceof Error ? e.message : e}` })
    } finally {
      setEnCours(false)
      if (entree.current) entree.current.value = ''
    }
  }

  if (!photos) return <p className="texte-discret">Chargement…</p>

  return (
    <>
      <Message type="info">
        🔒 Tes photos restent <strong>uniquement sur ce téléphone</strong> : jamais envoyées en ligne, ni dans les exports. Si tu
        supprimes l’appli de l’écran d’accueil, elles disparaissent : garde une copie dans ta Photothèque (bouton « Copier dans
        Photos »).
      </Message>

      <Choix
        options={[
          { valeur: 'galerie' as const, texte: 'Mes photos' },
          { valeur: 'comparer' as const, texte: 'Avant / après' },
        ]}
        valeur={mode}
        onChange={setMode}
      />

      {mode === 'galerie' ? (
        <>
          <section className="carte">
            <h2>Ajouter une photo</h2>
            <ChampDate libelle="Date" valeur={date} onChange={setDate} />
            <Choix
              libelle="Vue"
              options={(Object.keys(NOMS_VUES) as Vue[]).map((v) => ({ valeur: v, texte: NOMS_VUES[v] }))}
              valeur={vue}
              onChange={setVue}
            />
            <input ref={entree} type="file" accept="image/*" className="cache" onChange={(e) => choisir(e.target.files?.[0])} />
            <button className="bouton bouton-principal bouton-large" disabled={enCours} onClick={() => entree.current?.click()}>
              {enCours ? 'Préparation…' : '📷 Prendre ou choisir une photo'}
            </button>
            <p className="texte-discret petit">Conseil : même endroit, même lumière, même tenue, le matin.</p>
            {message && <Message type={message.type}>{message.texte}</Message>}
          </section>

          {photos.length === 0 && <p className="texte-discret">Aucune photo pour l’instant.</p>}
          <div className="grille-photos">
            {photos.map((p) => (
              <figure key={p.id} className="photo">
                <Image photo={p} alt={`${NOMS_VUES[p.vue]} du ${formatJour(p.date)}`} />
                <figcaption>
                  {formatJour(p.date)} · {NOMS_VUES[p.vue]}
                </figcaption>
                <div className="actions-carte">
                  <button className="bouton bouton-petit" onClick={() => partagerPhoto(p).catch(() => {})}>
                    Copier dans Photos
                  </button>
                  <button
                    className="bouton bouton-petit bouton-danger"
                    onClick={() => confirm('Supprimer définitivement cette photo de l’appareil ?') && basePhotos.photos.delete(p.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </figure>
            ))}
          </div>
        </>
      ) : (
        <Comparer photos={photos} />
      )}
    </>
  )
}

function Comparer({ photos }: { photos: Photo[] }) {
  const [vue, setVue] = useState<Vue>('face')
  const parVue = photos.filter((p) => p.vue === vue).sort((a, b) => a.date.localeCompare(b.date))
  const [idAvant, setIdAvant] = useState<string>('')
  const [idApres, setIdApres] = useState<string>('')
  const [curseur, setCurseur] = useState(50)
  const avant = parVue.find((p) => p.id === idAvant) ?? parVue[0]
  const apres = parVue.find((p) => p.id === idApres) ?? parVue.at(-1)

  return (
    <>
      <Choix
        libelle="Vue"
        options={(Object.keys(NOMS_VUES) as Vue[]).map((v) => ({ valeur: v, texte: NOMS_VUES[v] }))}
        valeur={vue}
        onChange={(v) => {
          setVue(v)
          setIdAvant('')
          setIdApres('')
        }}
      />
      {parVue.length < 2 ? (
        <p className="texte-discret">Il faut au moins 2 photos de cette vue pour comparer.</p>
      ) : (
        <>
          <div className="grille-champs">
            {[
              ['Avant', avant, setIdAvant],
              ['Après', apres, setIdApres],
            ].map(([nom, p, set]) => (
              <div className="champ" key={nom as string}>
                <label>{nom as string}</label>
                <select className="selecteur" value={(p as Photo).id} onChange={(e) => (set as (v: string) => void)(e.target.value)}>
                  {parVue.map((x) => (
                    <option key={x.id} value={x.id}>
                      {formatJour(x.date)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {avant && apres && (
            <>
              <div className="comparaison" style={{ aspectRatio: `${apres.largeur} / ${apres.hauteur}` }}>
                <Image photo={apres} alt={`Après, ${formatJour(apres.date)}`} />
                <div className="comparaison-avant" style={{ clipPath: `inset(0 ${100 - curseur}% 0 0)` }}>
                  <Image photo={avant} alt={`Avant, ${formatJour(avant.date)}`} />
                </div>
                <div className="comparaison-trait" style={{ left: `${curseur}%` }} />
                <span className="comparaison-etiquette gauche">{formatJour(avant.date)}</span>
                <span className="comparaison-etiquette droite">{formatJour(apres.date)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={curseur}
                onChange={(e) => setCurseur(Number(e.target.value))}
                className="curseur-comparaison"
                aria-label="Glisser pour comparer avant et après"
              />
              <div className="cote-a-cote">
                <Image photo={avant} alt={`Avant, ${formatJour(avant.date)}`} />
                <Image photo={apres} alt={`Après, ${formatJour(apres.date)}`} />
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
