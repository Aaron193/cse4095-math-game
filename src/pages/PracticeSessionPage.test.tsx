import TestRouter from '../test/TestRouter'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useNavigate } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../app/App'
import type { Question } from '../types/question'
import * as recovery from '../services/questionRecovery'
import * as generator from '../services/questionGenerator'

let sequence = 0
beforeEach(() => {
  sequence = 0
  vi.spyOn(generator, 'generateMultipleChoiceQuestion').mockImplementation(
    (): Question => {
      const answer = ++sequence % 11
      return {
        id: `ui-question-${sequence}`,
        operation: 'addition',
        difficulty: 1,
        firstOperand: answer,
        secondOperand: 0,
        correctAnswer: answer,
        displayText: `${answer} + 0 = ?`,
        choices: [answer, answer + 1, answer + 2, answer + 3],
        source: 'regular',
      }
    },
  )
})
afterEach(() => vi.restoreAllMocks())

function ReturnToSession() {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate('/practice/session')}>
      Return to session route
    </button>
  )
}
function renderApp() {
  render(
    <TestRouter initialEntries={['/practice/setup']}>
      <App />
      <ReturnToSession />
    </TestRouter>,
  )
}
async function start(
  user: ReturnType<typeof userEvent.setup>,
  continuous = false,
) {
  if (
    !(
      screen.getByRole('checkbox', { name: 'Addition (+)' }) as HTMLInputElement
    ).checked
  )
    await user.click(screen.getByRole('checkbox', { name: 'Addition (+)' }))
  await user.click(screen.getByRole('radio', { name: 'Beginner' }))
  await user.click(
    screen.getByRole('radio', {
      name: continuous ? 'Continuous practice' : '5 questions',
    }),
  )
  await user.click(screen.getByRole('button', { name: 'Start Session' }))
}
async function answer(
  user: ReturnType<typeof userEvent.setup>,
  correct: boolean,
) {
  await user.click(screen.getAllByRole('button', { name: /^Answer / })[0])
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(
    screen.getByRole('button', {
      name: correct ? 'I Got It Right' : 'I Got It Wrong',
    }),
  )
}
function total(label: string) {
  const region = within(
    screen.getByRole('region', { name: 'Session progress' }),
  )
  return region.getByText(label).parentElement!.querySelector('dd')!
}

