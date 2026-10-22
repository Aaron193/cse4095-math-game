import type {
  DifficultyLevel,
  MathOperation,
  Question,
  QuestionSource,
} from './question'

export type PracticeMode = 'regular' | 'mistake-review'

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
  mistakePatternId?: string
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
  mode?: PracticeMode
  completionReason?: 'mastered'
  attempted: number
  correct: number
  incorrect: number
}

/** Setup choices only; no session progress or generated questions. */
export type PracticeConfiguration = Pick<
  PracticeSession,
  'operations' | 'difficulty' | 'sessionLength' | 'mode'
>

export interface QuestionCardState {
  selectedAnswer: number | null
  isCardFlipped: boolean
}
/** The checkpoint references canonical session/attempt records without duplicating them. */
export interface ActiveSessionSnapshot {
  sessionId: string
  question: Question | null
  cardState: QuestionCardState
}

/** Runtime state and its active-card checkpoint are persisted together with attempts. */
export interface PracticeSessionState {
  session: PracticeSession
  currentQuestionIndex: number
  question: Question | null
  attempts: PracticeAttempt[]
  isActive: boolean
  error: string | null
  feedback?: string
  cardState?: QuestionCardState
}
