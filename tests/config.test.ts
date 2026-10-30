// Tests du nettoyage de l'adresse Supabase copiée dans les réglages.
import { describe, expect, it } from 'vitest'
import { nettoyerAdresse } from '../src/config'

describe('adresse Supabase', () => {
  it('garde seulement https://xxxx.supabase.co', () => {
    const bonne = 'https://abcd.supabase.co'
    expect(nettoyerAdresse(bonne)).toBe(bonne)
    expect(nettoyerAdresse(' https://abcd.supabase.co/ ')).toBe(bonne)
    expect(nettoyerAdresse('https://abcd.supabase.co/rest/v1/')).toBe(bonne)
    expect(nettoyerAdresse('https://abcd.supabase.co/auth/v1')).toBe(bonne)
    expect(nettoyerAdresse('abcd.supabase.co')).toBe(bonne)
    expect(nettoyerAdresse('https://supabase.com/dashboard/project/abcd/settings/api')).toBe(bonne)
    expect(nettoyerAdresse('')).toBe('')
  })
})
