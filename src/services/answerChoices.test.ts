import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  ArithmeticQuestion,
  DifficultyLevel,
  MathOperation,
} from '../types/question'
import {
  validateArithmeticQuestion,
  validateQuestion,
} from '../utils/validation'
import * as shuffle from '../utils/shuffle'
import { withAnswerChoices } from './answerChoices'
import { MAX_DISTRACTOR_ATTEMPTS } from './distractors'
import {
  generateQuestion,
  generateMultipleChoiceQuestion,
} from './questionGenerator'
import {
  generateAdditionQuestion,
  generateSubtractionQuestion,
  generateMultiplicationQuestion,
  generateDivisionQuestion,
} from './arithmeticGenerators'

const levels: DifficultyLevel[] = [1, 2, 3, 4]
const operations: MathOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
]
function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}
function fixture(
  operation: MathOperation,
  a: number,
  b: number,
  answer: number,
): ArithmeticQuestion {
  const symbols = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷',
  }
  return {
    id: 'example',
    operation,
    firstOperand: a,
    secondOperand: b,
    correctAnswer: answer,
    difficulty: 2,
    displayText: `${a} ${symbols[operation]} ${b} = ?`,
    source: 'regular',
  }
}
afterEach(() => vi.restoreAllMocks())

describe('completing arithmetic questions', () => {
  it('does not mutate the original question or overwrite source metadata', () => {
    const arithmetic = Object.freeze({
      ...generateQuestion('addition', 1),
      source: 'mistake-review' as const,
      mistakePatternId: 'pattern-1',
    })
    const completed = withAnswerChoices(arithmetic, () => 0)
    const { choices, ...rest } = completed
    expect(rest).toEqual(arithmetic)
    expect(completed).not.toBe(arithmetic)
    expect(arithmetic).not.toHaveProperty('choices')
    expect(choices).toHaveLength(4)
  })
  it('uses the existing shuffle utility and allows every correct-answer position', () => {
    const spy = vi.spyOn(shuffle, 'shuffleArray')
    const arithmetic = fixture('multiplication', 8, 7, 56)
    for (const target of [0, 1, 2, 3]) {
      // Repeated candidate draws reach the bounded fallback.
      // Then choose the Fisher–Yates swap index that moves the answer to target.
      let calls = 0
      const swaps = [3, 2, 1].map((index) =>
        index === target ? 0 : 1 - Number.EPSILON,
      )
      const random = () =>
        calls++ < MAX_DISTRACTOR_ATTEMPTS
          ? 0
          : swaps[calls - MAX_DISTRACTOR_ATTEMPTS - 1]
      const completed = withAnswerChoices(arithmetic, random)
      expect(completed.choices.indexOf(arithmetic.correctAnswer)).toBe(target)
      expect(() => validateQuestion(completed)).not.toThrow()
    }
    expect(spy).toHaveBeenCalledTimes(4)
  })
  it.each([
    ['addition', 7, 8, 15, [5, 14, 16, 15]],
    ['subtraction', 15, 7, 8, [18, 7, 9, 8]],
    ['multiplication', 8, 7, 56, [48, 55, 57, 56]],
    ['division', 56, 7, 8, [7, 9, 6, 8]],
  ] as const)(
    'produces a complete example for %s',
    (operation, a, b, answer, choices) => {
      const completed = withAnswerChoices(
        fixture(operation, a, b, answer),
        () => 0,
      )
      expect(completed.choices).toEqual(choices)
      expect(() => validateQuestion(completed)).not.toThrow()
    },
  )
  it('can complete every existing operation-specific generator without changing its API', () => {
    for (const generate of [
      generateAdditionQuestion,
      generateSubtractionQuestion,
      generateMultiplicationQuestion,
      generateDivisionQuestion,
    ]) {
      for (const level of levels) {
        const arithmetic = generate(level)
        expect(arithmetic).not.toHaveProperty('choices')
        expect(() =>
          validateQuestion(withAnswerChoices(arithmetic)),
        ).not.toThrow()
      }
    }
  })
  it('rejects broken arithmetic and invalid shuffling', () => {
    expect(() =>
      withAnswerChoices({ ...fixture('addition', 1, 2, 3), correctAnswer: 4 }),
    ).toThrow()
    vi.spyOn(shuffle, 'shuffleArray').mockReturnValue([1, 1, 2, 3])
    expect(() => withAnswerChoices(fixture('addition', 1, 2, 3))).toThrow(
      'unique',
    )
    expect(() => generateMultipleChoiceQuestion('addition', 1)).toThrow(
      'Unable to generate a valid multiple-choice question',
    )
  })
  it('reports choice-generation failures with their underlying cause', () => {
    let calls = 0
    const random = () => (calls++ < 2 ? 0 : NaN)
    try {
      generateMultipleChoiceQuestion('addition', 1, random)
      throw new Error('Expected generation to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe(
        'Unable to generate a valid multiple-choice question',
      )
      expect((error as Error).cause).toBeInstanceOf(RangeError)
    }
  })
})

describe('complete-question generation', () => {
  for (const operation of operations) {
    it.each(levels)(
      `${operation} level %s stays valid across 250 seeded questions`,
      (difficulty) => {
        const random = seededRandom(
          2026 + difficulty * 100 + operations.indexOf(operation),
        )
        const ids = new Set<string>()
        for (let count = 0; count < 250; count++) {
          const question = generateMultipleChoiceQuestion(
            operation,
            difficulty,
            random,
          )
          expect(() => validateArithmeticQuestion(question)).not.toThrow()
          expect(() => validateQuestion(question, ids)).not.toThrow()
          ids.add(question.id)
          expect(question.operation).toBe(operation)
          expect(question.difficulty).toBe(difficulty)
          expect(question.choices).toHaveLength(4)
          expect(new Set(question.choices).size).toBe(4)
          expect(
            question.choices.filter(
              (choice) => choice === question.correctAnswer,
            ),
          ).toHaveLength(1)
          const max =
            operation === 'addition'
              ? [20, 100, 200, 2000][difficulty - 1]
              : operation === 'subtraction'
                ? [10, 50, 100, 1000][difficulty - 1]
                : operation === 'multiplication'
                  ? [25, 100, 891, 9801][difficulty - 1]
                  : Math.min(
                      [5, 10, 144, 99][difficulty - 1],
                      Math.floor(
                        [25, 100, 144, 9801][difficulty - 1] /
                          question.secondOperand,
                      ),
                    )
          for (const choice of question.choices) {
            expect(Number.isSafeInteger(choice)).toBe(true)
            expect(choice).toBeGreaterThanOrEqual(0)
            expect(choice).toBeLessThanOrEqual(max)
          }
        }
        expect(ids.size).toBe(250)
      },
    )
  }
  it('supports mixed selections and default randomness', () => {
    for (let count = 0; count < 200; count++) {
      const question = generateMultipleChoiceQuestion(
        ['subtraction', 'division'],
        2,
      )
      expect(['subtraction', 'division']).toContain(question.operation)
      expect(() => validateQuestion(question)).not.toThrow()
    }
  })
  it('rejects invalid inputs while keeping arithmetic-only behavior unchanged', () => {
    expect(() =>
      generateMultipleChoiceQuestion('power' as MathOperation, 1),
    ).toThrow(TypeError)
    expect(() =>
      generateMultipleChoiceQuestion('addition', 5 as DifficultyLevel),
    ).toThrow(RangeError)
    expect(() => generateMultipleChoiceQuestion([], 1)).toThrow(TypeError)
    expect(generateQuestion('addition', 1)).not.toHaveProperty('choices')
  })
})
