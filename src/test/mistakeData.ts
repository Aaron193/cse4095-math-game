import type { PracticeAttempt } from '../types/session'

export function mistakeAttempt(
  index: number,
  patch: Partial<PracticeAttempt> = {},
): PracticeAttempt {
  return {
    id: `a-${index}`,
    questionId: `q-${index}`,
    sessionId: 'session',
    operation: 'multiplication',
    difficulty: 2,
    firstOperand: 8,
    secondOperand: 7,
    correctAnswer: 56,
    selectedAnswer: 56,
    selfReportedCorrect: false,
    source: 'regular',
    attemptedAt: new Date(Date.UTC(2026, 9, 21, 10, index)).toISOString(),
    ...patch,
  }
}
