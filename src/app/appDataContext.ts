import type { ReviewHistory } from '../services/reviewService'
import { createContext, useContext } from 'react'
import type { StoredData } from '../services/storageService'
import type { AppSettings } from '../types/settings'
import type { PracticeSessionState } from '../types/session'

export interface AppDataContextValue {
  getReviewHistory: () => ReviewHistory
  data: StoredData
  warning: string | null
  resetKey: number
  defaultsKey: number
  saveSession: (state: PracticeSessionState) => void
  saveSettings: (settings: AppSettings) => void
  resetStatistics: () => void
  clearAll: () => void
}
export const AppDataContext = createContext<AppDataContextValue | null>(null)
export function useAppData() {
  const value = useContext(AppDataContext)
  if (!value) throw new Error('Saved data requires AppDataProvider')
  return value
}
