import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TestRouter from '../test/TestRouter'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../app/App'
import { mistakeAttempt } from '../test/mistakeData'
import {
  emptyData,
  normalizeData,
  readStorage,
  writeStorage,
} from '../services/storageService'
import * as recovery from '../services/questionRecovery'
import * as similar from '../services/similarQuestionGenerator'

function open(path = '/practice/setup?mode=mistake-review') {
  return render(
    <TestRouter initialEntries={[path]}>
      <App />
    </TestRouter>,
  )
}
function seed() {
  writeStorage(normalizeData({ ...emptyData(), attempts: [mistakeAttempt(0)] }))
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
afterEach(() => vi.restoreAllMocks())
describe('mistake-review interface', () => {
  it('explains no active mistakes, prevents empty review, and permits regular practice', async () => {
    const user = userEvent.setup()
    open()
    expect(screen.getByRole('radio', { name: 'Mistake review' })).toBeDisabled()
    expect(
      screen.getByRole('radio', { name: 'Mistake review' }),
    ).toHaveAccessibleDescription(/No active mistakes yet/)
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: 'Regular practice' }))
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeEnabled()
  })
  it('offers review from regular setup, chooses suitable difficulty and validates empty filters', async () => {
    seed()
    const user = userEvent.setup()
    open('/practice/setup')
    await user.click(screen.getByRole('radio', { name: 'Mistake review' }))
    expect(screen.getByRole('radio', { name: 'Easy' })).toBeChecked()
    expect(screen.getByText(/1 active mistake pattern/)).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Advanced' }))
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'No active mistakes match',
    )
  })
  it('masters a pattern through real cards, automatically summarizes, persists and handles exhausted Practice Again', async () => {
    seed()
    const user = userEvent.setup()
    const generated = vi.spyOn(similar, 'generateSimilarQuestion')
    const first = open()
    await user.click(screen.getByRole('radio', { name: '5 questions' }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    for (let i = 0; i < 3; i++) {
      expect(screen.getByText(`Question ${i + 1} of 5`)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
      await answer(user, true)
    }
    expect(
      screen.getByRole('heading', { name: 'Session Summary' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/mastered every selected pattern/),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Mistake-review questions completed').nextElementSibling,
    ).toHaveTextContent('3')
    expect(generated).toHaveBeenCalledTimes(3)
    expect(readStorage().data).toMatchObject({
      statistics: { attempted: 4, correct: 3, incorrect: 1 },
    })
    expect(readStorage().data.mistakePatterns[0]).toMatchObject({
      mastered: true,
      similarCorrectCount: 3,
    })
    expect(
      readStorage().data.attempts.filter((a) => a.source === 'mistake-review'),
    ).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: 'Practice Again' }))
    expect(screen.getByRole('status')).toHaveTextContent(
      'All selected mistakes are mastered',
    )
    expect(generated).toHaveBeenCalledTimes(3)
    first.unmount()
    open('/practice/summary')
    expect(
      screen.getByText(/mastered every selected pattern/),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Practice Mistakes' }))
    expect(screen.getByRole('radio', { name: 'Mistake review' })).toBeDisabled()
  })
  it('supports fixed completion and review mode Practice Again while active mistakes remain', async () => {
    seed()
    const user = userEvent.setup()
    open()
    await user.click(screen.getByRole('radio', { name: '5 questions' }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    for (let i = 0; i < 5; i++) await answer(user, false)
    expect(
      screen.getByText('Mistake-review questions completed').nextElementSibling,
    ).toHaveTextContent('5')
    expect(readStorage().data.mistakePatterns).toHaveLength(1)
    expect(readStorage().data.mistakePatterns[0].incorrectCount).toBe(6)
    await user.click(screen.getByRole('button', { name: 'Practice Again' }))
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(readStorage().data.sessions[0].mode).toBe('mistake-review')
  })
  it('retains an accepted review attempt through generation failure and retry without duplicate progress', async () => {
    seed()
    const user = userEvent.setup()
    open()
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    const healthy = similar.generateSimilarQuestion
    const fallback = vi
      .spyOn(recovery, 'generateFallbackQuestion')
      .mockImplementation(() => {
        throw new Error('fallback failed')
      })
    const generated = vi
      .spyOn(similar, 'generateSimilarQuestion')
      .mockImplementation(() => {
        throw new Error('failed')
      })
    await answer(user, true)
    expect(screen.getByRole('alert')).toHaveTextContent('couldn’t load')
    expect(readStorage().data.mistakePatterns[0].similarCorrectCount).toBe(1)
    generated.mockImplementation(healthy)
    fallback.mockRestore()
    await user.click(
      screen.getByRole('button', { name: 'Try loading a question again' }),
    )
    expect(generated).toHaveBeenCalledTimes(4)
    expect(readStorage().data.mistakePatterns[0].similarCorrectCount).toBe(1)
    const totals = within(
      screen.getByRole('region', { name: 'Session progress' }),
    )
    expect(totals.getByText('Attempted').nextElementSibling).toHaveTextContent(
      '1',
    )
  })
})
