import { randomInteger } from './math'
import type { RandomSource } from './math'

/** Fisher–Yates shuffle; leaves the caller's array unchanged. */
export function shuffleArray<T>(
  items: readonly T[],
  random: RandomSource = Math.random,
): T[] {
  if (!Array.isArray(items))
    throw new TypeError('Shuffle input must be an array')
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = randomInteger(0, index, random)
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}
