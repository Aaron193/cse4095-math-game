import type {
  DifficultyLevel,
  MathOperation,
  Question,
  QuestionSource,
} from './question'

export type SessionLength = number | 'continuous'

export interface PracticeAttempt {
  id: string
  questionId: string
  operation: MathOperation
  firstOperand: number
  secondOperand: number
  correctAnswer: number
  selectedAnswer: number
  selfReportedCorrect: boolean
  difficulty: DifficultyLevel
  source: QuestionSource
  /** ISO 8601 timestamp. */
  attemptedAt: string
  sessionId: string
}

export interface PracticeSession {
  id: string
  /** ISO 8601 timestamp. */
  startedAt: string
  completedAt?: string
  operations: MathOperation[]
  difficulty: DifficultyLevel
  sessionLength: SessionLength
  attempted: number
  correct: number
  incorrect: number
}

/** Setup choices only; no session progress or generated questions. */
export type PracticeConfiguration = Pick<
  PracticeSession,
  'operations' | 'difficulty' | 'sessionLength'
>

/** The active card stays in React state; attempts and session metadata are persisted. */
export interface PracticeSessionState {
  session: PracticeSession
  currentQuestionIndex: number
  question: Question | null
  attempts: PracticeAttempt[]
  isActive: boolean
  error: string | null
}
