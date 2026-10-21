import type { ArithmeticQuestion } from '../types/question'
import { randomInteger } from '../utils/math'
import type { RandomSource } from '../utils/math'
import { validateArithmeticQuestion } from '../utils/validation'
import { getAnswerChoiceMax } from './questionRules'

export const MAX_DISTRACTOR_ATTEMPTS = 24

/** Candidate mistakes are intentionally allowed to repeat; the final set filters them. */
function mistakeCandidates(question: ArithmeticQuestion): number[] {
  const { firstOperand: a, secondOperand: b, correctAnswer: answer } = question
  const nearby = [answer - 1, answer + 1, answer - 2, answer + 2]
  switch (question.operation) {
    case 'addition':
      return [
        ...((a % 10) + (b % 10) >= 10 ? [answer - 10, answer + 10] : []),
        ...nearby,
      ]
    case 'subtraction':
      return [...(a % 10 < b % 10 ? [answer + 10, answer - 10] : []), ...nearby]
    case 'multiplication':
      return [answer - a, answer + a, answer - b, answer + b, a + b, ...nearby]
    case 'division':
      // Wrong neighboring divisors can produce related whole-number fact errors.
      return [a / (b + 1), ...(b > 1 ? [a / (b - 1)] : []), ...nearby]
  }
}

/** Three distinct incorrect answers; bounded even if the random source repeats forever. */
export function generateDistractors(
  question: ArithmeticQuestion,
  random: RandomSource = Math.random,
): number[] {
  validateArithmeticQuestion(question)
  const max = getAnswerChoiceMax(question)
  const candidates = mistakeCandidates(question)
  const result = new Set<number>()
  function add(candidate: number) {
    if (
      Number.isSafeInteger(candidate) &&
      candidate >= 0 &&
      candidate <= max &&
      candidate !== question.correctAnswer
    )
      result.add(candidate)
  }
  for (
    let attempt = 0;
    attempt < MAX_DISTRACTOR_ATTEMPTS && result.size < 3;
    attempt += 1
  ) {
    add(candidates[randomInteger(0, candidates.length - 1, random)])
  }
  // Every current answer domain has at least four values. The three nearest
  // distances therefore guarantee enough valid neighbors, including at zero/max.
  for (let distance = 1; distance <= 3 && result.size < 3; distance += 1) {
    add(question.correctAnswer - distance)
    if (result.size < 3) add(question.correctAnswer + distance)
  }
  if (result.size !== 3)
    throw new Error('Unable to generate three valid distractors')
  return [...result]
}
