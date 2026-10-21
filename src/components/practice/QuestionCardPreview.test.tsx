import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PracticeConfiguration } from '../../types/session'
import * as generator from '../../services/questionGenerator'
import QuestionCardPreview from './QuestionCardPreview'

const configuration: PracticeConfiguration = {
  operations: ['addition'],
  difficulty: 1,
  sessionLength: 5,
}
afterEach(() => vi.restoreAllMocks())

describe('single-question preview', () => {
  it('uses the existing generator once and retains the same question across interactions', async () => {
    const user = userEvent.setup()
    const generate = vi.spyOn(generator, 'generateMultipleChoiceQuestion')
    render(<QuestionCardPreview configuration={configuration} />)
    expect(generate).toHaveBeenCalledExactlyOnceWith(
      configuration.operations,
      configuration.difficulty,
    )
    const questionText = document.querySelector(
      '.card-front .math-question',
    )?.textContent
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: /^Answer / })[0])
    await user.click(
      screen.getByRole('checkbox', { name: 'Show card animation' }),
    )
    expect(document.querySelector('.question-card')).toHaveAttribute(
      'data-animation',
      'off',
    )
    expect(
      document.querySelector('.card-front .math-question')?.textContent,
    ).toBe(questionText)
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
    expect(screen.getByText('Thanks for trying this card!')).toBeInTheDocument()
    expect(generate).toHaveBeenCalledTimes(1)
    expect(
      screen.queryByRole('button', { name: /Next/ }),
    ).not.toBeInTheDocument()
  })

  it('does not write practice data when a preview callback is triggered', async () => {
    const user = userEvent.setup()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    render(<QuestionCardPreview configuration={configuration} />)
    await user.click(screen.getAllByRole('button', { name: /^Answer / })[0])
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    expect(setItem).not.toHaveBeenCalled()
  })

  it('keeps the preview usable when question generation fails', () => {
    vi.spyOn(generator, 'generateMultipleChoiceQuestion').mockImplementation(
      () => {
        throw new Error('generation failed')
      },
    )
    render(<QuestionCardPreview configuration={configuration} />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please go back to setup and try again.',
    )
    expect(
      screen.queryByRole('button', { name: 'Flip Card' }),
    ).not.toBeInTheDocument()
  })
})
