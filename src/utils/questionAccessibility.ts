import type { ArithmeticQuestion } from '../types/question'
const spokenOperations = {
  addition: 'plus',
  subtraction: 'minus',
  multiplication: 'multiplied by',
  division: 'divided by',
} as const
export function spokenQuestion(question: ArithmeticQuestion) {
  return `${question.firstOperand} ${spokenOperations[question.operation]} ${question.secondOperand} equals what?`
}
