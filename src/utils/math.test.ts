import { describe, expect, it } from 'vitest'
import { randomInteger } from './math'

describe('randomInteger', () => {
  it('includes both endpoints, supports negative ranges and a single value', () => {
    expect(randomInteger(-5, 5, () => 0)).toBe(-5)
    expect(randomInteger(-5, 5, () => 1 - Number.EPSILON)).toBe(5)
    expect(randomInteger(7, 7)).toBe(7)
  })
  it.each([
    [5, 4],
    [0.5, 3],
    [0, Infinity],
    [NaN, 1],
    [-Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
    [0, Number.MAX_SAFE_INTEGER],
  ])('rejects unsafe bounds %s..%s', (min, max) => {
    expect(() => randomInteger(min, max)).toThrow(RangeError)
  })
  it.each([-1, 1, Infinity, NaN])(
    'rejects invalid random samples %s',
    (value) => {
      expect(() => randomInteger(0, 5, () => value)).toThrow(RangeError)
    },
  )
  it('returns integers within bounds across repeated calls', () => {
    for (let index = 0; index < 500; index++) {
      const value = randomInteger(-15, 20)
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(-15)
      expect(value).toBeLessThanOrEqual(20)
    }
  })
})
