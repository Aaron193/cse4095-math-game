import TestRouter from '../test/TestRouter'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useNavigate } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../app/App'
import {
  defaultSettings,
  readStorage,
  STORAGE_KEY,
  writeStorage,
} from '../services/storageService'
import { practiceData } from '../test/practiceData'
import * as generator from '../services/questionGenerator'

function ReturnToSession() {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate('/practice/session')}>
      Resume current session
    </button>
  )
}
function open(path = '/settings') {
  return render(
    <TestRouter initialEntries={[path]}>
      <App />
      <ReturnToSession />
    </TestRouter>,
  )
}
afterEach(() => vi.restoreAllMocks())
describe('persistent application settings', () => {
  it('shows valid defaults and explains unavailable sound/explanation controls', () => {
    open()
    expect(
      screen.getByRole('checkbox', { name: 'Card animations' }),
    ).toBeChecked()
    for (const name of ['Sound effects', 'Show explanations']) {
      expect(screen.getByRole('checkbox', { name })).toBeDisabled()
      expect(screen.getByRole('checkbox', { name })).not.toBeChecked()
      expect(
        screen.getByRole('checkbox', { name }),
      ).toHaveAccessibleDescription(/unavailable/)
    }
    expect(screen.getByRole('checkbox', { name: 'Addition (+)' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Beginner' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '10 questions' })).toBeChecked()
  })
  it('saves all supported preferences and restores them after remount', async () => {
    const user = userEvent.setup()
    const first = open()
    await user.click(screen.getByRole('checkbox', { name: 'Card animations' }))
    await user.click(screen.getByRole('checkbox', { name: 'Addition (+)' }))
    await user.click(screen.getByRole('checkbox', { name: 'Division (÷)' }))
    await user.click(screen.getByRole('radio', { name: 'Advanced' }))
    await user.click(screen.getByRole('radio', { name: 'Continuous practice' }))
    await user.click(screen.getByRole('button', { name: 'Save Settings' }))
    expect(screen.getByRole('status')).toHaveTextContent('Settings saved!')
    expect(readStorage().data.settings).toMatchObject({
      cardAnimationEnabled: false,
      defaultOperations: ['division'],
      defaultDifficulty: 4,
      defaultSessionLength: 'continuous',
    })
    first.unmount()
    open()
    expect(
      screen.getByRole('checkbox', { name: 'Card animations' }),
    ).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Division (÷)' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Advanced' })).toBeChecked()
    expect(
      screen.getByRole('radio', { name: 'Continuous practice' }),
    ).toBeChecked()
  })
  it('requires at least one default operation and supports keyboard controls', async () => {
    const user = userEvent.setup()
    open()
    const addition = screen.getByRole('checkbox', { name: 'Addition (+)' })
    addition.focus()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Save Settings' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Choose at least one default operation.',
    )
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Save Settings' })).toBeEnabled()
  })
  it('applies saved defaults to setup, permits an individual override, and leaves saved defaults unchanged', async () => {
    const data = practiceData()
    data.settings = {
      ...data.settings,
      defaultOperations: ['multiplication', 'division'],
      defaultDifficulty: 3,
      defaultSessionLength: 20,
    }
    writeStorage(data)
    const user = userEvent.setup()
    open('/practice/setup')
    expect(
      screen.getByRole('checkbox', { name: 'Multiplication (×)' }),
    ).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Division (÷)' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Intermediate' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '20 questions' })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: 'Easy' }))
    await user.click(screen.getByRole('radio', { name: '5 questions' }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    expect(screen.getByText('Easy')).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(readStorage().data.settings.defaultDifficulty).toBe(3)
    expect(readStorage().data.settings.defaultSessionLength).toBe(20)
  })
  it('changing defaults after a session replaces remembered setup choices without resetting the active card', async () => {
    const user = userEvent.setup()
    const generated = vi.spyOn(generator, 'generateMultipleChoiceQuestion')
    open('/practice/setup')
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    const text = document.querySelector(
      '.card-front .math-question',
    )!.textContent
    const nav = within(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    )
    await user.click(nav.getByRole('link', { name: 'Settings' }))
    await user.click(screen.getByRole('button', { name: 'Save and Leave' }))
    await user.click(screen.getByRole('radio', { name: 'Advanced' }))
    await user.click(screen.getByRole('checkbox', { name: 'Card animations' }))
    await user.click(screen.getByRole('button', { name: 'Save Settings' }))
    await user.click(
      screen.getByRole('button', { name: 'Resume current session' }),
    )
    expect(
      document.querySelector('.card-front .math-question')!.textContent,
    ).toBe(text)
    expect(screen.getByText('Beginner')).toBeInTheDocument()
    expect(document.querySelector('.question-card')).toHaveAttribute(
      'data-animation',
      'off',
    )
    expect(generated).toHaveBeenCalledTimes(1)
    await user.click(
      screen.getByRole('link', { name: 'Change practice choices' }),
    )
    await user.click(screen.getByRole('button', { name: 'Save and Leave' }))
    expect(screen.getByRole('radio', { name: 'Advanced' })).toBeChecked()
  })
  it('session animation toggle persists without replacing the session or recording an attempt', async () => {
    const user = userEvent.setup()
    const generated = vi.spyOn(generator, 'generateMultipleChoiceQuestion')
    const first = open('/practice/setup')
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    await user.click(
      screen.getByRole('checkbox', { name: 'Show card animation' }),
    )
    expect(document.querySelector('.question-card')).toHaveAttribute(
      'data-animation',
      'off',
    )
    expect(readStorage().data.settings.cardAnimationEnabled).toBe(false)
    expect(readStorage().data.attempts).toHaveLength(0)
    expect(generated).toHaveBeenCalledTimes(1)
    first.unmount()
    open('/settings')
    expect(
      screen.getByRole('checkbox', { name: 'Card animations' }),
    ).not.toBeChecked()
  })
  it('cancel keeps all data; confirmed clear removes app keys, restores defaults and returns home', async () => {
    const data = practiceData()
    data.settings.cardAnimationEnabled = false
    writeStorage(data)
    localStorage.setItem('mathPractice.mistakePatterns', '["old"]')
    localStorage.setItem('another-app', 'keep')
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    open()
    await user.click(
      screen.getByRole('button', { name: 'Clear All Application Data' }),
    )
    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining('cannot be undone'),
    )
    expect(readStorage().data.attempts).toHaveLength(2)
    expect(
      screen.getByRole('heading', { name: 'Settings' }),
    ).toBeInTheDocument()
    confirm.mockReturnValue(true)
    await user.click(
      screen.getByRole('button', { name: 'Clear All Application Data' }),
    )
    expect(
      screen.getByRole('heading', { name: 'Math Practice App' }),
    ).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem('mathPractice.mistakePatterns')).toBeNull()
    expect(localStorage.getItem('another-app')).toBe('keep')
    expect(readStorage().data.settings).toEqual(defaultSettings())
    await user.click(
      screen.getByRole('button', { name: 'Resume current session' }),
    )
    expect(
      screen.getByRole('heading', { name: 'Practice Setup' }),
    ).toBeInTheDocument()
  })
  it('recovers corrupted settings and shows a helpful warning', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        settings: 'broken',
        sessions: [],
        attempts: [],
      }),
    )
    open()
    expect(screen.getByRole('alert')).toHaveTextContent('needed repair')
    expect(
      screen.getByRole('checkbox', { name: 'Card animations' }),
    ).toBeChecked()
  })
  it('applies settings in memory and explains when persistence fails', async () => {
    const user = userEvent.setup()
    open()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Full')
    })
    await user.click(screen.getByRole('checkbox', { name: 'Card animations' }))
    await user.click(screen.getByRole('button', { name: 'Save Settings' }))
    expect(screen.getByRole('alert')).toHaveTextContent('could not be saved')
    expect(screen.getByRole('status')).toHaveTextContent('applied for now')
  })
})
