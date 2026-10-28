// Accès « en direct » aux données les plus utilisées par les pages.
import { useMemo } from 'react'
import { useEnregistrement, useListe } from './depot'
import { ID_OBJECTIFS, ID_PROFIL, ID_REGLAGES_PROGRAMME, type Enregistrement } from './types'
import { OBJECTIFS_PAR_DEFAUT, PROFIL_PAR_DEFAUT, type Objectifs, type Profil } from '../modele/profil'
import { REGLAGES_PAR_DEFAUT, type ReglagesProgramme } from '../modele/programme'
import type { Course, SeanceAutre, SeanceMuscu } from '../modele/sport'
import type { Mesure } from '../modele/mesures'

/** Profil enregistré, ou celui de la conception tant que rien n'est enregistré. */
export function useProfil(): Profil {
  const e = useEnregistrement<Profil>(ID_PROFIL)
  return useMemo(() => ({ ...PROFIL_PAR_DEFAUT, ...(e?.donnees ?? {}) }), [e])
}

export function useObjectifs(): Objectifs {
  const e = useEnregistrement<Objectifs>(ID_OBJECTIFS)
  return useMemo(() => ({ ...OBJECTIFS_PAR_DEFAUT, ...(e?.donnees ?? {}) }), [e])
}

export function useReglagesProgramme(): ReglagesProgramme {
  const e = useEnregistrement<ReglagesProgramme>(ID_REGLAGES_PROGRAMME)
  return useMemo(() => ({ ...REGLAGES_PAR_DEFAUT, ...(e?.donnees ?? {}) }), [e])
}

/** Liste triée par date (la plus ancienne d'abord). */
function trier<D extends { date: string }>(l: Enregistrement<D>[] | undefined): Enregistrement<D>[] | undefined {
  return l?.slice().sort((a, b) => a.donnees.date.localeCompare(b.donnees.date) || a.created_at.localeCompare(b.created_at))
}

export function useCourses() {
  const l = useListe<Course>('course')
  return useMemo(() => trier(l), [l])
}

export function useSeancesMuscu() {
  const l = useListe<SeanceMuscu>('seance_muscu')
  return useMemo(() => trier(l), [l])
}

export function useSeancesAutres() {
  const l = useListe<SeanceAutre>('seance_autre')
  return useMemo(() => trier(l), [l])
}

export function useMesures() {
  const l = useListe<Mesure>('mesure')
  return useMemo(() => trier(l), [l])
}
