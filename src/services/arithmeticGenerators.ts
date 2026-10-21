import type {
  ArithmeticQuestion,
  DifficultyLevel,
  MathOperation,
} from '../types/question'
import { createQuestionId } from '../utils/ids'
import { randomInteger } from '../utils/math'
import type { RandomSource } from '../utils/math'
import { getDifficultyRules, operationSymbols } from './questionRules'

function createQuestion(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  firstOperand: number,
  secondOperand: number,
  correctAnswer: number,
): ArithmeticQuestion {
  return {
    id: createQuestionId(),
    operation,
    difficulty,
    firstOperand,
    secondOperand,
    correctAnswer,
    displayText: `${firstOperand} ${operationSymbols[operation]} ${secondOperand} = ?`,
    source: 'regular',
  }
}

export function generateAdditionQuestion(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): ArithmeticQuestion {
  const { additiveMax } = getDifficultyRules(difficulty)
  const first = randomInteger(0, additiveMax, random)
  const second = randomInteger(0, additiveMax, random)
  return createQuestion('addition', difficulty, first, second, first + second)
}

export function generateSubtractionQuestion(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): ArithmeticQuestion {
  const { additiveMax } = getDifficultyRules(difficulty)
  const a = randomInteger(0, additiveMax, random)
  const b = randomInteger(0, additiveMax, random)
  const first = Math.max(a, b)
  const second = Math.min(a, b)
  return createQuestion(
    'subtraction',
    difficulty,
    first,
    second,
    first - second,
  )
}

export function generateMultiplicationQuestion(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): ArithmeticQuestion {
  const rules = getDifficultyRules(difficulty)
  const first = randomInteger(rules.factorMin, rules.firstFactorMax, random)
  const second = randomInteger(0, rules.secondFactorMax, random)
  return createQuestion(
    'multiplication',
    difficulty,
    first,
    second,
    first * second,
  )
}

export function generateDivisionQuestion(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): ArithmeticQuestion {
  const rules = getDifficultyRules(difficulty)
  const divisor = randomInteger(1, rules.divisorMax, random)
  const quotient = randomInteger(
    0,
    Math.min(rules.quotientMax, Math.floor(rules.dividendMax / divisor)),
    random,
  )
  return createQuestion(
    'division',
    difficulty,
    divisor * quotient,
    divisor,
    quotient,
  )
}
