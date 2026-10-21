import type {
  PracticeConfiguration,
  PracticeSessionState,
} from '../types/session'
import type { Question } from '../types/question'
import { createQuestionId as createId } from '../utils/ids'
import { validateQuestion } from '../utils/validation'
import { isMathOperation } from './questionRules'
import { generateMultipleChoiceQuestion } from './questionGenerator'

export const MAX_REPEAT_ATTEMPTS = 8

export function isPracticeConfiguration(
  value: unknown,
): value is PracticeConfiguration {
  if (typeof value !== 'object' || value === null) return false
  const config = value as Partial<PracticeConfiguration>
  return (
    Array.isArray(config.operations) &&
    config.operations.length > 0 &&
    Array.from(config.operations).every(isMathOperation) &&
    (config.difficulty === 1 ||
      config.difficulty === 2 ||
      config.difficulty === 3 ||
      config.difficulty === 4) &&
    (config.sessionLength === 5 ||
      config.sessionLength === 10 ||
      config.sessionLength === 20 ||
      config.sessionLength === 'continuous')
  )
}

/** Bounded best effort: a stuck random source may repeat after eight draws. */
function nextQuestion(state: PracticeSessionState): Question {
  const previous = state.attempts.at(-1)
  const ids = new Set(state.attempts.map((attempt) => attempt.questionId))
  for (let count = 0; count < MAX_REPEAT_ATTEMPTS; count += 1) {
    const candidate = generateMultipleChoiceQuestion(
      state.session.operations,
      state.session.difficulty,
    )
    validateQuestion(candidate, ids)
    if (
      !previous ||
      candidate.operation !== previous.operation ||
      candidate.firstOperand !== previous.firstOperand ||
      candidate.secondOperand !== previous.secondOperand ||
      count === MAX_REPEAT_ATTEMPTS - 1
    )
      return candidate
  }
  throw new Error('Question generation failed')
}

function loadQuestion(state: PracticeSessionState): PracticeSessionState {
  try {
    return { ...state, question: nextQuestion(state), error: null }
  } catch {
    return {
      ...state,
      question: null,
      error:
        'We couldn’t load the next question. Try again, or end this session.',
    }
  }
}

export function createPracticeSession(
  configuration: PracticeConfiguration,
): PracticeSessionState {
  if (!isPracticeConfiguration(configuration))
    throw new TypeError('Invalid practice configuration')
  return loadQuestion({
    session: {
      id: createId(),
      startedAt: new Date().toISOString(),
      operations: [...new Set(configuration.operations)],
      difficulty: configuration.difficulty,
      sessionLength: configuration.sessionLength,
      attempted: 0,
      correct: 0,
      incorrect: 0,
    },
    currentQuestionIndex: 0,
    question: null,
    attempts: [],
    isActive: true,
    error: null,
  })
}

/** Ignore duplicate/stale callbacks; the card already enforces selection and flipping. */
export function recordSessionResult(
  state: PracticeSessionState,
  questionId: string,
  selfReportedCorrect: boolean,
  selectedAnswer: number,
): PracticeSessionState {
  const question = state.question
  if (
    !state.isActive ||
    !question ||
    question.id !== questionId ||
    state.attempts.some((attempt) => attempt.questionId === questionId) ||
    typeof selfReportedCorrect !== 'boolean' ||
    !question.choices.includes(selectedAnswer)
  )
    return state
  const attempted = state.session.attempted + 1
  const completed =
    state.session.sessionLength !== 'continuous' &&
    attempted >= state.session.sessionLength
  const updated: PracticeSessionState = {
    ...state,
    session: {
      ...state.session,
      attempted,
      correct: state.session.correct + (selfReportedCorrect ? 1 : 0),
      incorrect: state.session.incorrect + (selfReportedCorrect ? 0 : 1),
      ...(completed ? { completedAt: new Date().toISOString() } : {}),
    },
    attempts: [
      ...state.attempts,
      {
        id: createId(),
        questionId,
        sessionId: state.session.id,
        operation: question.operation,
        firstOperand: question.firstOperand,
        secondOperand: question.secondOperand,
        correctAnswer: question.correctAnswer,
        selectedAnswer,
        selfReportedCorrect,
        difficulty: question.difficulty,
        source: question.source,
        attemptedAt: new Date().toISOString(),
      },
    ],
    isActive: !completed,
    currentQuestionIndex: completed ? state.currentQuestionIndex : attempted,
    question: null,
    error: null,
  }
  return completed ? updated : loadQuestion(updated)
}

export function endPracticeSession(
  state: PracticeSessionState,
): PracticeSessionState {
  if (!state.isActive) return state
  return {
    ...state,
    isActive: false,
    question: null,
    error: null,
    session: { ...state.session, completedAt: new Date().toISOString() },
  }
}

export function retrySessionQuestion(
  state: PracticeSessionState,
): PracticeSessionState {
  return state.isActive && state.error ? loadQuestion(state) : state
}
