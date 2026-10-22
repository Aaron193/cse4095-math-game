import { describe, expect, it } from 'vitest'
import { mistakeAttempt as attempt } from '../test/mistakeData'
import {
  deriveMistakePatterns,
  mistakeId,
  validateMistakePattern,
} from './mistakeService'
import {
  emptyData,
  normalizeData,
  readStorage,
  STORAGE_KEY,
  writeStorage,
} from './storageService'

describe('mistake tracking from history', () => {
  it('creates a complete pattern only for self-reported incorrect answers', () => {
    const wrong = attempt(1)
    const patterns = deriveMistakePatterns([
      attempt(0, { selfReportedCorrect: true }),
      wrong,
    ])
    expect(patterns).toEqual([
      {
        id: mistakeId(wrong),
        operation: 'multiplication',
        difficulty: 2,
        firstOperand: 8,
        secondOperand: 7,
        correctAnswer: 56,
        incorrectCount: 1,
        similarCorrectCount: 0,
        mastered: false,
        lastIncorrectAt: wrong.attemptedAt,
      },
    ])
    expect(() => validateMistakePattern(patterns[0])).not.toThrow()
  })
  it('updates the same fact, counts distinct attempts and uses the latest date regardless of input order', () => {
    const patterns = deriveMistakePatterns([
      attempt(2),
      attempt(0),
      attempt(1),
      attempt(1),
      attempt(0, { id: 'same-question' }),
    ])
    expect(patterns).toHaveLength(1)
    expect(patterns[0]).toMatchObject({
      incorrectCount: 3,
      lastIncorrectAt: attempt(2).attemptedAt,
    })
  })
  it('keeps operations, difficulties and ordered operands distinct', () => {
    expect(
      deriveMistakePatterns([
        attempt(0),
        attempt(1, { difficulty: 3 }),
        attempt(2, { firstOperand: 7, secondOperand: 8 }),
        attempt(3, { operation: 'addition', correctAnswer: 15 }),
      ]),
    ).toHaveLength(4)
  })
  it('round-trips patterns and repairs invalid cached patterns without losing history', () => {
    const data = normalizeData({
      ...emptyData(),
      attempts: [attempt(0), attempt(1)],
    })
    expect(writeStorage(data)).toBeNull()
    expect(readStorage().data.mistakePatterns).toEqual(data.mistakePatterns)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...data,
        mistakePatterns: [{ id: 'corrupt', incorrectCount: -1 }],
      }),
    )
    expect(readStorage().warning).toContain('repair')
    expect(readStorage().data.mistakePatterns).toEqual(data.mistakePatterns)
    expect(readStorage().data.statistics.incorrect).toBe(2)
  })
  it('migrates version 1 and backfills mistakes from existing accepted attempts', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...emptyData(), version: 1, attempts: [attempt(0)] }),
    )
    expect(readStorage().data.version).toBe(3)
    expect(readStorage().data.mistakePatterns[0].incorrectCount).toBe(1)
  })
  it.each([
    { incorrectCount: 0 },
    { similarCorrectCount: -1 },
    { mastered: 'yes' },
    { lastIncorrectAt: 'bad' },
    { correctAnswer: 999 },
    { operation: 'power' },
  ])('rejects invalid pattern data %j', (patch) => {
    const pattern = deriveMistakePatterns([attempt(0)])[0]
    expect(() => validateMistakePattern({ ...pattern, ...patch })).toThrow()
  })
  it('rejects invalid mastery thresholds', () => {
    for (const value of [0, -1, 1.5, NaN])
      expect(() => deriveMistakePatterns([], value)).toThrow()
  })
})

describe('review mastery replay', () => {
  const original = attempt(0)
  const linked = (index: number, correct = true) =>
    attempt(index, {
      source: 'mistake-review',
      mistakePatternId: mistakeId(original),
      selfReportedCorrect: correct,
      firstOperand: 7,
      secondOperand: 8,
    })
  it('masters after three distinct successful linked reviews and ignores duplicates', () => {
    const records = [original, linked(1), linked(2)]
    expect(deriveMistakePatterns(records)[0]).toMatchObject({
      similarCorrectCount: 2,
      mastered: false,
    })
    const patterns = deriveMistakePatterns([
      ...records,
      linked(2),
      linked(3),
      linked(3),
    ])
    expect(patterns).toHaveLength(1)
    expect(patterns[0]).toMatchObject({
      incorrectCount: 1,
      similarCorrectCount: 3,
      mastered: true,
    })
    const data = normalizeData({
      ...emptyData(),
      attempts: [...records, linked(3)],
    })
    writeStorage(data)
    expect(readStorage().data.mistakePatterns).toEqual(patterns)
  })
  it('a missed review updates the original pattern once and resets progress', () => {
    const patterns = deriveMistakePatterns([
      original,
      linked(1),
      linked(2),
      linked(3, false),
    ])
    expect(patterns).toHaveLength(1)
    expect(patterns[0]).toMatchObject({
      incorrectCount: 2,
      similarCorrectCount: 0,
      mastered: false,
      lastIncorrectAt: linked(3).attemptedAt,
    })
  })
  it('reactivates a mastered pattern after a later regular mistake', () => {
    expect(
      deriveMistakePatterns([
        original,
        linked(1),
        linked(2),
        linked(3),
        attempt(4),
      ])[0],
    ).toMatchObject({
      incorrectCount: 2,
      similarCorrectCount: 0,
      mastered: false,
      lastIncorrectAt: attempt(4).attemptedAt,
    })
  })
  it('uses a configurable threshold and does not count ordinary correct answers or unlinked reviews toward mastery', () => {
    const history = [
      original,
      linked(1),
      attempt(2, { selfReportedCorrect: true }),
      attempt(3, { source: 'mistake-review', selfReportedCorrect: true }),
      linked(4),
    ]
    expect(deriveMistakePatterns(history, 2)[0]).toMatchObject({
      similarCorrectCount: 2,
      mastered: true,
    })
    expect(deriveMistakePatterns(history, 3)[0]).toMatchObject({
      similarCorrectCount: 2,
      mastered: false,
    })
  })
})
