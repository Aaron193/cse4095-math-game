import type { MistakePattern } from '../types/mistake'
import type { PracticeAttempt, PracticeConfiguration } from '../types/session'
import { randomInteger } from '../utils/math'
import type { RandomSource } from '../utils/math'
import { assertMasteryThreshold, deriveMistakePatterns } from './mistakeService'

export interface ReviewHistory {
  attempts: readonly PracticeAttempt[]
  masteryThreshold: number
}
export function eligibleReviewPatterns(
  configuration: PracticeConfiguration,
  history: ReviewHistory,
  pending: readonly PracticeAttempt[] = [],
) {
  return deriveMistakePatterns(
    [...history.attempts, ...pending],
    history.masteryThreshold,
  ).filter(
    (pattern) =>
      !pattern.mastered &&
      pattern.difficulty === configuration.difficulty &&
      configuration.operations.includes(pattern.operation),
  )
}
/** Recent misses and fewer successful reviews increase priority without needing a timer. */
export function reviewPriority(
  pattern: MistakePattern,
  threshold: number,
  newestMistakeAt: number,
) {
  assertMasteryThreshold(threshold)
  const ageDays =
    Math.max(0, newestMistakeAt - Date.parse(pattern.lastIncorrectAt)) /
    86400000
  return (
    pattern.incorrectCount * 3 +
    Math.max(0, threshold - pattern.similarCorrectCount) * 2 +
    (ageDays < 1 ? 2 : ageDays < 7 ? 1 : 0)
  )
}
export function selectReviewPattern(
  patterns: readonly MistakePattern[],
  threshold: number,
  random: RandomSource = Math.random,
  previousId?: string,
): MistakePattern {
  assertMasteryThreshold(threshold)
  let active = patterns.filter((pattern) => !pattern.mastered)
  if (active.length === 0) throw new RangeError('No active mistakes to review')
  // Mix patterns instead of repeatedly exhausting the same fact first.
  if (active.length > 1 && previousId)
    active = active.filter((pattern) => pattern.id !== previousId)
  const newest = Math.max(
    ...active.map((pattern) => Date.parse(pattern.lastIncorrectAt)),
  )
  const scores = active.map((pattern) =>
    reviewPriority(pattern, threshold, newest),
  )
  const maximum = Math.max(...scores)
  const similarPriority = active.filter(
    (_, index) => scores[index] >= maximum - 2,
  )
  return similarPriority[randomInteger(0, similarPriority.length - 1, random)]
}
