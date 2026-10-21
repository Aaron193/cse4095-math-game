import type { MistakePattern } from '../types/mistake'
import type {
  ArithmeticQuestion,
  MathOperation,
  Question,
} from '../types/question'
import { createQuestionId } from '../utils/ids'
import { randomInteger } from '../utils/math'
import type { RandomSource } from '../utils/math'
import { validateArithmeticQuestion } from '../utils/validation'
import { withAnswerChoices } from './answerChoices'
import { validateMistakePattern } from './mistakeService'
import {
  isMathOperation,
  operationSymbols,
  operations as allOperations,
} from './questionRules'

export type SimilarityStrategy = 'nearby' | 'reversed' | 'fact-family'
type Expression = Pick<
  ArithmeticQuestion,
  'operation' | 'firstOperand' | 'secondOperand'
>
interface SimilarCandidate {
  question: ArithmeticQuestion
  strategy: SimilarityStrategy
}
const expressionKey = (q: Expression) =>
  `${q.operation}:${q.firstOperand}:${q.secondOperand}`

/** A bounded candidate set, filtered by the same validator as regular questions. */
export function similarCandidates(pattern: MistakePattern): SimilarCandidate[] {
  validateMistakePattern(pattern)
  const {
    firstOperand: a,
    secondOperand: b,
    correctAnswer: answer,
    operation,
  } = pattern
  const seen = new Set([expressionKey(pattern)])
  const candidates: SimilarCandidate[] = []
  function add(
    op: MathOperation,
    first: number,
    second: number,
    strategy: SimilarityStrategy,
  ) {
    const question: ArithmeticQuestion = {
      id: 'candidate',
      operation: op,
      difficulty: pattern.difficulty,
      firstOperand: first,
      secondOperand: second,
      correctAnswer:
        op === 'addition'
          ? first + second
          : op === 'subtraction'
            ? first - second
            : op === 'multiplication'
              ? first * second
              : first / second,
      displayText: `${first} ${operationSymbols[op]} ${second} = ?`,
      source: 'mistake-review',
      mistakePatternId: pattern.id,
    }
    if (seen.has(expressionKey(question))) return
    try {
      validateArithmeticQuestion(question)
    } catch {
      return
    }
    seen.add(expressionKey(question))
    candidates.push({ question, strategy })
  }
  if (operation === 'addition' || operation === 'multiplication')
    add(operation, b, a, 'reversed')
  switch (operation) {
    case 'addition':
      add('subtraction', answer, a, 'fact-family')
      add('subtraction', answer, b, 'fact-family')
      break
    case 'subtraction':
      add('addition', b, answer, 'fact-family')
      add('addition', answer, b, 'fact-family')
      break
    case 'multiplication':
      if (b !== 0) add('division', answer, b, 'fact-family')
      if (a !== 0) add('division', answer, a, 'fact-family')
      break
    case 'division':
      add('multiplication', b, answer, 'fact-family')
      add('multiplication', answer, b, 'fact-family')
      break
  }
  for (const delta of [-1, 1, -2, 2]) {
    if (operation === 'division') {
      // Change quotient or divisor, then reconstruct a divisible dividend.
      add(operation, b * (answer + delta), b, 'nearby')
      add(operation, (b + delta) * answer, b + delta, 'nearby')
    } else {
      add(operation, a + delta, b, 'nearby')
      add(operation, a, b + delta, 'nearby')
    }
  }
  return candidates
}

export function generateSimilarQuestion(
  pattern: MistakePattern,
  options: {
    random?: RandomSource
    operations?: readonly MathOperation[]
    recent?: readonly Expression[]
  } = {},
): Question {
  const {
    random = Math.random,
    operations = allOperations,
    recent = [],
  } = options
  if (operations.length === 0 || !operations.every(isMathOperation))
    throw new TypeError('Select supported review operations')
  const allowed = similarCandidates(pattern).filter(({ question }) =>
    operations.includes(question.operation),
  )
  if (allowed.length === 0)
    throw new Error('No related questions fit this configuration')
  const used = new Set(recent.map(expressionKey))
  let candidates = allowed.filter(
    ({ question }) => !used.has(expressionKey(question)),
  )
  if (candidates.length === 0) {
    const previous = recent.at(-1)
    candidates = allowed.filter(
      ({ question }) =>
        !previous || expressionKey(question) !== expressionKey(previous),
    )
    if (candidates.length === 0) candidates = allowed
  }
  // Choose a strategy first so its probability does not depend on candidate count.
  const strategies = [
    ...new Set(candidates.map((candidate) => candidate.strategy)),
  ]
  const strategy = strategies[randomInteger(0, strategies.length - 1, random)]
  const group = candidates.filter(
    (candidate) => candidate.strategy === strategy,
  )
  const selected = group[randomInteger(0, group.length - 1, random)].question
  return withAnswerChoices({ ...selected, id: createQuestionId() }, random)
}
