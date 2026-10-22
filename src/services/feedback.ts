import { randomInteger } from '../utils/math'
import type { RandomSource } from '../utils/math'
const encouragement = [
  'Nice work! Keep exploring.',
  'Great practice! Ready for another?',
  'You’re building your math skills!',
] as const
const support = [
  'Keep practicing! Every try helps you learn.',
  'Take your time. You can learn this!',
  'A tricky question is a chance to grow.',
] as const
export function practiceFeedback(
  correct: boolean,
  random: RandomSource = Math.random,
) {
  const messages = correct ? encouragement : support
  try {
    return messages[randomInteger(0, messages.length - 1, random)]
  } catch {
    return messages[0]
  }
}
