import type { ComponentProps } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Question } from '../../types/question'
import QuestionCard from './QuestionCard'

const question: Question = {
  id: 'card-1',
  operation: 'multiplication',
  firstOperand: 8,
  secondOperand: 7,
  correctAnswer: 56,
  displayText: '8 × 7 = ?',
  difficulty: 2,
  source: 'regular',
  choices: [48, 56, 54, 64],
}
function renderCard(
  overrides: Partial<ComponentProps<typeof QuestionCard>> = {},
) {
  const onResult = vi.fn()
  return {
    onResult,
    ...render(
      <QuestionCard
        question={question}
        questionNumber={3}
        totalQuestions={10}
        onResult={onResult}
        {...overrides}
      />,
    ),
  }
}

describe('question card', () => {
  it('displays the question, four answers, progress, and disabled flip button', () => {
    renderCard()
    expect(
      screen.getByRole('heading', { name: '8 × 7 = ?' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Question 3 of 10')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Answer / })).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Flip Card' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(
      screen.queryByRole('button', { name: 'I Got It Right' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Answer revealed' }),
    ).not.toBeInTheDocument()
    expect(document.querySelector('.card-back')).toHaveAttribute('inert')
  })

  it('highlights the selection, allows changes, and does not report before flipping', async () => {
    const user = userEvent.setup()
    const { onResult } = renderCard()
    const first = screen.getByRole('button', { name: 'Answer 48' })
    const second = screen.getByRole('button', { name: 'Answer 56' })
    await user.click(first)
    expect(first).toHaveAttribute('aria-pressed', 'true')
    expect(first).toHaveTextContent('Selected')
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeEnabled()
    await user.click(second)
    expect(first).toHaveAttribute('aria-pressed', 'false')
    expect(second).toHaveAttribute('aria-pressed', 'true')
    expect(onResult).not.toHaveBeenCalled()
  })

  it('reveals correct and selected answers, locks the front, announces the reveal, and moves focus', async () => {
    const user = userEvent.setup()
    renderCard()
    const answer = screen.getByRole('button', { name: 'Answer 48' })
    const other = screen.getByRole('button', { name: 'Answer 56' })
    const flip = screen.getByRole('button', { name: 'Flip Card' })
    await user.click(answer)
    await user.click(flip)
    expect(screen.getByText(/^Correct answer:/)).toHaveTextContent(
      'Correct answer: 56',
    )
    expect(screen.getByText(/^Your answer:/)).toHaveTextContent(
      'Your answer: 48',
    )
    expect(screen.getByText('8 × 7 = 56')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Answer revealed' }),
    ).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Correct answer: 56. Your answer: 48.',
    )
    expect(flip).toHaveAttribute('aria-expanded', 'true')
    expect(document.querySelector('.card-front')).toHaveAttribute('inert')
    expect(document.querySelector('.card-front')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(
      screen.queryByRole('button', { name: 'Answer 56' }),
    ).not.toBeInTheDocument()
    expect(other).toBeDisabled()
    fireEvent.click(other)
    expect(screen.getByText(/^Your answer:/)).toHaveTextContent('48')
  })

  it.each([
    ['I Got It Right', true],
    ['I Got It Wrong', false],
  ] as const)(
    '%s invokes the callback once and prevents both responses',
    async (label, expected) => {
      const user = userEvent.setup()
      const { onResult } = renderCard()
      await user.click(screen.getByRole('button', { name: 'Answer 48' }))
      await user.click(screen.getByRole('button', { name: 'Flip Card' }))
      await user.dblClick(screen.getByRole('button', { name: label }))
      await user.click(
        screen.getByRole('button', {
          name: expected ? 'I Got It Wrong' : 'I Got It Right',
        }),
      )
      expect(onResult).toHaveBeenCalledExactlyOnceWith(expected, 48)
      expect(
        screen.getByRole('button', { name: 'I Got It Right' }),
      ).toBeDisabled()
      expect(
        screen.getByRole('button', { name: 'I Got It Wrong' }),
      ).toBeDisabled()
    },
  )

  it('does not allow hidden back controls to report a result before flipping', () => {
    const { onResult } = renderCard()
    const right = document.querySelector('.card-back button')!
    fireEvent.click(right)
    expect(onResult).not.toHaveBeenCalled()
  })

  it('resets selection, flip state, and callback lock for a new question ID', async () => {
    const user = userEvent.setup()
    const { rerender, onResult } = renderCard()
    await user.click(screen.getByRole('button', { name: 'Answer 56' }))
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    rerender(
      <QuestionCard
        question={{ ...question, id: 'card-2' }}
        questionNumber={4}
        totalQuestions={10}
        onResult={onResult}
      />,
    )
    expect(screen.getByText('Question 4 of 10')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Answer 56' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await user.click(screen.getByRole('button', { name: 'Answer 54' }))
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
    expect(onResult).toHaveBeenCalledTimes(2)
    expect(onResult).toHaveBeenLastCalledWith(false, 54)
  })

  it('preserves selection for rerenders of the same question', async () => {
    const user = userEvent.setup()
    const { rerender, onResult } = renderCard()
    await user.click(screen.getByRole('button', { name: 'Answer 56' }))
    rerender(
      <QuestionCard
        question={{ ...question }}
        questionNumber={3}
        totalQuestions={10}
        animationEnabled={false}
        onResult={onResult}
      />,
    )
    expect(screen.getByRole('button', { name: 'Answer 56' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('supports zero selections, continuous practice, and flipping without animation', async () => {
    const user = userEvent.setup()
    renderCard({
      question: {
        ...question,
        id: 'zero',
        operation: 'addition',
        firstOperand: 0,
        secondOperand: 0,
        correctAnswer: 0,
        displayText: '0 + 0 = ?',
        choices: [1, 0, 2, 3],
      },
      totalQuestions: 'continuous',
      animationEnabled: false,
    })
    expect(
      screen.getByText('Question 3 · Continuous practice'),
    ).toBeInTheDocument()
    expect(document.querySelector('.question-card')).toHaveAttribute(
      'data-animation',
      'off',
    )
    await user.click(screen.getByRole('button', { name: 'Answer 0' }))
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    expect(screen.getByText(/^Your answer:/)).toHaveTextContent(
      'Your answer: 0',
    )
    expect(screen.getByText(/^Correct answer:/)).toHaveTextContent(
      'Correct answer: 0',
    )
  })

  it('supports Tab, Space, Enter, and keyboard access to the revealed controls', async () => {
    const user = userEvent.setup()
    const { onResult } = renderCard()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Answer 48' })).toHaveFocus()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Answer 48' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.tab()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Answer 56' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.tab()
    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Flip Card' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(
      screen.getByRole('heading', { name: 'Answer revealed' }),
    ).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'I Got It Right' })).toHaveFocus()
    await user.keyboard(' ')
    expect(onResult).toHaveBeenCalledExactlyOnceWith(true, 56)
  })
})
