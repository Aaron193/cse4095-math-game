import type { MistakePattern } from '../types/mistake'
import type { PracticeAttempt } from '../types/session'
import { validateArithmeticQuestion } from '../utils/validation'
import { isMathOperation, operationSymbols } from './questionRules'

/** Default for new settings; callers can supply another positive integer. */
export const DEFAULT_MASTERY_THRESHOLD = 3
export function assertMasteryThreshold(value: number) {
  if (!Number.isSafeInteger(value) || value < 1)
    throw new RangeError('Mastery threshold must be a positive integer')
}
/** Operand order is intentional: reversed facts are related, not duplicate records. */
export function mistakeId(
  fact: Pick<
    PracticeAttempt,
    'operation' | 'difficulty' | 'firstOperand' | 'secondOperand'
  >,
) {
  return `mistake:${fact.operation}:${fact.difficulty}:${fact.firstOperand}:${fact.secondOperand}`
}
export function validateMistakePattern(
  value: unknown,
): asserts value is MistakePattern {
  if (typeof value !== 'object' || value === null)
    throw new TypeError('Mistake must be an object')
  const pattern = value as Record<string, unknown>
  if (!isMathOperation(pattern.operation))
    throw new TypeError('Unsupported mistake operation')
  validateArithmeticQuestion({
    ...pattern,
    source: 'regular',
    displayText: `${pattern.firstOperand} ${operationSymbols[pattern.operation]} ${pattern.secondOperand} = ?`,
  })
  if (
    !Number.isSafeInteger(pattern.incorrectCount) ||
    (pattern.incorrectCount as number) < 1 ||
    !Number.isSafeInteger(pattern.similarCorrectCount) ||
    (pattern.similarCorrectCount as number) < 0 ||
    typeof pattern.mastered !== 'boolean' ||
    typeof pattern.lastIncorrectAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T/.test(pattern.lastIncorrectAt) ||
    !Number.isFinite(Date.parse(pattern.lastIncorrectAt))
  )
    throw new TypeError('Invalid mistake progress or date')
}
/** Replay canonical history; repeated saves never increment derived progress twice. */
export function deriveMistakePatterns(
  attempts: readonly PracticeAttempt[],
  threshold = DEFAULT_MASTERY_THRESHOLD,
): MistakePattern[] {
  assertMasteryThreshold(threshold)
  const patterns = new Map<string, MistakePattern>()
  const ids = new Set<string>(),
    questions = new Set<string>()
  const ordered = [...attempts].sort(
    (a, b) => Date.parse(a.attemptedAt) - Date.parse(b.attemptedAt),
  )
  for (const attempt of ordered) {
    if (ids.has(attempt.id) || questions.has(attempt.questionId)) continue
    ids.add(attempt.id)
    questions.add(attempt.questionId)
    const parent =
      attempt.source === 'mistake-review' && attempt.mistakePatternId
        ? patterns.get(attempt.mistakePatternId)
        : undefined
    if (parent) {
      const similarCorrectCount = attempt.selfReportedCorrect
        ? Math.min(threshold, parent.similarCorrectCount + 1)
        : 0
      patterns.set(parent.id, {
        ...parent,
        similarCorrectCount,
        mastered: similarCorrectCount >= threshold,
        incorrectCount:
          parent.incorrectCount + (attempt.selfReportedCorrect ? 0 : 1),
        lastIncorrectAt: attempt.selfReportedCorrect
          ? parent.lastIncorrectAt
          : attempt.attemptedAt,
      })
      continue
    }
    if (attempt.selfReportedCorrect) continue
    const id = mistakeId(attempt)
    const previous = patterns.get(id)
    patterns.set(id, {
      id,
      operation: attempt.operation,
      difficulty: attempt.difficulty,
      firstOperand: attempt.firstOperand,
      secondOperand: attempt.secondOperand,
      correctAnswer: attempt.correctAnswer,
      incorrectCount: (previous?.incorrectCount ?? 0) + 1,
      similarCorrectCount: 0,
      lastIncorrectAt: attempt.attemptedAt,
      mastered: false,
    })
  }
  return [...patterns.values()]
}
