import { describe, expect, it } from 'vitest'
import type {
  ArithmeticQuestion,
  DifficultyLevel,
  MathOperation,
} from '../types/question'
import { validateArithmeticQuestion } from './validation'

const symbols = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
}
function fixture(
  operation: MathOperation = 'addition',
  difficulty: DifficultyLevel = 1,
  a = 7,
  b = 8,
  answer = 15,
): ArithmeticQuestion {
  return {
    id: 'fixture-question',
    operation,
    difficulty,
    firstOperand: a,
    secondOperand: b,
    correctAnswer: answer,
    displayText: `${a} ${symbols[operation]} ${b} = ?`,
    source: 'regular',
  }
}

describe('arithmetic question validation', () => {
  it('accepts valid arithmetic data without requiring answer choices', () => {
    expect(() => validateArithmeticQuestion(fixture())).not.toThrow()
    expect(() =>
      validateArithmeticQuestion(fixture('subtraction', 2, 30, 17, 13)),
    ).not.toThrow()
    expect(() =>
      validateArithmeticQuestion(fixture('multiplication', 3, 8, 17, 136)),
    ).not.toThrow()
    expect(() =>
      validateArithmeticQuestion(fixture('division', 3, 144, 12, 12)),
    ).not.toThrow()
    expect(() =>
      validateArithmeticQuestion({
        ...fixture(),
        source: 'mistake-review',
        mistakePatternId: 'pattern-1',
      }),
    ).not.toThrow()
  })
  it.each([null, undefined, [], 'question', 2])(
    'rejects malformed question %j',
    (value) => {
      expect(() => validateArithmeticQuestion(value)).toThrow()
    },
  )
  it.each(['', '  ', null, 5])('rejects malformed IDs %j', (id) => {
    expect(() => validateArithmeticQuestion({ ...fixture(), id })).toThrow(
      TypeError,
    )
  })
  it('detects IDs already present in a supplied history without mutating it', () => {
    const existing = new Set(['fixture-question'])
    expect(() => validateArithmeticQuestion(fixture(), existing)).toThrow(
      'already been used',
    )
    expect(existing.size).toBe(1)
    expect(() =>
      validateArithmeticQuestion(
        { ...fixture(), id: 'new-question' },
        existing,
      ),
    ).not.toThrow()
  })
  it.each(['power', 'toString', '__proto__', null])(
    'rejects unsupported operations %j',
    (operation) => {
      expect(() =>
        validateArithmeticQuestion({ ...fixture(), operation }),
      ).toThrow(TypeError)
    },
  )
  it.each([0, 5, 1.5, '1', NaN])(
    'rejects invalid difficulty %s',
    (difficulty) => {
      expect(() =>
        validateArithmeticQuestion({ ...fixture(), difficulty }),
      ).toThrow(RangeError)
    },
  )
  for (const field of ['firstOperand', 'secondOperand', 'correctAnswer']) {
    it.each([NaN, Infinity, 2.5, '7', null, Number.MAX_SAFE_INTEGER + 1])(
      `rejects noninteger/unsafe ${field} %s`,
      (value) => {
        expect(() =>
          validateArithmeticQuestion({ ...fixture(), [field]: value }),
        ).toThrow(TypeError)
      },
    )
  }
  it('rejects incorrect answers, display text, source, and pattern metadata', () => {
    expect(() =>
      validateArithmeticQuestion({ ...fixture(), correctAnswer: 14 }),
    ).toThrow('mathematically incorrect')
    expect(() =>
      validateArithmeticQuestion({ ...fixture(), displayText: '7 + 9 = ?' }),
    ).toThrow('text does not match')
    expect(() =>
      validateArithmeticQuestion({ ...fixture(), source: 'unknown' }),
    ).toThrow('source')
    expect(() =>
      validateArithmeticQuestion({ ...fixture(), mistakePatternId: '' }),
    ).toThrow('pattern ID')
  })
  it.each([1, 2, 3, 4] as const)(
    'rejects additive operands outside level %s',
    (difficulty) => {
      const outOfRange = [11, 51, 101, 1001][difficulty - 1]
      expect(() =>
        validateArithmeticQuestion(
          fixture('addition', difficulty, outOfRange, 0, outOfRange),
        ),
      ).toThrow(RangeError)
      expect(() =>
        validateArithmeticQuestion(
          fixture('subtraction', difficulty, outOfRange, 0, outOfRange),
        ),
      ).toThrow(RangeError)
      expect(() =>
        validateArithmeticQuestion(
          fixture('subtraction', difficulty, 0, 1, -1),
        ),
      ).toThrow('Negative subtraction')
      expect(() =>
        validateArithmeticQuestion(fixture('addition', difficulty, -1, 1, 0)),
      ).toThrow('Negative operands')
    },
  )
  it.each([
    [1, 6, 2],
    [1, 2, 6],
    [2, 11, 2],
    [2, 2, 11],
    [3, 10, 2],
    [3, 2, 100],
    [4, 9, 2],
    [4, 100, 2],
    [4, 10, 100],
  ])('rejects factors outside level %s: %s × %s', (difficulty, a, b) => {
    expect(() =>
      validateArithmeticQuestion(
        fixture('multiplication', difficulty as DifficultyLevel, a, b, a * b),
      ),
    ).toThrow(RangeError)
  })
  it.each([1, 2, 3, 4] as const)(
    'rejects zero divisors and fractional results at level %s',
    (difficulty) => {
      expect(() =>
        validateArithmeticQuestion(fixture('division', difficulty, 0, 0, 0)),
      ).toThrow(RangeError)
      expect(() =>
        validateArithmeticQuestion(fixture('division', difficulty, 5, 2, 2)),
      ).toThrow('whole-number')
    },
  )
  it.each([
    [1, 6, 6, 1],
    [1, 6, 1, 6],
    [1, 26, 2, 13],
    [2, 11, 11, 1],
    [2, 11, 1, 11],
    [2, 102, 2, 51],
    [3, 13, 13, 1],
    [3, 145, 1, 145],
    [4, 100, 100, 1],
    [4, 100, 1, 100],
    [4, 9802, 2, 4901],
  ])(
    'rejects division outside level %s: %s ÷ %s',
    (difficulty, a, b, answer) => {
      expect(() =>
        validateArithmeticQuestion(
          fixture('division', difficulty as DifficultyLevel, a, b, answer),
        ),
      ).toThrow(RangeError)
    },
  )
})
