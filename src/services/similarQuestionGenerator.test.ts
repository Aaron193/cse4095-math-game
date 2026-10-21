import { describe, expect, it } from 'vitest'
import type {
  ArithmeticQuestion,
  DifficultyLevel,
  MathOperation,
} from '../types/question'
import type { MistakePattern } from '../types/mistake'
import { generateQuestion } from './questionGenerator'
import {
  generateSimilarQuestion,
  similarCandidates,
} from './similarQuestionGenerator'
import { validateQuestion } from '../utils/validation'
import { operationSymbols, operations } from './questionRules'

function pattern(
  operation: MathOperation,
  a: number,
  b: number,
  difficulty: DifficultyLevel = 2,
): MistakePattern {
  return {
    id: 'parent',
    operation,
    difficulty,
    firstOperand: a,
    secondOperand: b,
    correctAnswer:
      operation === 'addition'
        ? a + b
        : operation === 'subtraction'
          ? a - b
          : operation === 'multiplication'
            ? a * b
            : a / b,
    incorrectCount: 1,
    similarCorrectCount: 0,
    mastered: false,
    lastIncorrectAt: '2026-10-21T10:00:00Z',
  }
}
describe('similar-question generation', () => {
  it.each([
    ['addition', 7, 8, 'subtraction', 15, 7],
    ['subtraction', 15, 7, 'addition', 7, 8],
    ['multiplication', 8, 7, 'division', 56, 7],
    ['division', 56, 7, 'multiplication', 7, 8],
  ] as const)(
    'generates the %s fact family at the same difficulty',
    (op, a, b, inverse, first, second) => {
      const candidates = similarCandidates(pattern(op, a, b))
      expect(candidates).toContainEqual(
        expect.objectContaining({
          strategy: 'fact-family',
          question: expect.objectContaining({
            operation: inverse,
            firstOperand: first,
            secondOperand: second,
            difficulty: 2,
          }),
        }),
      )
      expect(
        candidates.some((candidate) => candidate.strategy === 'nearby'),
      ).toBe(true)
    },
  )
  it.each(['addition', 'multiplication'] as const)(
    'reverses %s operands without mutating the pattern',
    (op) => {
      const original = pattern(op, 8, 7)
      expect(similarCandidates(original)).toContainEqual(
        expect.objectContaining({
          strategy: 'reversed',
          question: expect.objectContaining({
            firstOperand: 7,
            secondOperand: 8,
          }),
        }),
      )
      expect(original.firstOperand).toBe(8)
    },
  )
  it.each(['subtraction', 'division'] as const)(
    'never uses a reversed strategy for %s',
    (op) => {
      expect(
        similarCandidates(pattern(op, op === 'division' ? 56 : 15, 7)).every(
          (candidate) => candidate.strategy !== 'reversed',
        ),
      ).toBe(true)
    },
  )
  it('filters inverse and reversed forms that violate the original difficulty', () => {
    expect(
      similarCandidates(pattern('addition', 10, 10, 1)).every(
        ({ question }) => question.operation === 'addition',
      ),
    ).toBe(true)
    expect(
      similarCandidates(pattern('multiplication', 10, 1, 4)).some(
        ({ strategy }) => strategy === 'reversed',
      ),
    ).toBe(false)
  })
  it.each(operations)(
    'validates many complete %s review questions at all four levels',
    (operation) => {
      let seed = 417
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
        return seed / 2 ** 32
      }
      const ids = new Set<string>()
      for (const difficulty of [1, 2, 3, 4] as const)
        for (let index = 0; index < 100; index++) {
          const base = generateQuestion(operation, difficulty, random)
          const original: MistakePattern = {
            ...base,
            incorrectCount: 1,
            similarCorrectCount: 0,
            mastered: false,
            lastIncorrectAt: '2026-10-21T10:00:00Z',
          }
          const question = generateSimilarQuestion(original, { random })
          expect(() => validateQuestion(question, ids)).not.toThrow()
          ids.add(question.id)
          expect(question).toMatchObject({
            source: 'mistake-review',
            mistakePatternId: original.id,
            difficulty,
          })
          expect(question.displayText).not.toBe(base.displayText)
          expect(question.choices).toHaveLength(4)
        }
    },
  )
  it.each([
    pattern('addition', 0, 0, 1),
    pattern('subtraction', 0, 0, 1),
    pattern('multiplication', 0, 0, 1),
    pattern('division', 0, 1, 1),
    pattern('addition', 1000, 1000, 4),
    pattern('subtraction', 1000, 1000, 4),
    pattern('multiplication', 99, 99, 4),
    pattern('division', 9801, 99, 4),
  ])(
    'handles zero and maximum boundary fact $operation $firstOperand $secondOperand',
    (original) => {
      expect(() =>
        validateQuestion(
          generateSimilarQuestion(original, { random: () => 0 }),
        ),
      ).not.toThrow()
    },
  )
  it('avoids recent facts when possible, even with a stuck random source, and bounds fallback', () => {
    const original = pattern('multiplication', 8, 7)
    const recent: ArithmeticQuestion[] = []
    for (let index = 0; index < 30; index++) {
      const question = generateSimilarQuestion(original, {
        random: () => 0,
        recent,
      })
      expect(question.displayText).not.toBe(recent.at(-1)?.displayText)
      recent.push(question)
    }
  })
  it('respects selected operations and rejects malformed input', () => {
    const original = pattern('multiplication', 8, 7)
    expect(
      generateSimilarQuestion(original, {
        operations: ['division'],
        random: () => 0,
      }).operation,
    ).toBe('division')
    expect(() =>
      generateSimilarQuestion(original, { operations: [] }),
    ).toThrow()
    expect(() =>
      generateSimilarQuestion({ ...original, correctAnswer: -1 }),
    ).toThrow()
    expect(() =>
      generateSimilarQuestion(pattern('multiplication', 0, 0, 1), {
        operations: ['division'],
      }),
    ).toThrow()
    expect(() =>
      generateSimilarQuestion(original, { random: () => 1 }),
    ).toThrow()
  })
  it('returns readable text and preserves the parent ID', () => {
    const question = generateSimilarQuestion(pattern('multiplication', 8, 7), {
      random: () => 0,
    })
    expect(question.displayText).toBe(
      `${question.firstOperand} ${operationSymbols[question.operation]} ${question.secondOperand} = ?`,
    )
    expect(question.mistakePatternId).toBe('parent')
  })
})
