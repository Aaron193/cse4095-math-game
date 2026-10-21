import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AppDataContext } from './appDataContext'
import {
  clearApplicationStorage,
  emptyData,
  isAppSettings,
  normalizeData,
  readStorage,
  saveSession,
  writeStorage,
} from '../services/storageService'
import type { StoredData } from '../services/storageService'
import type { AppSettings } from '../types/settings'
import type { PracticeSessionState } from '../types/session'

export default function AppDataProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readStorage)
  const [data, setData] = useState(initial.data)
  const current = useRef(data)
  const writable = useRef(initial.writable)
  const [warning, setWarning] = useState(initial.warning)
  const [resetKey, setResetKey] = useState(0)
  const [defaultsKey, setDefaultsKey] = useState(0)
  function commit(next: StoredData) {
    current.current = next
    setData(next)
    if (writable.current) setWarning(writeStorage(next))
  }
  function record(state: PracticeSessionState) {
    commit(saveSession(current.current, state))
  }
  function saveSettings(settings: AppSettings) {
    if (!isAppSettings(settings)) return
    const previous = current.current.settings
    const changedDefaults =
      previous.defaultDifficulty !== settings.defaultDifficulty ||
      previous.defaultSessionLength !== settings.defaultSessionLength ||
      JSON.stringify(previous.defaultOperations) !==
        JSON.stringify(settings.defaultOperations)
    commit(normalizeData({ ...current.current, settings }))
    if (changedDefaults) setDefaultsKey((key) => key + 1)
  }
  function resetStatistics() {
    commit({ ...emptyData(), settings: current.current.settings })
    setResetKey((key) => key + 1)
  }
  function clearAll() {
    const error = clearApplicationStorage()
    writable.current = !error
    const next = emptyData()
    current.current = next
    setData(next)
    setWarning(error)
    setResetKey((key) => key + 1)
  }
  return (
    <AppDataContext.Provider
      value={{
        getReviewHistory: () => ({
          attempts: current.current.attempts,
          masteryThreshold: current.current.settings.masteryThreshold,
        }),
        data,
        warning,
        resetKey,
        defaultsKey,
        saveSession: record,
        saveSettings,
        resetStatistics,
        clearAll,
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}
