import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DifficultyLevel, MathOperation } from '../types/question'
import { validateArithmeticQuestion } from '../utils/validation'
import {
  generateAdditionQuestion,
  generateSubtractionQuestion,
  generateMultiplicationQuestion,
  generateDivisionQuestion,
} from './arithmeticGenerators'
import { generateQuestion, selectRandomOperation } from './questionGenerator'

const levels: DifficultyLevel[] = [1, 2, 3, 4]
const operationNames: MathOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
]
// Independent expectations from specification section 7 and documented division limits.
const additiveMax = [10, 50, 100, 1000]
const firstFactorMax = [5, 10, 9, 99]
const secondFactorMax = [5, 10, 99, 99]
const divisorMax = [5, 10, 12, 99]
const dividendMax = [25, 100, 144, 9801]
const symbols = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
}
const largestSample = () => 1 - Number.EPSILON
function samples(...values: number[]) {
  let index = 0
  return () => values[index++ % values.length]
}
function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('arithmetic boundaries at every difficulty', () => {
  it.each(levels)(
    'addition level %s includes minimum and maximum operands',
    (difficulty) => {
      const min = generateAdditionQuestion(difficulty, () => 0)
      expect([min.firstOperand, min.secondOperand, min.correctAnswer]).toEqual([
        0, 0, 0,
      ])
      const max = generateAdditionQuestion(difficulty, largestSample)
      const bound = additiveMax[difficulty - 1]
      expect([max.firstOperand, max.secondOperand, max.correctAnswer]).toEqual([
        bound,
        bound,
        2 * bound,
      ])
    },
  )
  it.each(levels)(
    'subtraction level %s includes extremes without negative answers',
    (difficulty) => {
      const max = generateSubtractionQuestion(
        difficulty,
        samples(0, 1 - Number.EPSILON),
      )
      expect([max.firstOperand, max.secondOperand, max.correctAnswer]).toEqual([
        additiveMax[difficulty - 1],
        0,
        additiveMax[difficulty - 1],
      ])
      const equal = generateSubtractionQuestion(difficulty, largestSample)
      expect(equal.correctAnswer).toBe(0)
      const zero = generateSubtractionQuestion(difficulty, () => 0)
      expect([
        zero.firstOperand,
        zero.secondOperand,
        zero.correctAnswer,
      ]).toEqual([0, 0, 0])
    },
  )
  it.each(levels)(
    'multiplication level %s includes factor limits',
    (difficulty) => {
      const min = generateMultiplicationQuestion(difficulty, () => 0)
      expect([min.firstOperand, min.secondOperand, min.correctAnswer]).toEqual([
        difficulty === 4 ? 10 : 0,
        0,
        0,
      ])
      const max = generateMultiplicationQuestion(difficulty, largestSample)
      const a = firstFactorMax[difficulty - 1]
      const b = secondFactorMax[difficulty - 1]
      expect([max.firstOperand, max.secondOperand, max.correctAnswer]).toEqual([
        a,
        b,
        a * b,
      ])
    },
  )
  it.each(levels)(
    'division level %s includes divisor limits and whole-number zero answers',
    (difficulty) => {
      const min = generateDivisionQuestion(difficulty, () => 0)
      expect([min.firstOperand, min.secondOperand, min.correctAnswer]).toEqual([
        0, 1, 0,
      ])
      const max = generateDivisionQuestion(difficulty, largestSample)
      expect(max.secondOperand).toBe(divisorMax[difficulty - 1])
      expect(max.firstOperand).toBe(dividendMax[difficulty - 1])
      expect(max.firstOperand % max.secondOperand).toBe(0)
    },
  )
  it('can generate carrying, borrowing, and both specified multiplication forms', () => {
    expect(generateAdditionQuestion(3, samples(0.58, 0.67)).correctAnswer).toBe(
      125,
    )
    expect(
      generateSubtractionQuestion(3, samples(0.52, 0.27)).correctAnswer,
    ).toBe(25)
    expect(
      generateMultiplicationQuestion(3, samples(0.8, 0.07)).displayText,
    ).toBe('8 × 7 = ?')
    expect(
      generateMultiplicationQuestion(3, samples(0.8, 0.67)).displayText,
    ).toBe('8 × 67 = ?')
    expect(
      generateMultiplicationQuestion(4, samples(0, 0.07)).displayText,
    ).toBe('10 × 7 = ?')
    expect(
      generateMultiplicationQuestion(4, samples(0, 0.67)).displayText,
    ).toBe('10 × 67 = ?')
  })
  it('limits Intermediate quotients by the chosen divisor to keep dividends at most 144', () => {
    const question = generateDivisionQuestion(3, samples(0, 1 - Number.EPSILON))
    expect([
      question.firstOperand,
      question.secondOperand,
      question.correctAnswer,
    ]).toEqual([144, 1, 144])
  })
})

