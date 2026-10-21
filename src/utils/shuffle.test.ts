import { describe, expect, it } from 'vitest'
import { shuffleArray } from './shuffle'

describe('shuffleArray', () => {
  it('uses Fisher–Yates swaps without changing the original array', () => {
    const input = Object.freeze([1, 2, 3, 4])
    expect(shuffleArray(input, () => 0)).toEqual([2, 3, 4, 1])
    expect(input).toEqual([1, 2, 3, 4])
  })
  it('allows an unchanged permutation without requiring a change on every shuffle', () => {
    expect(shuffleArray([1, 2, 3], () => 1 - Number.EPSILON)).toEqual([1, 2, 3])
  })
  it('supports empty arrays, single elements, and duplicate entries', () => {
    expect(shuffleArray([])).toEqual([])
    expect(shuffleArray(['a'])).toEqual(['a'])
    expect(shuffleArray([1, 1, 2], () => 0)).toEqual([1, 2, 1])
  })
  it('preserves object references and every element across repeated shuffles', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
    for (let count = 0; count < 100; count++) {
      const result = shuffleArray(items)
      expect(result).not.toBe(items)
      expect(result).toHaveLength(items.length)
      for (const item of items)
        expect(result.filter((value) => value === item)).toHaveLength(1)
    }
  })
  it('rejects invalid arrays and random sources', () => {
    expect(() => shuffleArray(null as unknown as number[])).toThrow(TypeError)
    expect(() => shuffleArray([1, 2], () => 1)).toThrow(RangeError)
  })
})
