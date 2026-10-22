import type { DifficultyLevel, MathOperation } from './question'
import type { SessionLength } from './session'

/** Preferences from specification section 6.7; persisted and validated by storageService. */
export interface AppSettings {
  /** Missing in older saved profiles; defaults to enabled. */
  feedbackEnabled?: boolean
  soundEnabled: boolean
  cardAnimationEnabled: boolean
  showExplanations: boolean
  defaultSessionLength: SessionLength
  defaultDifficulty: DifficultyLevel
  defaultOperations: MathOperation[]
  masteryThreshold: number
}
