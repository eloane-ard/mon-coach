// Faux serveur en mémoire, qui se comporte comme la fonction SQL « pousser_enregistrements »
// et la lecture de la table « enregistrements » de Supabase. Sert uniquement aux tests.
import type { Enregistrement } from '../src/donnees/types'
import type { Distant, LigneDistante } from '../src/donnees/synchro'

export class FauxServeur implements Distant {
  lignes = new Map<string, LigneDistante>()
  historique: (Enregistrement & { motif: string })[] = []
  horloge = Date.parse('2026-11-01T10:00:00Z')
  enPanne = false

  private tic(): string {
    this.horloge += 1000
    return new Date(this.horloge).toISOString()
  }

  async pousser(lignes: Enregistrement[]) {
    if (this.enPanne) throw new Error('Réseau indisponible')
    const versionsEnLigne: LigneDistante[] = []
    for (const l of lignes) {
      const existant = this.lignes.get(l.id)
      if (!existant) {
        this.lignes.set(l.id, { ...structuredClone(l), recu_le: this.tic() })
      } else if (Date.parse(l.updated_at) > Date.parse(existant.updated_at)) {
        this.historique.push({ ...existant, motif: 'remplacée' })
        this.lignes.set(l.id, { ...structuredClone(l), recu_le: this.tic() })
      } else {
        if (JSON.stringify(existant.donnees) !== JSON.stringify(l.donnees) || existant.deleted_at !== l.deleted_at) {
          this.historique.push({ ...structuredClone(l), motif: 'plus ancienne que la version en ligne' })
        }
        versionsEnLigne.push(structuredClone(existant))
      }
    }
    return { versionsEnLigne }
  }

  async tirer(depuis: string | null, limite: number) {
    if (this.enPanne) throw new Error('Réseau indisponible')
    return [...this.lignes.values()]
      .filter((l) => !depuis || Date.parse(l.recu_le) > Date.parse(depuis))
      .sort((a, b) => Date.parse(a.recu_le) - Date.parse(b.recu_le))
      .slice(0, limite)
      .map((l) => structuredClone(l))
  }
}
