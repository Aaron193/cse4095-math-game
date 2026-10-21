import { describe, expect, it } from 'vitest'
import { sessionAccuracy } from './sessionSummary'

describe('session accuracy', () => {
  it.each([
    [0, 0, 0],
    [0, 5, 0],
    [5, 5, 100],
    [3, 5, 60],
    [1, 3, 33.3],
    [2, 3, 66.7],
    [19, 20, 95],
  ])(
    '%s correct out of %s gives %s percent',
    (correct, attempted, accuracy) => {
      expect(sessionAccuracy({ correct, attempted })).toBe(accuracy)
    },
  )
  it.each([
    [1, 0],
    [-1, 5],
    [6, 5],
    [0, -1],
    [1.5, 5],
    [NaN, 5],
    [1, Infinity],
  ])('rejects invalid totals %s/%s', (correct, attempted) => {
    expect(() => sessionAccuracy({ correct, attempted })).toThrow(RangeError)
  })
})
