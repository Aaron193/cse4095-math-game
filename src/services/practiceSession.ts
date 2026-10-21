import type {
  PracticeConfiguration,
  PracticeSessionState,
} from '../types/session'
import type { Question } from '../types/question'
import { createQuestionId as createId } from '../utils/ids'
import { validateQuestion } from '../utils/validation'
import { isMathOperation } from './questionRules'
import { eligibleReviewPatterns, selectReviewPattern } from './reviewService'
import type { ReviewHistory } from './reviewService'
import { generateSimilarQuestion } from './similarQuestionGenerator'
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
      config.sessionLength === 'continuous') &&
    (config.mode === undefined ||
      config.mode === 'regular' ||
      config.mode === 'mistake-review')
  )
}

/** Bounded best effort: a stuck random source may repeat after eight draws. */
function nextQuestion(
  state: PracticeSessionState,
  history?: ReviewHistory,
): Question {
  if (state.session.mode === 'mistake-review') {
    if (!history) throw new Error('Review history is required')
    const patterns = eligibleReviewPatterns(
      state.session,
      history,
      state.attempts,
    )
    const pattern = selectReviewPattern(
      patterns,
      history.masteryThreshold,
      Math.random,
      state.attempts.at(-1)?.mistakePatternId,
    )
    const candidate = generateSimilarQuestion(pattern, {
      operations: state.session.operations,
      recent: state.attempts.slice(-6),
    })
    validateQuestion(
      candidate,
      new Set(state.attempts.map((attempt) => attempt.questionId)),
    )
    return candidate
  }
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

function loadQuestion(
  state: PracticeSessionState,
  history?: ReviewHistory,
): PracticeSessionState {
  if (
    state.session.mode === 'mistake-review' &&
    history &&
    eligibleReviewPatterns(state.session, history, state.attempts).length === 0
  ) {
    return {
      ...endPracticeSession(state),
      session: {
        ...state.session,
        completedAt: new Date().toISOString(),
        completionReason: 'mastered',
      },
    }
  }
  try {
    return { ...state, question: nextQuestion(state, history), error: null }
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
  history?: ReviewHistory,
): PracticeSessionState {
  if (!isPracticeConfiguration(configuration))
    throw new TypeError('Invalid practice configuration')
  if (
    configuration.mode === 'mistake-review' &&
    (!history || eligibleReviewPatterns(configuration, history).length === 0)
  )
    throw new RangeError('No active mistakes match these choices')
  return loadQuestion(
    {
      session: {
        id: createId(),
        startedAt: new Date().toISOString(),
        operations: [...new Set(configuration.operations)],
        difficulty: configuration.difficulty,
        sessionLength: configuration.sessionLength,
        ...(configuration.mode ? { mode: configuration.mode } : {}),
        attempted: 0,
        correct: 0,
        incorrect: 0,
      },
      currentQuestionIndex: 0,
      question: null,
      attempts: [],
      isActive: true,
      error: null,
    },
    history,
  )
}

/** Ignore duplicate/stale callbacks; the card already enforces selection and flipping. */
export function recordSessionResult(
  state: PracticeSessionState,
  questionId: string,
  selfReportedCorrect: boolean,
  selectedAnswer: number,
  history?: ReviewHistory,
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
        ...(question.mistakePatternId
          ? { mistakePatternId: question.mistakePatternId }
          : {}),
        attemptedAt: new Date().toISOString(),
      },
    ],
    isActive: !completed,
    currentQuestionIndex: completed ? state.currentQuestionIndex : attempted,
    question: null,
    error: null,
  }
  return completed ? updated : loadQuestion(updated, history)
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
  history?: ReviewHistory,
): PracticeSessionState {
  return state.isActive && state.error ? loadQuestion(state, history) : state
}
