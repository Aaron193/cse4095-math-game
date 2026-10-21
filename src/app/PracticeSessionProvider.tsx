import type { ReactNode } from 'react'
import usePracticeSession from '../hooks/usePracticeSession'
import { PracticeSessionContext } from './practiceSessionContext'

export default function PracticeSessionProvider({
  children,
}: {
  children: ReactNode
}) {
  const session = usePracticeSession()
  return (
    <PracticeSessionContext.Provider value={session}>
      {children}
    </PracticeSessionContext.Provider>
  )
}
