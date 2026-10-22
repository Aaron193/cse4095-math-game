import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TestRouter from '../test/TestRouter'
import { describe, expect, it } from 'vitest'
import App from '../app/App'
import {
  emptyData,
  readStorage,
  writeStorage,
} from '../services/storageService'

describe('practice feedback preference', () => {
  it('shows support after an accepted miss and disables it through saved settings', async () => {
    const user = userEvent.setup()
    const first = render(
      <TestRouter initialEntries={['/practice/setup']}>
        <App />
      </TestRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    expect(
      screen.getByText('Take your time. Every practice step counts!'),
    ).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: /^Answer / })[0])
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
    expect(document.querySelector('.practice-feedback')).not.toHaveTextContent(
      'Take your time. Every practice step counts!',
    )
    expect(readStorage().data.statistics.attempted).toBe(1)
    first.unmount()
    const data = emptyData()
    data.settings.feedbackEnabled = false
    writeStorage(data)
    render(
      <TestRouter initialEntries={['/practice/setup']}>
        <App />
      </TestRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    expect(document.querySelector('.practice-feedback')).toBeNull()
  })
})
