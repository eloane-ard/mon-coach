// Tests de la traduction des messages d'erreur de connexion.
import { describe, expect, it } from 'vitest'
import { traduireErreur } from '../src/donnees/supabase'

describe('messages de connexion', () => {
  it('traduit les erreurs courantes en français', () => {
    expect(traduireErreur('Invalid login credentials')).toBe('E-mail ou mot de passe incorrect.')
    expect(traduireErreur('User already registered')).toMatch(/Se connecter/)
    expect(traduireErreur('Signups not allowed for this instance')).toMatch(/inscriptions sont fermées/)
    expect(traduireErreur('Email not confirmed')).toMatch(/Confirm email/)
    expect(traduireErreur('Password should be at least 6 characters.')).toMatch(/trop faible/)
    expect(traduireErreur('Failed to fetch')).toMatch(/réseau/)
  })
})
