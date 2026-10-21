import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../app/App'
import PracticeConfigurationProvider from '../app/PracticeConfigurationProvider'
import { PracticeSessionContext } from '../app/practiceSessionContext'
import type {
  PracticeConfiguration,
  PracticeSessionState,
} from '../types/session'
import type { Question } from '../types/question'
import * as generator from '../services/questionGenerator'
import SessionSummaryPage from './SessionSummaryPage'

function RouteProbe() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output aria-label="Current route">{pathname}</output>
      <button onClick={() => navigate('/practice/summary')}>
        Open summary route
      </button>
    </>
  )
}
function completedSession(attempted = 5, correct = 3): PracticeSessionState {
  return {
    session: {
      id: 'completed-session',
      startedAt: '2026-10-21T12:00:00.000Z',
      completedAt: '2026-10-21T12:01:00.000Z',
      operations: ['addition', 'division'],
      difficulty: 3,
      sessionLength: 5,
      attempted,
      correct,
      incorrect: attempted - correct,
    },
    currentQuestionIndex: Math.max(0, attempted - 1),
    question: null,
    isActive: false,
    error: null,
    attempts: Array.from({ length: attempted }, (_, index) => ({
      id: `attempt-${index}`,
      questionId: `question-${index}`,
      operation: 'addition',
      firstOperand: 1,
      secondOperand: 2,
      correctAnswer: 3,
      selectedAnswer: 3,
      selfReportedCorrect: index < correct,
      difficulty: 3,
      source: 'regular',
      attemptedAt: '2026-10-21T12:00:30.000Z',
      sessionId: 'completed-session',
    })),
  }
}
function renderSummary(
  state: PracticeSessionState | null = completedSession(),
) {
  const startSession = vi.fn(
    (configuration: PracticeConfiguration) =>
      configuration.operations.length > 0,
  )
  render(
    <MemoryRouter initialEntries={['/practice/summary']}>
      <PracticeConfigurationProvider>
        <PracticeSessionContext.Provider
          value={{
            state,
            startSession,
            recordResult: vi.fn(),
            endSession: vi.fn(),
            retryQuestion: vi.fn(),
          }}
        >
          <SessionSummaryPage />
        </PracticeSessionContext.Provider>
      </PracticeConfigurationProvider>
      <RouteProbe />
    </MemoryRouter>,
  )
  return { startSession }
}
function metric(label: string) {
  return screen.getByText(label).nextElementSibling!
}
function enableMockQuestions() {
  let sequence = 0
  return vi
    .spyOn(generator, 'generateMultipleChoiceQuestion')
    .mockImplementation((operations, difficulty): Question => {
      const operation =
        typeof operations === 'string' ? operations : operations[0]
      const answer = ++sequence % 10
      return {
        id: `summary-ui-${sequence}`,
        operation,
        difficulty,
        firstOperand: answer,
        secondOperand: 0,
        correctAnswer: answer,
        displayText: `${answer} + 0 = ?`,
        choices: [answer, answer + 1, answer + 2, answer + 3],
        source: 'regular',
      }
    })
}
function renderApplication() {
  render(
    <MemoryRouter initialEntries={['/practice/setup']}>
      <App />
      <RouteProbe />
    </MemoryRouter>,
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
afterEach(() => vi.restoreAllMocks())

describe('summary details and actions', () => {
  it('shows totals, accuracy, operations, difficulty, and zero regular-practice review questions', () => {
    renderSummary()
    expect(metric('Attempted')).toHaveTextContent('5')
    expect(metric('Correct')).toHaveTextContent('3')
    expect(metric('Incorrect')).toHaveTextContent('2')
    expect(metric('Accuracy')).toHaveTextContent('60%')
    expect(metric('Operations')).toHaveTextContent('Addition, Division')
    expect(metric('Difficulty')).toHaveTextContent('Intermediate')
    expect(metric('Mistake-review questions completed')).toHaveTextContent('0')
    expect(
      screen.getByRole('heading', { name: 'Session Summary' }),
    ).toHaveFocus()
  })
  it('handles an empty ended continuous session with finite zero accuracy', () => {
    const state = completedSession(0, 0)
    state.session.sessionLength = 'continuous'
    renderSummary(state)
    expect(metric('Accuracy')).toHaveTextContent('0%')
    expect(metric('Attempted')).toHaveTextContent('0')
    expect(metric('Correct')).toHaveTextContent('0')
    expect(metric('Incorrect')).toHaveTextContent('0')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
  it('counts review sources from completed attempts without implementing review practice', () => {
    const state = completedSession()
    state.attempts[0].source = 'mistake-review'
    state.attempts[1].source = 'mistake-review'
    renderSummary(state)
    expect(metric('Mistake-review questions completed')).toHaveTextContent('2')
  })
  it('Practice Again transfers a copy of the completed configuration', async () => {
    const user = userEvent.setup()
    const state = completedSession()
    const { startSession } = renderSummary(state)
    await user.click(screen.getByRole('button', { name: 'Practice Again' }))
    expect(startSession).toHaveBeenCalledExactlyOnceWith({
      operations: ['addition', 'division'],
      difficulty: 3,
      sessionLength: 5,
    })
    expect(startSession.mock.calls[0][0].operations).not.toBe(
      state.session.operations,
    )
    expect(screen.getByLabelText('Current route')).toHaveTextContent(
      '/practice/session',
    )
  })
  it.each([
    ['Change Settings', '/practice/setup'],
    ['View Statistics', '/statistics'],
    ['Return Home', '/'],
  ] as const)('%s navigates to %s', async (label, path) => {
    const user = userEvent.setup()
    renderSummary()
    await user.click(screen.getByRole('link', { name: label }))
    expect(screen.getByLabelText('Current route').textContent).toBe(path)
  })
  it('Practice Mistakes announces coming soon and leaves results unchanged', async () => {
    const user = userEvent.setup()
    const { startSession } = renderSummary()
    await user.click(screen.getByRole('button', { name: 'Practice Mistakes' }))
    expect(
      screen.getByText(/Mistake-review practice is coming soon/),
    ).toBeInTheDocument()
    expect(metric('Accuracy')).toHaveTextContent('60%')
    expect(startSession).not.toHaveBeenCalled()
  })
  it('handles a missing session with setup/home links and no restart action', () => {
    renderSummary(null)
    expect(
      screen.getByText(/no completed session to show yet/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Go to Practice Setup' }),
    ).toHaveAttribute('href', '/practice/setup')
    expect(screen.getByRole('link', { name: 'Return Home' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(
      screen.queryByRole('button', { name: 'Practice Again' }),
    ).not.toBeInTheDocument()
  })
  it('offers an active session a way to continue without presenting partial totals as a completed summary', () => {
    const state = completedSession()
    state.isActive = true
    state.session.completedAt = undefined
    renderSummary(state)
    expect(screen.getByText(/Finish your current session/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Continue Session' }),
    ).toHaveAttribute('href', '/practice/session')
    expect(screen.queryByText('Accuracy')).not.toBeInTheDocument()
  })
})

describe('summary integration', () => {
  it('automatically navigates on fixed completion, retains results and starts completely fresh with Practice Again', async () => {
    const user = userEvent.setup()
    const generate = enableMockQuestions()
    renderApplication()
    await start(user)
    const oldQuestion = document.querySelector(
      '.card-front .math-question',
    )!.textContent
    for (let index = 0; index < 5; index++) await answer(user, index % 2 === 0)
    expect(screen.getByLabelText('Current route')).toHaveTextContent(
      '/practice/summary',
    )
    expect(metric('Accuracy')).toHaveTextContent('60%')
    expect(metric('Attempted')).toHaveTextContent('5')
    expect(generate).toHaveBeenCalledTimes(5)
    await user.click(screen.getByRole('link', { name: 'Return Home' }))
    await user.click(screen.getByRole('button', { name: 'Open summary route' }))
    expect(metric('Accuracy')).toHaveTextContent('60%')
    expect(generate).toHaveBeenCalledTimes(5)
    await user.click(screen.getByRole('button', { name: 'Practice Again' }))
    expect(screen.getByLabelText('Current route')).toHaveTextContent(
      '/practice/session',
    )
    expect(metric('Attempted')).toHaveTextContent('0')
    expect(metric('Correct')).toHaveTextContent('0')
    expect(metric('Incorrect')).toHaveTextContent('0')
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(
      document.querySelector('.card-front .math-question')!.textContent,
    ).not.toBe(oldQuestion)
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    expect(generate).toHaveBeenCalledTimes(6)
    expect(generate).toHaveBeenLastCalledWith(['addition'], 1)
  })
  it.each([0, 2])(
    'shows continuous summary after ending with %s completed attempts',
    async (count) => {
      const user = userEvent.setup()
      const generate = enableMockQuestions()
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
      renderApplication()
      await start(user, true)
      for (let index = 0; index < count; index++)
        await answer(user, index === 0)
      await user.click(screen.getByRole('button', { name: 'End Session' }))
      expect(screen.getByLabelText('Current route')).toHaveTextContent(
        '/practice/session',
      )
      confirm.mockReturnValue(true)
      await user.click(screen.getByRole('button', { name: 'End Session' }))
      expect(screen.getByLabelText('Current route')).toHaveTextContent(
        '/practice/summary',
      )
      expect(metric('Attempted')).toHaveTextContent(String(count))
      expect(metric('Accuracy')).toHaveTextContent(count === 0 ? '0%' : '50%')
      expect(generate).toHaveBeenCalledTimes(count + 1)
      await user.click(screen.getByRole('button', { name: 'Practice Again' }))
      expect(
        screen.getByText('Question 1 · Continuous practice'),
      ).toBeInTheDocument()
      expect(metric('Attempted')).toHaveTextContent('0')
    },
  )
})
