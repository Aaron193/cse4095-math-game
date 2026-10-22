import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import App from '../app/App'
import TestRouter from '../test/TestRouter'
import { difficultyOptions } from '../components/practice/practiceOptions'
import { readStorage } from '../services/storageService'
import { validateQuestion } from '../utils/validation'

afterEach(() => vi.restoreAllMocks())

it.each(difficultyOptions)(
  'completes and reloads a real mixed session at $label difficulty',
  async ({ value, label }) => {
    const user = userEvent.setup()
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.125)
    const view = render(
      <TestRouter initialEntries={['/practice/setup']}>
        <App />
      </TestRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Select All' }))
    await user.click(screen.getByRole('radio', { name: label }))
    await user.click(screen.getByRole('radio', { name: '5 questions' }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    for (let index = 0; index < 5; index++) {
      const question = readStorage().data.activeSession!.question!
      validateQuestion(question)
      expect(question.difficulty).toBe(value)
      await user.click(screen.getAllByRole('button', { name: /^Answer / })[0])
      await user.click(screen.getByRole('button', { name: 'Flip Card' }))
      random.mockReturnValue((((index + 1) % 4) + 0.5) / 4)
      await user.click(
        screen.getByRole('button', {
          name: index === 0 ? 'I Got It Wrong' : 'I Got It Right',
        }),
      )
    }
    expect(
      screen.getByRole('heading', { name: 'Session Summary' }),
    ).toBeVisible()
    const data = readStorage().data
    expect(
      new Set(data.attempts.map((attempt) => attempt.operation)).size,
    ).toBe(4)
    expect(data.statistics).toMatchObject({
      attempted: 5,
      correct: 4,
      incorrect: 1,
    })
    expect(data.mistakePatterns).toHaveLength(1)
    expect(data.activeSession).toBeNull()
    view.unmount()
    render(
      <TestRouter initialEntries={['/statistics']}>
        <App />
      </TestRouter>,
    )
    const overall = within(
      screen.getByRole('region', { name: 'Overall progress' }),
    )
    expect(overall.getByText('Attempted').nextElementSibling).toHaveTextContent(
      '5',
    )
    expect(overall.getByText('Accuracy').nextElementSibling).toHaveTextContent(
      '80%',
    )
  },
  15_000,
)
