import { describe, expect, it } from 'vitest'
import { practiceFeedback } from './feedback'

describe('quiet practice feedback', () => {
  it('selects positive and supportive messages from bounded choices', () => {
    expect(practiceFeedback(true, () => 0)).toBe('Nice work! Keep exploring.')
    expect(practiceFeedback(false, () => 0)).toBe(
      'Keep practicing! Every try helps you learn.',
    )
    expect(practiceFeedback(true, () => 0.999)).not.toBe(
      practiceFeedback(true, () => 0),
    )
    expect(practiceFeedback(false, () => 0.999)).toContain('chance to grow')
    expect(practiceFeedback(false, () => NaN)).toBe(
      'Keep practicing! Every try helps you learn.',
    )
  })
})
