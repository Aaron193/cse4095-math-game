import type { DifficultyLevel, MathOperation } from './question'
import type { SessionLength } from './session'

/** Preferences from specification section 6.7; defaults are added in a later phase. */
export interface AppSettings {
  soundEnabled: boolean
  cardAnimationEnabled: boolean
  showExplanations: boolean
  defaultSessionLength: SessionLength
  defaultDifficulty: DifficultyLevel
  defaultOperations: MathOperation[]
  masteryThreshold: number
}
