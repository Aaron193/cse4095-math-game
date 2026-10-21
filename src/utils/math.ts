export type RandomSource = () => number

/** Inclusive bounds. An injectable source makes boundary tests deterministic. */
export function randomInteger(
  min: number,
  max: number,
  random: RandomSource = Math.random,
): number {
  const size = max - min + 1
  if (
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max) ||
    min > max ||
    !Number.isSafeInteger(size)
  ) {
    throw new RangeError(
      'Random integer bounds must be ordered safe integers with a safe range size',
    )
  }
  const value = random()
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError(
      'Random source must return a finite number from 0 (inclusive) to 1 (exclusive)',
    )
  }
  return min + Math.floor(value * size)
}
