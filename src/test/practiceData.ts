import {
  createPracticeSession,
  endPracticeSession,
  recordSessionResult,
} from '../services/practiceSession'
import { emptyData, saveSession } from '../services/storageService'
import type { StoredData } from '../services/storageService'
import type { DifficultyLevel, MathOperation } from '../types/question'

export function practiceData(
  configurations: {
    operation: MathOperation
    difficulty: DifficultyLevel
    results: boolean[]
  }[] = [{ operation: 'addition', difficulty: 1, results: [true, false] }],
): StoredData {
  let data = emptyData()
  for (const { operation, difficulty, results } of configurations) {
    let state = createPracticeSession({
      operations: [operation],
      difficulty,
      sessionLength: 'continuous',
    })
    for (const correct of results)
      state = recordSessionResult(
        state,
        state.question!.id,
        correct,
        state.question!.choices[0],
      )
    data = saveSession(data, endPracticeSession(state))
  }
  return data
}
