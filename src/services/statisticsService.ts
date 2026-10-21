import type { PracticeAttempt, PracticeSession } from '../types/session'
import type { AppStatistics, OperationStatistics } from '../types/statistics'
import { sessionAccuracy } from '../utils/sessionSummary'

export const accuracy = sessionAccuracy
const empty = (): OperationStatistics => ({
  attempted: 0,
  correct: 0,
  incorrect: 0,
})

/** Attempts are canonical; never increment a separately maintained aggregate. */
export function calculateStatistics(
  attempts: readonly PracticeAttempt[],
): AppStatistics {
  const statistics: AppStatistics = {
    ...empty(),
    byOperation: {
      addition: empty(),
      subtraction: empty(),
      multiplication: empty(),
      division: empty(),
    },
    byDifficulty: { 1: empty(), 2: empty(), 3: empty(), 4: empty() },
  }
  for (const attempt of attempts) {
    for (const total of [
      statistics,
      statistics.byOperation[attempt.operation],
      statistics.byDifficulty[attempt.difficulty],
    ]) {
      total.attempted++
      if (attempt.selfReportedCorrect) total.correct++
      else total.incorrect++
    }
  }
  return statistics
}

export function sessionTotals(
  session: PracticeSession,
  attempts: readonly PracticeAttempt[],
): PracticeSession {
  const records = attempts.filter((attempt) => attempt.sessionId === session.id)
  const correct = records.filter(
    (attempt) => attempt.selfReportedCorrect,
  ).length
  return {
    ...session,
    attempted: records.length,
    correct,
    incorrect: records.length - correct,
  }
}

export function recentSessions(
  sessions: readonly PracticeSession[],
  limit = 20,
) {
  return [...sessions]
    .sort(
      (a, b) =>
        Date.parse(b.completedAt ?? b.startedAt) -
        Date.parse(a.completedAt ?? a.startedAt),
    )
    .slice(0, limit)
}
