import { reportDevelopmentError } from '../services/developmentErrors'
import type { ReviewHistory } from '../services/reviewService'
import { eligibleReviewPatterns } from '../services/reviewService'
import { useRef, useState } from 'react'
import type {
  QuestionCardState,
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
  const [startError, setStartError] = useState<string | null>(null)
  const current = useRef<PracticeSessionState | null>(initialState)
  function commit(next: PracticeSessionState) {
    current.current = next
    setState(next)
    onChange?.(next)
  }
  function startSession(configuration: PracticeConfiguration) {
    if (!isPracticeConfiguration(configuration)) return false
    setStartError(null)
    const history = getHistory?.()
    if (
      configuration.mode === 'mistake-review' &&
      (!history || eligibleReviewPatterns(configuration, history).length === 0)
    )
      return false
    try {
      commit(createPracticeSession(configuration, history))
      return true
    } catch (error) {
      reportDevelopmentError('could not start a session', error)
      setStartError(
        'We couldn’t start practice just now. Your saved answers are safe. Please try again.',
      )
      return false
    }
  }
  function recordResult(
    questionId: string,
    correct: boolean,
    selectedAnswer: number,
  ) {
    if (!current.current) return
    try {
      const next = recordSessionResult(
        current.current,
        questionId,
        correct,
        selectedAnswer,
        getHistory?.(),
      )
      if (next !== current.current) commit(next)
    } catch (error) {
      reportDevelopmentError('answer could not be recorded', error)
      commit({
        ...current.current,
        question: null,
        cardState: { selectedAnswer: null, isCardFlipped: false },
        error:
          'That answer was not recorded. Your earlier answers are safe. Try loading a question again.',
      })
    }
  }
  function updateCardState(questionId: string, cardState: QuestionCardState) {
    const state = current.current
    if (
      !state?.isActive ||
      !state.question ||
      state.question.id !== questionId ||
      state.cardState?.isCardFlipped
    )
      return
    if (
      cardState.selectedAnswer !== null &&
      !state.question.choices.includes(cardState.selectedAnswer)
    )
      return
    if (cardState.isCardFlipped && cardState.selectedAnswer === null) return
    commit({ ...state, cardState: { ...cardState } })
  }
  function endSession() {
    if (current.current?.isActive) commit(endPracticeSession(current.current))
  }
  function retryQuestion() {
    if (current.current?.error)
      commit(retrySessionQuestion(current.current, getHistory?.()))
  }
  return {
    state,
    startError,
    startSession,
    recordResult,
    endSession,
    retryQuestion,
    updateCardState,
  }
}
