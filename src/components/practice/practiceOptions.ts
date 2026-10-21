import type { DifficultyLevel, MathOperation } from '../../types/question'
import type { SessionLength } from '../../types/session'

export const operationOptions = [
  { value: 'addition', label: 'Addition', symbol: '+' },
  { value: 'subtraction', label: 'Subtraction', symbol: '−' },
  { value: 'multiplication', label: 'Multiplication', symbol: '×' },
  { value: 'division', label: 'Division', symbol: '÷' },
] as const satisfies readonly {
  value: MathOperation
  label: string
  symbol: string
}[]

export const difficultyOptions = [
  {
    value: 1,
    label: 'Beginner',
    description:
      'Start small! Add and subtract 0–10, multiply 0–5, and divide by 1–5.',
  },
  {
    value: 2,
    label: 'Easy',
    description:
      'Try bigger numbers! Add and subtract 0–50, multiply 0–10, and divide by 1–10.',
  },
  {
    value: 3,
    label: 'Intermediate',
    description:
      'Take a step up! Add and subtract 0–100, multiply one-digit by one- or two-digit numbers, and divide numbers up to 144 by 1–12.',
  },
  {
    value: 4,
    label: 'Advanced',
    description:
      'Ready for a challenge? Add and subtract up to 1,000, multiply two-digit by one- or two-digit numbers, and divide larger numbers by one- or two-digit numbers.',
  },
] as const satisfies readonly {
  value: DifficultyLevel
  label: string
  description: string
}[]

export const sessionLengthOptions = [
  { value: 5, label: '5 questions' },
  { value: 10, label: '10 questions' },
  { value: 20, label: '20 questions' },
  { value: 'continuous', label: 'Continuous practice' },
] as const satisfies readonly { value: SessionLength; label: string }[]
