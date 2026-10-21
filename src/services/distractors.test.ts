import { describe, expect, it, vi } from 'vitest'
import type {
  ArithmeticQuestion,
  DifficultyLevel,
  MathOperation,
} from '../types/question'
import { generateDistractors, MAX_DISTRACTOR_ATTEMPTS } from './distractors'

function fixture(
  operation: MathOperation,
  a: number,
  b: number,
  answer: number,
  difficulty: DifficultyLevel = 2,
): ArithmeticQuestion {
  const symbols = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷',
  }
  return {
    id: 'fixture',
    operation,
    firstOperand: a,
    secondOperand: b,
    correctAnswer: answer,
    difficulty,
    displayText: `${a} ${symbols[operation]} ${b} = ?`,
    source: 'regular',
  }
}
function samples(...values: number[]) {
  let index = 0
  return () => values[index++ % values.length]
}

describe('operation-specific distractors', () => {
  it('includes nearby addition errors and a missed carry', () => {
    expect(
      generateDistractors(
        fixture('addition', 7, 8, 15, 1),
        samples(0, 0.4, 0.6),
      ),
    ).toEqual([5, 14, 16])
    expect(
      generateDistractors(
        fixture('addition', 3, 4, 7, 1),
        samples(0, 0.3, 0.6),
      ),
    ).toEqual([6, 8, 5])
  })
  it('includes nearby subtraction errors and a missed borrow', () => {
    expect(
      generateDistractors(
        fixture('subtraction', 15, 7, 8),
        samples(0, 0.4, 0.6),
      ),
    ).toEqual([18, 7, 9])
  })
  it('uses neighboring multiplication facts', () => {
    expect(
      generateDistractors(
        fixture('multiplication', 8, 7, 56),
        samples(0, 0.12, 0.24),
      ),
    ).toEqual([48, 64, 49])
  })
  it('uses neighboring quotients and a related division fact, filtering fractions', () => {
    expect(
      generateDistractors(
        fixture('division', 56, 7, 8),
        samples(0, 0.55, 0.75),
      ),
    ).toEqual([7, 9, 6])
    const distractors = generateDistractors(
      fixture('division', 56, 7, 8),
      () => 0.2,
    )
    expect(distractors).not.toContain(56 / 6)
    expect(distractors.every(Number.isInteger)).toBe(true)
  })
  it('stops retrying and fills nearby valid values even when every random attempt is unusable', () => {
    const random = vi.fn(() => 0)
    expect(
      generateDistractors(fixture('multiplication', 0, 0, 0, 1), random),
    ).toEqual([1, 2, 3])
    expect(random).toHaveBeenCalledTimes(MAX_DISTRACTOR_ATTEMPTS)
  })
  it('fills duplicate draws without requiring the random source to produce distinct results', () => {
    const random = vi.fn(() => 0)
    const distractors = generateDistractors(
      fixture('addition', 3, 4, 7, 1),
      random,
    )
    expect(random).toHaveBeenCalledTimes(MAX_DISTRACTOR_ATTEMPTS)
    expect(distractors).toHaveLength(3)
    expect(new Set(distractors).size).toBe(3)
    expect(distractors).not.toContain(7)
  })
  it.each([
    ['addition', 0, 0, 0, 1, 20],
    ['subtraction', 0, 0, 0, 1, 10],
    ['multiplication', 0, 0, 0, 1, 25],
    ['division', 0, 5, 0, 1, 5],
    ['addition', 0, 1, 1, 1, 20],
    ['division', 1, 1, 1, 1, 5],
    ['addition', 1000, 1000, 2000, 4, 2000],
    ['subtraction', 1000, 0, 1000, 4, 1000],
    ['multiplication', 99, 99, 9801, 4, 9801],
    ['division', 9801, 99, 99, 4, 99],
    ['division', 144, 12, 12, 3, 12],
  ] as const)(
    'handles %s near a boundary: %s and %s',
    (operation, a, b, answer, difficulty, ceiling) => {
      for (const random of [() => 0, () => 1 - Number.EPSILON]) {
        const distractors = generateDistractors(
          fixture(operation, a, b, answer, difficulty),
          random,
        )
        expect(distractors).toHaveLength(3)
        expect(new Set(distractors).size).toBe(3)
        expect(distractors).not.toContain(answer)
        for (const choice of distractors) {
          expect(Number.isSafeInteger(choice)).toBe(true)
          expect(choice).toBeGreaterThanOrEqual(0)
          expect(choice).toBeLessThanOrEqual(ceiling)
        }
      }
    },
  )
  it('rejects invalid arithmetic and broken randomness rather than returning bad choices', () => {
    const invalid = fixture('addition', 1, 2, 4, 1)
    expect(() => generateDistractors(invalid)).toThrow(
      'mathematically incorrect',
    )
    expect(() =>
      generateDistractors(fixture('addition', 1, 2, 3, 1), () => NaN),
    ).toThrow(RangeError)
  })
})
