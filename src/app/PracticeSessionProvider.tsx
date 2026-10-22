import type { ReactNode } from 'react'
import { useState } from 'react'
import { useAppData } from './appDataContext'
import { restoreSavedSession } from '../services/storageService'
import usePracticeSession from '../hooks/usePracticeSession'
import { PracticeSessionContext } from './practiceSessionContext'

export default function PracticeSessionProvider({
  children,
}: {
  children: ReactNode
}) {
  const { data, saveSession, getReviewHistory } = useAppData()
  const [initial] = useState(() => restoreSavedSession(data))
  const session = usePracticeSession(initial, saveSession, getReviewHistory)
  return (
    <PracticeSessionContext.Provider value={session}>
      {children}
    </PracticeSessionContext.Provider>
  )
}
