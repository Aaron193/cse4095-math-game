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
export default function usePracticeSession() {
  const [state, setState] = useState<PracticeSessionState | null>(null)
  const current = useRef<PracticeSessionState | null>(null)
  function commit(next: PracticeSessionState) {
    current.current = next
    setState(next)
  }
  function startSession(configuration: PracticeConfiguration) {
    if (!isPracticeConfiguration(configuration)) return false
    commit(createPracticeSession(configuration))
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
    )
    if (next !== current.current) commit(next)
  }
  function endSession() {
    if (current.current?.isActive) commit(endPracticeSession(current.current))
  }
  function retryQuestion() {
    if (current.current?.error) commit(retrySessionQuestion(current.current))
  }
  return { state, startSession, recordResult, endSession, retryQuestion }
}
