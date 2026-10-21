import type { ArithmeticQuestion, Question } from '../types/question'
import {
  assertDifficulty,
  getDifficultyRules,
  getAnswerChoiceMax,
  isMathOperation,
  operationSymbols,
} from '../services/questionRules'

/** Arithmetic-only validation, also used before adding multiple-choice answers. */
export function validateArithmeticQuestion(
  value: unknown,
  existingIds?: ReadonlySet<string>,
): asserts value is ArithmeticQuestion {
  if (typeof value !== 'object' || value === null)
    throw new TypeError('Question must be an object')
  const question = value as Record<string, unknown>
  const {
    id,
    operation,
    difficulty,
    firstOperand,
    secondOperand,
    correctAnswer,
  } = question
  if (typeof id !== 'string' || id.trim().length === 0)
    throw new TypeError('Question ID must be a nonempty string')
  if (existingIds?.has(id)) throw new Error('Question ID has already been used')
  if (!isMathOperation(operation))
    throw new TypeError('Unsupported math operation')
  assertDifficulty(difficulty)
  if (
    typeof firstOperand !== 'number' ||
    typeof secondOperand !== 'number' ||
    typeof correctAnswer !== 'number' ||
    !Number.isSafeInteger(firstOperand) ||
    !Number.isSafeInteger(secondOperand) ||
    !Number.isSafeInteger(correctAnswer)
  ) {
    throw new TypeError('Operands and answer must be safe integers')
  }
  if (firstOperand < 0 || secondOperand < 0)
    throw new RangeError('Negative operands are not enabled')
  if (question.source !== 'regular' && question.source !== 'mistake-review')
    throw new TypeError('Unsupported question source')
  if (
    question.mistakePatternId !== undefined &&
    (typeof question.mistakePatternId !== 'string' ||
      question.mistakePatternId.trim().length === 0)
  )
    throw new TypeError('Mistake pattern ID must be a nonempty string')
  if (
    question.displayText !==
    `${firstOperand} ${operationSymbols[operation]} ${secondOperand} = ?`
  )
    throw new Error('Question text does not match its operands and operation')
  const rules = getDifficultyRules(difficulty)
  let expected: number
  switch (operation) {
    case 'addition':
    case 'subtraction':
      if (firstOperand > rules.additiveMax || secondOperand > rules.additiveMax)
        throw new RangeError('Operands exceed the difficulty range')
      expected =
        operation === 'addition'
          ? firstOperand + secondOperand
          : firstOperand - secondOperand
      if (expected < 0)
        throw new RangeError('Negative subtraction answers are not enabled')
      break
    case 'multiplication':
      if (
        firstOperand < rules.factorMin ||
        firstOperand > rules.firstFactorMax ||
        secondOperand > rules.secondFactorMax
      )
        throw new RangeError('Factors do not match the difficulty')
      expected = firstOperand * secondOperand
      break
    case 'division':
      if (
        secondOperand === 0 ||
        secondOperand > rules.divisorMax ||
        firstOperand > rules.dividendMax
      )
        throw new RangeError('Division operands do not match the difficulty')
      expected = firstOperand / secondOperand
      if (!Number.isInteger(expected) || expected > rules.quotientMax)
        throw new RangeError(
          'Division must have a whole-number answer within the difficulty range',
        )
      break
  }
  if (correctAnswer !== expected)
    throw new Error('Question answer is mathematically incorrect')
}

/** Validate the complete multiple-choice question, including all arithmetic rules. */
export function validateQuestion(
  value: unknown,
  existingIds?: ReadonlySet<string>,
): asserts value is Question {
  validateArithmeticQuestion(value, existingIds)
  const choices = (value as Partial<Question>).choices
  if (!Array.isArray(choices) || choices.length !== 4)
    throw new TypeError('Question must have exactly four answer choices')
  const max = getAnswerChoiceMax(value)
  // for...of visits sparse array holes too, so missing choices cannot bypass validation.
  for (const choice of choices) {
    if (
      typeof choice !== 'number' ||
      !Number.isSafeInteger(choice) ||
      choice < 0 ||
      choice > max
    )
      throw new RangeError(
        'Answer choices must be nonnegative whole numbers within the difficulty range',
      )
  }
  if (new Set(choices).size !== 4)
    throw new Error('Answer choices must be unique')
  if (choices.filter((choice) => choice === value.correctAnswer).length !== 1)
    throw new Error('Correct answer must appear exactly once')
}
