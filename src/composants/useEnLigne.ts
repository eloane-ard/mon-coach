// Indique si le téléphone ou le PC a du réseau (utile pour la synchronisation plus tard).
import { useEffect, useState } from 'react'

export function useEnLigne(): boolean {
  const [enLigne, setEnLigne] = useState(() => navigator.onLine)
  useEffect(() => {
    const maj = () => setEnLigne(navigator.onLine)
    window.addEventListener('online', maj)
    window.addEventListener('offline', maj)
    return () => {
      window.removeEventListener('online', maj)
      window.removeEventListener('offline', maj)
    }
  }, [])
  return enLigne
}
