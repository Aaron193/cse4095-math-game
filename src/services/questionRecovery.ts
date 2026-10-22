import type { PracticeSessionState } from '../types/session'
import type { ReviewHistory } from './reviewService'
import { eligibleReviewPatterns } from './reviewService'
import { similarCandidates } from './similarQuestionGenerator'
import { generateQuestion } from './questionGenerator'
import { withAnswerChoices } from './answerChoices'
import { createQuestionId } from '../utils/ids'
import { validateQuestion } from '../utils/validation'

/** A finite, deterministic backup path independent of the failing randomized wrapper. */
export function generateFallbackQuestion(
  state: PracticeSessionState,
  history?: ReviewHistory,
) {
  const previous = state.attempts.at(-1)
  const ids = new Set(state.attempts.map((attempt) => attempt.questionId))
  const sameAsPrevious = (q: {
    operation: string
    firstOperand: number
    secondOperand: number
  }) =>
    previous &&
    q.operation === previous.operation &&
    q.firstOperand === previous.firstOperand &&
    q.secondOperand === previous.secondOperand
  if (state.session.mode === 'mistake-review') {
    if (!history) throw new Error('Review history is required')
    const candidates = eligibleReviewPatterns(
      state.session,
      history,
      state.attempts,
    )
      .flatMap(similarCandidates)
      .map((item) => item.question)
      .filter((q) => state.session.operations.includes(q.operation))
    const candidate =
      candidates.find((q) => !sameAsPrevious(q)) ?? candidates[0]
    if (!candidate) throw new Error('No safe related fallback is available')
    const question = withAnswerChoices(
      { ...candidate, id: createQuestionId() },
      () => 0.5,
    )
    validateQuestion(question, ids)
    return question
  }
  for (const sample of [0, 0.5, 0.999]) {
    const arithmetic = generateQuestion(
      state.session.operations[0],
      state.session.difficulty,
      () => sample,
    )
    if (sameAsPrevious(arithmetic) && sample !== 0.999) continue
    const question = withAnswerChoices(arithmetic, () => 0.5)
    validateQuestion(question, ids)
    return question
  }
  throw new Error('No safe fallback is available')
}
