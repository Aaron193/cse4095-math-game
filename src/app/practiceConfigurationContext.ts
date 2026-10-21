import { createContext, useContext } from 'react'
import type { PracticeConfiguration } from '../types/session'

interface PracticeConfigurationContextValue {
  configuration: PracticeConfiguration | null
  setConfiguration: (configuration: PracticeConfiguration) => void
}

export const PracticeConfigurationContext =
  createContext<PracticeConfigurationContextValue | null>(null)

export function usePracticeConfiguration() {
  const context = useContext(PracticeConfigurationContext)
  if (!context)
    throw new Error(
      'Practice configuration requires PracticeConfigurationProvider',
    )
  return context
}