describe('unified generation', () => {
  const seen = new Set<string>()
  for (const operation of operationNames) {
    it.each(levels)(
      `${operation} level %s stays valid over 250 seeded questions`,
      (difficulty) => {
        const random = seededRandom(
          difficulty * 100 + operationNames.indexOf(operation),
        )
        for (let index = 0; index < 250; index++) {
          const question = generateQuestion(operation, difficulty, random)
          expect(question.operation).toBe(operation)
          expect(question.difficulty).toBe(difficulty)
          expect(question.source).toBe('regular')
          expect(question).not.toHaveProperty('choices')
          expect(question.displayText).toBe(
            `${question.firstOperand} ${symbols[operation]} ${question.secondOperand} = ?`,
          )
          expect(() => validateArithmeticQuestion(question, seen)).not.toThrow()
          expect(seen.has(question.id)).toBe(false)
          seen.add(question.id)
          const a = question.firstOperand
          const b = question.secondOperand
          expect(Number.isInteger(a) && Number.isInteger(b)).toBe(true)
          expect(a).toBeGreaterThanOrEqual(0)
          expect(b).toBeGreaterThanOrEqual(0)
          switch (operation) {
            case 'addition':
            case 'subtraction':
              expect(a).toBeLessThanOrEqual(additiveMax[difficulty - 1])
              expect(b).toBeLessThanOrEqual(additiveMax[difficulty - 1])
              expect(question.correctAnswer).toBe(
                operation === 'addition' ? a + b : a - b,
              )
              expect(question.correctAnswer).toBeGreaterThanOrEqual(0)
              break
            case 'multiplication':
              expect(a).toBeGreaterThanOrEqual(difficulty === 4 ? 10 : 0)
              expect(a).toBeLessThanOrEqual(firstFactorMax[difficulty - 1])
              expect(b).toBeLessThanOrEqual(secondFactorMax[difficulty - 1])
              expect(question.correctAnswer).toBe(a * b)
              break
            case 'division':
              expect(b).toBeGreaterThanOrEqual(1)
              expect(b).toBeLessThanOrEqual(divisorMax[difficulty - 1])
              expect(a).toBeLessThanOrEqual(dividendMax[difficulty - 1])
              expect(a % b).toBe(0)
              expect(question.correctAnswer).toBe(a / b)
              expect(Number.isInteger(question.correctAnswer)).toBe(true)
          }
        }
      },
    )
  }
  it('also works with the default random source', () => {
    for (const operation of operationNames) {
      for (const difficulty of levels)
        expect(() =>
          validateArithmeticQuestion(generateQuestion(operation, difficulty)),
        ).not.toThrow()
    }
  })
  it('selects every chosen operation at deterministic index boundaries', () => {
    const selected = Object.freeze([
      'addition',
      'subtraction',
      'multiplication',
      'division',
    ] as const)
    for (let index = 0; index < selected.length; index++) {
      const random = () => (index + 0.5) / selected.length
      expect(selectRandomOperation(selected, random)).toBe(selected[index])
      expect(generateQuestion(selected, 2, random).operation).toBe(
        selected[index],
      )
    }
    expect(selectRandomOperation(['division'], () => 0)).toBe('division')
    expect(
      selectRandomOperation(['addition', 'addition', 'division'], () => 0.5),
    ).toBe('division')
    expect(selected).toEqual(operationNames)
  })
  it('mixed practice uses only the selected operations over repeated questions', () => {
    const random = seededRandom(120)
    for (let index = 0; index < 500; index++) {
      expect(['subtraction', 'division']).toContain(
        generateQuestion(['subtraction', 'division'], 3, random).operation,
      )
    }
  })
  it.each(['power', '', null, undefined, {}, [], ['addition', 'bad']])(
    'rejects invalid operation input %j',
    (operation) => {
      expect(() => generateQuestion(operation as MathOperation, 1)).toThrow(
        TypeError,
      )
    },
  )
  it.each([0, 5, -1, 1.5, NaN, Infinity, '2', null, undefined])(
    'rejects difficulty %s in every public arithmetic generator',
    (difficulty) => {
      const invalid = difficulty as DifficultyLevel
      expect(() => generateQuestion('addition', invalid)).toThrow(RangeError)
      for (const generate of [
        generateAdditionQuestion,
        generateSubtractionQuestion,
        generateMultiplicationQuestion,
        generateDivisionQuestion,
      ])
        expect(() => generate(invalid)).toThrow(RangeError)
    },
  )
  it('rejects empty or invalid mixed selections', () => {
    expect(() => selectRandomOperation([])).toThrow(TypeError)
    expect(() =>
      selectRandomOperation(['bad'] as unknown as MathOperation[]),
    ).toThrow(TypeError)
    expect(() =>
      selectRandomOperation(null as unknown as MathOperation[]),
    ).toThrow(TypeError)
  })
  it('reports unexpected generation errors with their cause', () => {
    try {
      generateQuestion('addition', 1, () => NaN)
      throw new Error('Expected generation failure')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe(
        'Unable to generate a valid arithmetic question',
      )
      expect((error as Error).cause).toBeInstanceOf(RangeError)
    }
    vi.stubGlobal('crypto', undefined)
    expect(() => generateQuestion('division', 2)).toThrow('Unable to generate')
  })
})
