import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../app/App'
import { practiceData } from '../test/practiceData'
import { readStorage, writeStorage } from '../services/storageService'

function open(path = '/statistics') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}
function expectTotals(
  region: HTMLElement,
  attempted: number,
  correct: number,
  incorrect: number,
  accuracy: string,
) {
  const scope = within(region)
  for (const [label, value] of [
    ['Attempted', attempted],
    ['Correct', correct],
    ['Incorrect', incorrect],
    ['Accuracy', accuracy],
  ])
    expect(scope.getByText(label).nextElementSibling).toHaveTextContent(
      String(value),
    )
}
afterEach(() => vi.restoreAllMocks())
describe('statistics page', () => {
  it('shows zero totals, all breakdowns and helpful empty states', () => {
    open()
    expectTotals(
      screen.getByRole('region', { name: 'Overall progress' }),
      0,
      0,
      0,
      '0%',
    )
    expect(screen.getByText(/No practice history yet/)).toBeInTheDocument()
    expect(screen.getByText(/No sessions yet/)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Division' })).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Level 4: Advanced' }),
    ).toBeInTheDocument()
  })
  it('loads saved totals, operation/difficulty breakdowns and recent sessions after remount', () => {
    const data = practiceData([
      { operation: 'addition', difficulty: 1, results: [true, false] },
      { operation: 'division', difficulty: 4, results: [true] },
    ])
    writeStorage(data)
    const first = open()
    expectTotals(
      screen.getByRole('region', { name: 'Overall progress' }),
      3,
      2,
      1,
      '66.7%',
    )
    expectTotals(
      screen.getByRole('region', { name: 'Addition' }),
      2,
      1,
      1,
      '50%',
    )
    expectTotals(
      screen.getByRole('region', { name: 'Level 4: Advanced' }),
      1,
      1,
      0,
      '100%',
    )
    const recent = within(
      screen.getByRole('region', { name: 'Recent sessions' }),
    )
    expect(recent.getAllByRole('listitem')).toHaveLength(2)
    expect(recent.getByText('Division · Advanced')).toBeInTheDocument()
    expect(document.querySelectorAll('time[datetime]')).toHaveLength(2)
    first.unmount()
    open()
    expectTotals(
      screen.getByRole('region', { name: 'Overall progress' }),
      3,
      2,
      1,
      '66.7%',
    )
  })
  it('keeps history when Reset Statistics is canceled; confirmed reset clears history and preserves settings', async () => {
    const data = practiceData()
    data.settings.cardAnimationEnabled = false
    writeStorage(data)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    const first = open()
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining('erase all practice history'),
    )
    expect(readStorage().data.attempts).toHaveLength(2)
    confirm.mockReturnValue(true)
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    expectTotals(
      screen.getByRole('region', { name: 'Overall progress' }),
      0,
      0,
      0,
      '0%',
    )
    expect(readStorage().data).toMatchObject({
      attempts: [],
      sessions: [],
      settings: { cardAnimationEnabled: false },
    })
    first.unmount()
    open('/practice/summary')
    expect(screen.getByText(/no completed session to show/)).toBeInTheDocument()
  })
  it('shows exactly the same saved results as the completed summary', async () => {
    writeStorage(practiceData())
    const user = userEvent.setup()
    open('/practice/summary')
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(
      within(
        screen.getByRole('region', { name: 'Session progress' }),
      ).getByText('Attempted').nextElementSibling,
    ).toHaveTextContent('2')
    await user.click(screen.getByRole('link', { name: 'View Statistics' }))
    expectTotals(
      screen.getByRole('region', { name: 'Overall progress' }),
      2,
      1,
      1,
      '50%',
    )
  })
})
