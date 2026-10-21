import type { ArithmeticQuestion, Question } from '../types/question'
import type { RandomSource } from '../utils/math'
import { shuffleArray } from '../utils/shuffle'
import { validateQuestion } from '../utils/validation'
import { generateDistractors } from './distractors'

/** Complete an arithmetic question without modifying its fields or source data. */
export function withAnswerChoices(
  question: ArithmeticQuestion,
  random: RandomSource = Math.random,
): Question {
  const distractors = generateDistractors(question, random)
  const completed: Question = {
    ...question,
    choices: shuffleArray([question.correctAnswer, ...distractors], random),
  }
  validateQuestion(completed)
  return completed
}
