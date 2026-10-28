// Préparation commune à tous les tests.
import '@testing-library/jest-dom/vitest' // vérifications pratiques pour l'affichage (ex. « toBeInTheDocument »)
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Efface l'affichage entre deux tests pour qu'ils ne se mélangent pas.
afterEach(() => cleanup())
