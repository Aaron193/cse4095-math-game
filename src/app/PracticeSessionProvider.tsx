import type { ReactNode } from 'react'
import { useState } from 'react'
import { useAppData } from './appDataContext'
import { restoreCompletedSession } from '../services/storageService'
import usePracticeSession from '../hooks/usePracticeSession'
import { PracticeSessionContext } from './practiceSessionContext'

export default function PracticeSessionProvider({
  children,
}: {
  children: ReactNode
}) {
  const { data, saveSession } = useAppData()
  const [initial] = useState(() => restoreCompletedSession(data))
  const session = usePracticeSession(initial, saveSession)
  return (
    <PracticeSessionContext.Provider value={session}>
      {children}
    </PracticeSessionContext.Provider>
  )
}
