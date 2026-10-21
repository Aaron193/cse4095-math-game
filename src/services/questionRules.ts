import type {
  ArithmeticQuestion,
  DifficultyLevel,
  MathOperation,
} from '../types/question'

export const operations: readonly MathOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
]
export const operationSymbols: Record<MathOperation, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
}

export function isMathOperation(value: unknown): value is MathOperation {
  return operations.some((operation) => operation === value)
}

export function assertDifficulty(
  value: unknown,
): asserts value is DifficultyLevel {
  if (value !== 1 && value !== 2 && value !== 3 && value !== 4) {
    throw new RangeError('Difficulty must be 1, 2, 3, or 4')
  }
}

// Section 7 leaves some division limits open; these initial limits are documented in README.
const difficultyRules = {
  1: {
    additiveMax: 10,
    factorMin: 0,
    firstFactorMax: 5,
    secondFactorMax: 5,
    divisorMax: 5,
    quotientMax: 5,
    dividendMax: 25,
  },
  2: {
    additiveMax: 50,
    factorMin: 0,
    firstFactorMax: 10,
    secondFactorMax: 10,
    divisorMax: 10,
    quotientMax: 10,
    dividendMax: 100,
  },
  3: {
    additiveMax: 100,
    factorMin: 0,
    firstFactorMax: 9,
    secondFactorMax: 99,
    divisorMax: 12,
    quotientMax: 144,
    dividendMax: 144,
  },
  4: {
    additiveMax: 1000,
    factorMin: 10,
    firstFactorMax: 99,
    secondFactorMax: 99,
    divisorMax: 99,
    quotientMax: 99,
    dividendMax: 9801,
  },
} as const

export function getDifficultyRules(difficulty: DifficultyLevel) {
  assertDifficulty(difficulty)
  return difficultyRules[difficulty]
}

/** Inclusive answer-choice ceiling, derived from the existing arithmetic limits. */
export function getAnswerChoiceMax(question: ArithmeticQuestion): number {
  const rules = getDifficultyRules(question.difficulty)
  switch (question.operation) {
    case 'addition':
      return 2 * rules.additiveMax
    case 'subtraction':
      return rules.additiveMax
    case 'multiplication':
      return rules.firstFactorMax * rules.secondFactorMax
    case 'division':
      return Math.min(
        rules.quotientMax,
        Math.floor(rules.dividendMax / question.secondOperand),
      )
  }
}
