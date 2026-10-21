import { describe, expect, it } from 'vitest'
import { mistakeAttempt as attempt } from '../test/mistakeData'
import { deriveMistakePatterns, mistakeId } from './mistakeService'
import {
  calculateMistakeStatistics,
  sortMistakePatterns,
} from './mistakeStatistics'

describe('mistake-related statistics', () => {
  it('has safe empty counts and no false most-missed operation', () => {
    expect(calculateMistakeStatistics([], [])).toEqual({
      active: 0,
      mastered: 0,
      reviewAttempted: 0,
      reviewCorrect: 0,
      mostMissedOperations: [],
      mostMisses: 0,
      topFacts: [],
    })
  })
  it('counts active/mastered parents and review answers without adding attempts twice', () => {
    const original = attempt(0)
    const records = [
      original,
      ...[1, 2, 3].map((i) =>
        attempt(i, {
          source: 'mistake-review',
          mistakePatternId: mistakeId(original),
          selfReportedCorrect: true,
        }),
      ),
      attempt(4, { operation: 'addition', correctAnswer: 15 }),
    ]
    const patterns = deriveMistakePatterns(records)
    const stats = calculateMistakeStatistics(patterns, records)
    expect(stats).toMatchObject({
      active: 1,
      mastered: 1,
      reviewAttempted: 3,
      reviewCorrect: 3,
      mostMissedOperations: ['addition', 'multiplication'],
      mostMisses: 1,
    })
    expect(stats.topFacts).toHaveLength(2)
  })
  it('uses the actual missed operation for inverse review, while updating the original fact count', () => {
    const original = attempt(0)
    const records = [
      original,
      attempt(1, {
        source: 'mistake-review',
        mistakePatternId: mistakeId(original),
        operation: 'division',
        firstOperand: 56,
        secondOperand: 7,
        correctAnswer: 8,
        selectedAnswer: 8,
      }),
    ]
    const stats = calculateMistakeStatistics(
      deriveMistakePatterns(records),
      records,
    )
    expect(stats.mostMissedOperations).toEqual(['multiplication', 'division'])
    expect(stats.topFacts[0].incorrectCount).toBe(2)
    expect(stats.reviewAttempted).toBe(1)
    expect(stats.reviewCorrect).toBe(0)
  })
  it('sorts facts by count, then date, then stable ID without mutation and includes all top ties', () => {
    const base = deriveMistakePatterns([attempt(0)])[0]
    const patterns = [
      { ...base, id: 'z', incorrectCount: 2 },
      { ...base, id: 'b', incorrectCount: 4 },
      { ...base, id: 'a', incorrectCount: 4 },
      {
        ...base,
        id: 'recent',
        incorrectCount: 4,
        lastIncorrectAt: attempt(1).attemptedAt,
      },
    ]
    expect(sortMistakePatterns(patterns).map((p) => p.id)).toEqual([
      'recent',
      'a',
      'b',
      'z',
    ])
    expect(calculateMistakeStatistics(patterns, []).topFacts).toHaveLength(3)
    expect(patterns[0].id).toBe('z')
  })
})
