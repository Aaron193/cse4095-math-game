import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TestRouter from '../test/TestRouter'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../app/App'
import { mistakeAttempt as attempt } from '../test/mistakeData'
import { mistakeId } from '../services/mistakeService'
import {
  emptyData,
  normalizeData,
  readStorage,
  writeStorage,
} from '../services/storageService'

function seed() {
  const parent = attempt(0)
  const records = [
    parent,
    ...[1, 2, 3].map((i) =>
      attempt(i, {
        source: 'mistake-review' as const,
        mistakePatternId: mistakeId(parent),
        selfReportedCorrect: true,
      }),
    ),
    attempt(4, { operation: 'addition', correctAnswer: 15 }),
  ]
  writeStorage(normalizeData({ ...emptyData(), attempts: records }))
}
function open() {
  return render(
    <TestRouter initialEntries={['/statistics']}>
      <App />
    </TestRouter>,
  )
}
function region() {
  return screen.getByRole('region', { name: 'Mistake-review progress' })
}
afterEach(() => vi.restoreAllMocks())
describe('mistake statistics page integration', () => {
  it('shows helpful zero states without mistakes', () => {
    open()
    expect(
      within(region()).getByText(/No mistakes recorded yet/),
    ).toBeInTheDocument()
    expect(
      within(region()).getByText('Active patterns', { selector: 'dt' })
        .nextElementSibling,
    ).toHaveTextContent('0')
    expect(
      within(region()).getByText('Similar questions practiced')
        .nextElementSibling,
    ).toHaveTextContent('0')
    expect(
      within(region()).getByText('No missed operations yet.'),
    ).toBeInTheDocument()
  })
  it('shows totals, tied operations/facts, active progress, mastered details and dates after reload', async () => {
    seed()
    const user = userEvent.setup()
    const first = open()
    const scope = within(region())
    for (const [label, value] of [
      ['Active patterns', '1'],
      ['Mastered patterns', '1'],
      ['Similar questions practiced', '3'],
      ['Review questions marked correct', '3'],
    ])
      expect(
        scope.getByText(label, { selector: 'dt' }).nextElementSibling,
      ).toHaveTextContent(value)
    expect(
      scope.getByText(/Addition, Multiplication: 1 miss each \(tied\)/),
    ).toBeInTheDocument()
    expect(scope.getByText('2 facts are tied.')).toBeInTheDocument()
    expect(
      scope.getByRole('list', { name: 'Mistake pattern details' }),
    ).toHaveTextContent('8 + 7 = 15')
    expect(
      scope.getByRole('progressbar', { name: /Mastery for 8 \+ 7/ }),
    ).toHaveAttribute('value', '0')
    await user.click(scope.getByRole('radio', { name: 'Mastered patterns' }))
    expect(
      scope.getByRole('list', { name: 'Mistake pattern details' }),
    ).toHaveTextContent('8 × 7 = 56')
    expect(
      scope.getByRole('progressbar', { name: /Mastery for 8 × 7/ }),
    ).toHaveAttribute('value', '3')
    expect(scope.getByText(/3 of 3 successful reviews/)).toBeInTheDocument()
    expect(
      scope
        .getByRole('list', { name: 'Mistake pattern details' })
        .querySelector('time'),
    ).toHaveAttribute('datetime', attempt(0).attemptedAt)
    await user.click(scope.getByRole('radio', { name: 'All patterns' }))
    expect(scope.getAllByRole('progressbar')).toHaveLength(2)
    first.unmount()
    open()
    expect(
      within(region()).getByText('Mastered patterns', { selector: 'dt' })
        .nextElementSibling,
    ).toHaveTextContent('1')
  })
  it('confirmed history reset also clears patterns and review statistics while retaining preferences', async () => {
    seed()
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    open()
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    expect(readStorage().data.mistakePatterns).toEqual([])
    expect(
      within(region()).getByText('Similar questions practiced')
        .nextElementSibling,
    ).toHaveTextContent('0')
    expect(
      within(region()).getByText('Mastered patterns', { selector: 'dt' })
        .nextElementSibling,
    ).toHaveTextContent('0')
  })
  it('provides a real review entry point with stored active patterns', async () => {
    seed()
    const user = userEvent.setup()
    open()
    await user.click(
      within(region()).getByRole('link', { name: 'Practice Mistakes' }),
    )
    expect(
      screen.getByRole('heading', { name: 'Practice Setup' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Mistake review' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeEnabled()
  })
})
