import type { PracticeSession } from '../types/session'

/** Self-reported accuracy rounded to one decimal place; an empty session is 0%. */
export function sessionAccuracy(
  session: Pick<PracticeSession, 'correct' | 'attempted'>,
): number {
  const { correct, attempted } = session
  if (
    !Number.isSafeInteger(correct) ||
    !Number.isSafeInteger(attempted) ||
    attempted < 0 ||
    correct < 0 ||
    correct > attempted
  ) {
    throw new RangeError(
      'Session totals must be nonnegative integers with correct no greater than attempted',
    )
  }
  return attempted === 0 ? 0 : Math.round((correct / attempted) * 1000) / 10
}
