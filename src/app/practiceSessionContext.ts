import { createContext, useContext } from 'react'
import type usePracticeSession from '../hooks/usePracticeSession'

export const PracticeSessionContext = createContext<ReturnType<
  typeof usePracticeSession
> | null>(null)
export function useSession() {
  const context = useContext(PracticeSessionContext)
  if (!context)
    throw new Error('Practice sessions require PracticeSessionProvider')
  return context
}
