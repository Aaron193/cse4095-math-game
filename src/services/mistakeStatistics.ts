import type { MistakePattern } from '../types/mistake'
import type { PracticeAttempt } from '../types/session'
import { operations } from './questionRules'

export function sortMistakePatterns(patterns: readonly MistakePattern[]) {
  return [...patterns].sort(
    (a, b) =>
      b.incorrectCount - a.incorrectCount ||
      Date.parse(b.lastIncorrectAt) - Date.parse(a.lastIncorrectAt) ||
      a.id.localeCompare(b.id),
  )
}
export function calculateMistakeStatistics(
  patterns: readonly MistakePattern[],
  attempts: readonly PracticeAttempt[],
) {
  const reviews = attempts.filter(
    (attempt) => attempt.source === 'mistake-review',
  )
  // Operation statistics refer to the operation actually answered, including inverse review facts.
  const misses = Object.fromEntries(
    operations.map((operation) => [operation, 0]),
  )
  for (const attempt of attempts)
    if (!attempt.selfReportedCorrect) misses[attempt.operation]++
  const mostMisses = Math.max(0, ...Object.values(misses))
  const sorted = sortMistakePatterns(patterns)
  const topFacts = sorted.filter(
    (pattern) => pattern.incorrectCount === sorted[0]?.incorrectCount,
  )
  return {
    active: patterns.filter((pattern) => !pattern.mastered).length,
    mastered: patterns.filter((pattern) => pattern.mastered).length,
    reviewAttempted: reviews.length,
    reviewCorrect: reviews.filter((attempt) => attempt.selfReportedCorrect)
      .length,
    mostMissedOperations: operations.filter(
      (operation) => mostMisses > 0 && misses[operation] === mostMisses,
    ),
    mostMisses,
    topFacts,
  }
}
