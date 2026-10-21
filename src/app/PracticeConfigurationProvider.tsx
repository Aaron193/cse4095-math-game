import { useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { PracticeConfiguration } from '../types/session'
import { AppDataContext } from './appDataContext'
import { PracticeConfigurationContext } from './practiceConfigurationContext'

export default function PracticeConfigurationProvider({
  children,
}: {
  children: ReactNode
}) {
  const defaultsKey = useContext(AppDataContext)?.defaultsKey ?? 0
  const [saved, setSaved] = useState<{
    configuration: PracticeConfiguration | null
    defaultsKey: number
  }>({ configuration: null, defaultsKey })
  const configuration =
    saved.defaultsKey === defaultsKey ? saved.configuration : null
  function setConfiguration(next: PracticeConfiguration) {
    setSaved({ configuration: next, defaultsKey })
  }
  return (
    <PracticeConfigurationContext.Provider
      value={{ configuration, setConfiguration }}
    >
      {children}
    </PracticeConfigurationContext.Provider>
  )
}