describe('functional practice session page', () => {
  it('starts from setup, shows progress, advances and resets the interactive card', async () => {
    const user = userEvent.setup()
    renderApp()
    await start(user)
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', { name: 'Questions completed' }),
    ).toHaveAttribute('value', '0')
    expect(total('Attempted')).toHaveTextContent('0')
    const initialText = document.querySelector(
      '.card-front .math-question',
    )!.textContent
    await answer(user, true)
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()
    expect(total('Attempted')).toHaveTextContent('1')
    expect(total('Correct')).toHaveTextContent('1')
    expect(total('Incorrect')).toHaveTextContent('0')
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '1')
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      '1 of 5 questions completed',
    )
    expect(
      document.querySelector('.card-front .math-question')!.textContent,
    ).not.toBe(initialText)
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    expect(
      screen.queryByRole('heading', { name: 'Answer revealed' }),
    ).not.toBeInTheDocument()
    expect(
      screen
        .getAllByRole('button', { name: /^Answer / })
        .every((button) => button.getAttribute('aria-pressed') === 'false'),
    ).toBe(true)
    expect(
      screen.getByRole('heading', { name: 'Your next question' }),
    ).toHaveFocus()
    await answer(user, false)
    expect(screen.getByText('Question 3 of 5')).toBeInTheDocument()
    expect(total('Attempted')).toHaveTextContent('2')
    expect(total('Correct')).toHaveTextContent('1')
    expect(total('Incorrect')).toHaveTextContent('1')
  })

  it('finishes after exactly five answers and remains completed after route re-entry', async () => {
    const user = userEvent.setup()
    const storage = vi.spyOn(Storage.prototype, 'setItem')
    renderApp()
    await start(user)
    for (let index = 0; index < 5; index++) await answer(user, index % 2 === 0)
    expect(
      screen.getByRole('heading', { name: 'Session Summary' }),
    ).toHaveFocus()
    expect(total('Attempted')).toHaveTextContent('5')
    expect(total('Correct')).toHaveTextContent('3')
    expect(total('Incorrect')).toHaveTextContent('2')
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '5')
    expect(
      screen.queryByRole('button', { name: 'Flip Card' }),
    ).not.toBeInTheDocument()
    expect(generator.generateMultipleChoiceQuestion).toHaveBeenCalledTimes(5)
    await user.click(
      screen.getByRole('link', {
        name: screen.queryByRole('heading', { name: 'Session Summary' })
          ? 'Return Home'
          : 'Back to home',
      }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Return to session route' }),
    )
    expect(
      screen.getByRole('heading', { name: 'Session Summary' }),
    ).toBeInTheDocument()
    expect(total('Attempted')).toHaveTextContent('5')
    expect(generator.generateMultipleChoiceQuestion).toHaveBeenCalledTimes(5)
    expect(storage).toHaveBeenCalled() // Completed attempts now persist in Phase 9.
  })

  it('retains an active session across route navigation and only starts fresh on an explicit setup submission', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderApp()
    await start(user)
    await answer(user, false)
    await user.click(
      screen.getByRole('link', {
        name: screen.queryByRole('heading', { name: 'Session Summary' })
          ? 'Return Home'
          : 'Back to home',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Save and Leave' }))
    await user.click(
      screen.getByRole('button', { name: 'Return to session route' }),
    )
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()
    expect(total('Incorrect')).toHaveTextContent('1')
    expect(generator.generateMultipleChoiceQuestion).toHaveBeenCalledTimes(2)
    await user.click(
      screen.getByRole('link', { name: 'Change practice choices' }),
    )
    await user.click(screen.getByRole('button', { name: 'Save and Leave' }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(total('Attempted')).toHaveTextContent('0')
    expect(generator.generateMultipleChoiceQuestion).toHaveBeenCalledTimes(3)
  })

  it('hides fixed progress in continuous mode and supports canceling or confirming End Session', async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderApp()
    await start(user, true)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    await answer(user, false)
    expect(
      screen.getByText('Question 2 · Continuous practice'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    expect(
      screen.getByRole('button', { name: 'Flip Card' }),
    ).toBeInTheDocument()
    expect(total('Attempted')).toHaveTextContent('1')
    confirm.mockReturnValue(true)
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    expect(
      screen.getByRole('heading', { name: 'Session Summary' }),
    ).toBeInTheDocument()
    expect(total('Attempted')).toHaveTextContent('1')
    expect(total('Incorrect')).toHaveTextContent('1')
    expect(
      screen.queryByRole('button', { name: 'Flip Card' }),
    ).not.toBeInTheDocument()
    expect(generator.generateMultipleChoiceQuestion).toHaveBeenCalledTimes(2)
  })

  it('shows retryable generation errors without losing completed results', async () => {
    const user = userEvent.setup()
    renderApp()
    await start(user)
    const healthy = vi
      .mocked(generator.generateMultipleChoiceQuestion)
      .getMockImplementation()!
    const fallback = vi
      .spyOn(recovery, 'generateFallbackQuestion')
      .mockImplementation(() => {
        throw new Error('fallback failed')
      })
    vi.mocked(generator.generateMultipleChoiceQuestion).mockImplementation(
      () => {
        throw new Error('failed')
      },
    )
    await answer(user, true)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'couldn’t load the next question',
    )
    expect(total('Attempted')).toHaveTextContent('1')
    vi.mocked(generator.generateMultipleChoiceQuestion).mockImplementation(
      healthy,
    )
    fallback.mockRestore()
    await user.click(
      screen.getByRole('button', { name: 'Try loading a question again' }),
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()
    expect(total('Attempted')).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
  })
})
