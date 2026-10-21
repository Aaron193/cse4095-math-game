import type { ReviewHistory } from '../services/reviewService'
import { eligibleReviewPatterns } from '../services/reviewService'
import { useRef, useState } from 'react'
import type {
  PracticeConfiguration,
  PracticeSessionState,
} from '../types/session'
import {
  createPracticeSession,
  endPracticeSession,
  isPracticeConfiguration,
  recordSessionResult,
  retrySessionQuestion,
} from '../services/practiceSession'

/** Compute transitions in event handlers, outside render/reducer updater functions. */
export default function usePracticeSession(
  initialState: PracticeSessionState | null = null,
  onChange?: (state: PracticeSessionState) => void,
  getHistory?: () => ReviewHistory,
) {
  const [state, setState] = useState<PracticeSessionState | null>(initialState)
  const current = useRef<PracticeSessionState | null>(initialState)
  function commit(next: PracticeSessionState) {
    current.current = next
    setState(next)
    onChange?.(next)
  }
  function startSession(configuration: PracticeConfiguration) {
    if (!isPracticeConfiguration(configuration)) return false
    const history = getHistory?.()
    if (
      configuration.mode === 'mistake-review' &&
      (!history || eligibleReviewPatterns(configuration, history).length === 0)
    )
      return false
    commit(createPracticeSession(configuration, history))
    return true
  }
  function recordResult(
    questionId: string,
    correct: boolean,
    selectedAnswer: number,
  ) {
    if (!current.current) return
    const next = recordSessionResult(
      current.current,
      questionId,
      correct,
      selectedAnswer,
      getHistory?.(),
    )
    if (next !== current.current) commit(next)
  }
  function endSession() {
    if (current.current?.isActive) commit(endPracticeSession(current.current))
  }
  function retryQuestion() {
    if (current.current?.error)
      commit(retrySessionQuestion(current.current, getHistory?.()))
  }
  return { state, startSession, recordResult, endSession, retryQuestion }
}
