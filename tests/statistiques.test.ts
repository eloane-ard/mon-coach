// Tests des calculs des graphiques et du tableau de bord.
import { describe, expect, it } from 'vitest'
import { activiteParSemaine, dansPeriode, debutPeriode, evolution, moyenneMobile, semainesRegulieres } from '../src/modele/statistiques'
import type { Course, SeanceMuscu } from '../src/modele/sport'

describe('statistiques', () => {
  it('début des périodes', () => {
    expect(debutPeriode('7j', '2026-11-10')).toBe('2026-11-04')
    expect(debutPeriode('30j', '2026-11-30')).toBe('2026-11-01')
    expect(debutPeriode('tout', '2026-11-10')).toBeNull()
  })

  it('filtre une liste par période', () => {
    const l = [{ date: '2026-10-01' }, { date: '2026-11-05' }, { date: '2026-11-10' }, { date: '2026-11-11' }]
    expect(dansPeriode(l, '7j', '2026-11-10').map((x) => x.date)).toEqual(['2026-11-05', '2026-11-10'])
    expect(dansPeriode(l, 'tout', '2026-11-10')).toHaveLength(3)
  })

  it('moyenne mobile sur 7 jours', () => {
    const pts = [
      { date: '2026-11-01', valeur: 78 },
      { date: '2026-11-03', valeur: 76 },
      { date: '2026-11-10', valeur: 75 },
    ]
    const mm = moyenneMobile(pts)
    expect(mm[0].valeur).toBe(78)
    expect(mm[1].valeur).toBe(77)
    expect(mm[2].valeur).toBe(75) // le 1er et le 3 sont hors de la fenêtre
  })

  it('évolution entre première et dernière valeur', () => {
    expect(evolution([{ date: '2026-11-10', valeur: 75 }, { date: '2026-11-01', valeur: 77 }])).toBe(-2)
    expect(evolution([{ date: '2026-11-01', valeur: 77 }])).toBeNull()
  })

  it('activité par semaine et semaines régulières', () => {
    const c = (date: string, km: number) => ({ date, distance_km: km }) as Course
    const m = (date: string) => ({ date }) as SeanceMuscu
    const semaines = activiteParSemaine('2026-11-02', '2026-11-22', {
      courses: [c('2026-11-02', 4), c('2026-11-04', 4.2), c('2026-11-09', 4), c('2026-11-11', 4), c('2026-11-16', 3)],
      muscu: [m('2026-11-03'), m('2026-11-05'), m('2026-11-10'), m('2026-11-12')],
      autres: [],
    })
    expect(semaines).toHaveLength(3)
    expect(semaines[0]).toMatchObject({ lundi: '2026-11-02', courses: 2, muscu: 2 })
    expect(semaines[0].km).toBeCloseTo(8.2)
    expect(semainesRegulieres(semaines, 4, '2026-11-16')).toBe(2)
    expect(semainesRegulieres(semaines, 4, '2026-11-23')).toBe(0) // la 3e semaine n'a qu'une séance
  })
})
