import type {
  ArithmeticQuestion,
  DifficultyLevel,
  MathOperation,
  Question,
} from '../types/question'
import { randomInteger } from '../utils/math'
import type { RandomSource } from '../utils/math'
import { validateArithmeticQuestion } from '../utils/validation'
import {
  generateAdditionQuestion,
  generateSubtractionQuestion,
  generateMultiplicationQuestion,
  generateDivisionQuestion,
} from './arithmeticGenerators'
import { assertDifficulty, isMathOperation } from './questionRules'
import { withAnswerChoices } from './answerChoices'

const generators = {
  addition: generateAdditionQuestion,
  subtraction: generateSubtractionQuestion,
  multiplication: generateMultiplicationQuestion,
  division: generateDivisionQuestion,
} satisfies Record<
  MathOperation,
  (difficulty: DifficultyLevel, random?: RandomSource) => ArithmeticQuestion
>

/** Select uniformly among distinct supported operations; never mutate the input. */
export function selectRandomOperation(
  selected: readonly MathOperation[],
  random: RandomSource = Math.random,
): MathOperation {
  if (!Array.isArray(selected) || selected.length === 0)
    throw new TypeError('Select at least one operation')
  if (!selected.every(isMathOperation))
    throw new TypeError('Unsupported math operation in selection')
  const unique = [...new Set(selected)]
  return unique[randomInteger(0, unique.length - 1, random)]
}

/** Throws on invalid inputs or generation failures; no retries or UI behavior in Phase 4. */
export function generateQuestion(
  operation: MathOperation | readonly MathOperation[],
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): ArithmeticQuestion {
  assertDifficulty(difficulty)
  if (!Array.isArray(operation) && !isMathOperation(operation))
    throw new TypeError('Unsupported math operation')
  // Validate array contents before starting generation so caller errors remain explicit.
  if (
    Array.isArray(operation) &&
    (operation.length === 0 || !operation.every(isMathOperation))
  )
    throw new TypeError('Select one or more supported math operations')
  try {
    const selected = isMathOperation(operation)
      ? operation
      : selectRandomOperation(operation, random)
    const question = generators[selected](difficulty, random)
    validateArithmeticQuestion(question)
    return question
  } catch (cause) {
    throw new Error('Unable to generate a valid arithmetic question', { cause })
  }
}

/** Future practice sessions can request complete questions through this API. */
export function generateMultipleChoiceQuestion(
  operation: MathOperation | readonly MathOperation[],
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  const arithmetic = generateQuestion(operation, difficulty, random)
  try {
    return withAnswerChoices(arithmetic, random)
  } catch (cause) {
    throw new Error('Unable to generate a valid multiple-choice question', {
      cause,
    })
  }
}
