import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../app/App'

function RouteLocation() {
  const { pathname } = useLocation()
  return <output aria-label="Current route">{pathname}</output>
}

function renderSetup(path = '/practice/setup') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <RouteLocation />
    </MemoryRouter>,
  )
}

const operationNames = [
  'Addition (+)',
  'Subtraction (−)',
  'Multiplication (×)',
  'Division (÷)',
]
const difficultyNames = ['Beginner', 'Easy', 'Intermediate', 'Advanced']

async function selectBasicConfiguration(
  user: ReturnType<typeof userEvent.setup>,
) {
  if (
    !(
      screen.getByRole('checkbox', { name: 'Addition (+)' }) as HTMLInputElement
    ).checked
  )
    await user.click(screen.getByRole('checkbox', { name: 'Addition (+)' }))
  await user.click(screen.getByRole('radio', { name: 'Beginner' }))
}

describe('practice configuration controls', () => {
  it('displays all operations, difficulty descriptions, and a default of 10 questions', () => {
    renderSetup()
    expect(screen.getAllByRole('checkbox')).toHaveLength(4)
    for (const name of operationNames)
      expect(
        (screen.getByRole('checkbox', { name }) as HTMLInputElement).checked,
      ).toBe(name === 'Addition (+)')
    for (const name of difficultyNames) {
      expect(
        (screen.getByRole('radio', { name }) as HTMLInputElement).checked,
      ).toBe(name === 'Beginner')
      expect(screen.getByRole('radio', { name })).toHaveAccessibleDescription()
    }
    expect(screen.getByRole('radio', { name: '10 questions' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeEnabled()
    expect(
      within(screen.getByRole('main')).getByRole('status'),
    ).toHaveTextContent('Ready when you are!')
  })

  it('allows multiple operations and independent deselection', async () => {
    const user = userEvent.setup()
    renderSetup()
    const addition = screen.getByRole('checkbox', { name: 'Addition (+)' })
    const division = screen.getByRole('checkbox', { name: 'Division (÷)' })
    await user.click(division)
    expect(addition).toBeChecked()
    expect(division).toBeChecked()
    await user.click(addition)
    expect(addition).not.toBeChecked()
    expect(division).toBeChecked()
  })

  it('Select All selects each operation and can be used repeatedly', async () => {
    const user = userEvent.setup()
    renderSetup()
    await user.click(screen.getByRole('button', { name: 'Select All' }))
    await user.click(screen.getByRole('button', { name: 'Select All' }))
    for (const checkbox of screen.getAllByRole('checkbox'))
      expect(checkbox).toBeChecked()
    await user.click(screen.getByRole('checkbox', { name: 'Division (÷)' }))
    expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(3)
  })

  it.each(difficultyNames)(
    'selects only %s when changing difficulty',
    async (name) => {
      const user = userEvent.setup()
      renderSetup()
      await user.click(
        screen.getByRole('radio', {
          name: name === 'Beginner' ? 'Advanced' : 'Beginner',
        }),
      )
      await user.click(screen.getByRole('radio', { name }))
      const group = within(
        screen.getByRole('group', { name: 'Choose your difficulty' }),
      )
      expect(group.getAllByRole('radio', { checked: true })).toHaveLength(1)
      expect(group.getByRole('radio', { name })).toBeChecked()
    },
  )

  it.each([
    '5 questions',
    '10 questions',
    '20 questions',
    'Continuous practice',
  ])('selects only %s as the practice length', async (name) => {
    const user = userEvent.setup()
    renderSetup()
    await user.click(screen.getByRole('radio', { name }))
    const group = within(
      screen.getByRole('group', { name: 'Choose your practice length' }),
    )
    expect(group.getAllByRole('radio', { checked: true })).toHaveLength(1)
    expect(group.getByRole('radio', { name })).toBeChecked()
  })

  it('supports native checkbox and radio keyboard controls', async () => {
    const user = userEvent.setup()
    renderSetup()
    const addition = screen.getByRole('checkbox', { name: 'Addition (+)' })
    addition.focus()
    await user.keyboard(' ')
    expect(addition).not.toBeChecked()
    await user.keyboard(' ')
    expect(addition).toBeChecked()
    await user.tab()
    expect(
      screen.getByRole('checkbox', { name: 'Subtraction (−)' }),
    ).toHaveFocus()
    await user.keyboard(' ')
    expect(
      screen.getByRole('checkbox', { name: 'Subtraction (−)' }),
    ).toBeChecked()
    screen.getByRole('radio', { name: 'Beginner' }).focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Easy' })).toBeChecked()
    screen.getByRole('radio', { name: '10 questions' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: '20 questions' })).toBeChecked()
  })
})

describe('configuration validation and handoff', () => {
  it('requires an operation even after a difficulty is selected', async () => {
    const user = userEvent.setup()
    renderSetup()
    await user.click(screen.getByRole('checkbox', { name: 'Addition (+)' }))
    await user.click(screen.getByRole('radio', { name: 'Easy' }))
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeDisabled()
    expect(
      within(screen.getByRole('main')).getByRole('status'),
    ).toHaveTextContent('Choose at least one operation.')
  })

  it('starts with exactly one valid default difficulty, which can be changed', async () => {
    const user = userEvent.setup()
    renderSetup()
    expect(screen.getByRole('radio', { name: 'Beginner' })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: 'Easy' }))
    expect(screen.getByRole('radio', { name: 'Beginner' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Easy' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeEnabled()
  })

  it('enables valid submission and disables it again when the last operation is cleared', async () => {
    const user = userEvent.setup()
    renderSetup()
    await selectBasicConfiguration(user)
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeEnabled()
    expect(
      within(screen.getByRole('main')).getByRole('status'),
    ).toHaveTextContent('Ready when you are!')
    await user.click(screen.getByRole('checkbox', { name: 'Addition (+)' }))
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeDisabled()
  })

  it('guards invalid submission even if a submit event bypasses the disabled button', () => {
    renderSetup()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Addition (+)' }))
    fireEvent.submit(
      screen.getByRole('form', { name: 'Practice configuration' }),
    )
    expect(screen.getByLabelText('Current route')).toHaveTextContent(
      '/practice/setup',
    )
  })

  it.each([
    '5 questions',
    '10 questions',
    '20 questions',
    'Continuous practice',
  ])(
    'passes multiple operations, difficulty, and %s to the session route',
    async (length) => {
      const user = userEvent.setup()
      renderSetup()
      await user.click(screen.getByRole('checkbox', { name: 'Addition (+)' }))
      await user.click(
        screen.getByRole('checkbox', { name: 'Subtraction (−)' }),
      )
      await user.click(
        screen.getByRole('checkbox', { name: 'Multiplication (×)' }),
      )
      await user.click(screen.getByRole('radio', { name: 'Advanced' }))
      await user.click(screen.getByRole('radio', { name: length }))
      await user.click(screen.getByRole('button', { name: 'Start Session' }))
      expect(screen.getByLabelText('Current route')).toHaveTextContent(
        '/practice/session',
      )
      expect(
        screen.getByRole('heading', { name: 'Practice Session' }),
      ).toBeInTheDocument()
      expect(
        screen.getByText('Subtraction, Multiplication'),
      ).toBeInTheDocument()
      expect(screen.getByText('Advanced')).toBeInTheDocument()
      expect(screen.getByText(length)).toBeInTheDocument()
    },
  )

  it('hands off Select All and restores the submitted configuration when returning to setup', async () => {
    const user = userEvent.setup()
    renderSetup()
    await user.click(screen.getByRole('button', { name: 'Select All' }))
    await user.click(screen.getByRole('radio', { name: 'Intermediate' }))
    await user.click(screen.getByRole('radio', { name: 'Continuous practice' }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    expect(
      screen.getByText('Addition, Subtraction, Multiplication, Division'),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('link', { name: 'Change practice choices' }),
    )
    for (const checkbox of screen.getAllByRole('checkbox'))
      expect(checkbox).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Intermediate' })).toBeChecked()
    expect(
      screen.getByRole('radio', { name: 'Continuous practice' }),
    ).toBeChecked()
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeEnabled()
  })

  it('redirects to setup when the session route has no session', async () => {
    renderSetup('/practice/session')
    expect(screen.getByLabelText('Current route')).toHaveTextContent(
      '/practice/setup',
    )
    expect(
      screen.getByRole('heading', { name: 'Practice Setup' }),
    ).toBeInTheDocument()
  })
})
