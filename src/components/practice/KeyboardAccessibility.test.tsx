import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import QuestionCard from './QuestionCard'
import type { Question } from '../../types/question'
const question: Question = {
  id: 'keyboard',
  operation: 'multiplication',
  difficulty: 2,
  firstOperand: 8,
  secondOperand: 7,
  correctAnswer: 56,
  choices: [48, 54, 56, 64],
  displayText: '8 × 7 = ?',
  source: 'regular',
}
function card() {
  const onResult = vi.fn()
  render(
    <>
      <input aria-label="Other input" />
      <textarea aria-label="Notes" />
      <select aria-label="Other choice">
        <option>One</option>
      </select>
      <div
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Editable"
      />
      <QuestionCard
        question={question}
        questionNumber={1}
        totalQuestions={5}
        onResult={onResult}
      />
    </>,
  )
  return onResult
}
describe('accessible card interaction', () => {
  it('selects and changes with number shortcuts, then flips and reports using only keyboard', async () => {
    const user = userEvent.setup(),
      result = card()
    expect(
      screen.getByRole('heading', { name: '8 multiplied by 7 equals what?' }),
    ).toBeInTheDocument()
    await user.keyboard('1')
    expect(screen.getByRole('button', { name: 'Answer 48' })).toHaveFocus()
    await user.keyboard('3')
    expect(screen.getByRole('button', { name: 'Answer 56' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Answer 56' })).toHaveAttribute(
      'aria-keyshortcuts',
      '3',
    )
    await user.tab()
    await user.tab()
    await user.keyboard('{Enter}')
    expect(
      screen.getByRole('heading', { name: 'Answer revealed' }),
    ).toHaveFocus()
    expect(
      screen.queryByRole('group', { name: 'Answer choices' }),
    ).not.toBeInTheDocument()
    await user.keyboard('1')
    expect(
      screen.getByText('Your answer:').querySelector('strong'),
    ).toHaveTextContent('56')
    await user.tab()
    await user.keyboard(' ')
    expect(result).toHaveBeenCalledExactlyOnceWith(true, 56)
  })
  it.each(['Other input', 'Notes', 'Other choice', 'Editable'])(
    'ignores shortcuts while interacting with %s',
    (label) => {
      card()
      const input = screen.getByLabelText(label)
      input.focus()
      fireEvent.keyDown(input, { key: '3' })
      expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    },
  )
  it('ignores modifier keys and repeated keydowns and preserves ordinary mouse controls', () => {
    card()
    fireEvent.keyDown(window, { key: '2', ctrlKey: true })
    fireEvent.keyDown(window, { key: '2', repeat: true })
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Answer 54' }))
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeEnabled()
  })
})
