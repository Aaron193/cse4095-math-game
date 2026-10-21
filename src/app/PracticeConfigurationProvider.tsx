import { useState } from 'react'
import type { ReactNode } from 'react'
import type { PracticeConfiguration } from '../types/session'
import { PracticeConfigurationContext } from './practiceConfigurationContext'

export default function PracticeConfigurationProvider({
  children,
}: {
  children: ReactNode
}) {
  const [configuration, setConfiguration] =
    useState<PracticeConfiguration | null>(null)
  return (
    <PracticeConfigurationContext.Provider
      value={{ configuration, setConfiguration }}
    >
      {children}
    </PracticeConfigurationContext.Provider>
  )
}
