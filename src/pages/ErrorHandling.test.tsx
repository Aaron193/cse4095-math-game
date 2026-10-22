import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../app/App'
import ApplicationErrorPage from './ApplicationErrorPage'
import { readStorage, STORAGE_KEY } from '../services/storageService'
import TestRouter from '../test/TestRouter'
function open(path = '/practice/setup') {
  return render(
    <TestRouter initialEntries={[path]}>
      <App />
    </TestRouter>,
  )
}
afterEach(() => vi.restoreAllMocks())
describe('friendly recovery actions', () => {
  it('explains missing practice data with a working setup page', () => {
    open('/practice/session')
    expect(
      screen.getByRole('heading', { name: 'Practice Setup' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/no unfinished session to continue/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeEnabled()
  })
  it('recovers malformed storage without a blank screen or deleting unrelated keys', () => {
    localStorage.setItem(STORAGE_KEY, 'broken JSON')
    localStorage.setItem('unrelated', 'keep')
    open('/')
    expect(
      screen.getByRole('heading', { name: 'Math Practice App' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('could not be read')
    expect(localStorage.getItem('unrelated')).toBe('keep')
  })
  it('keeps the page usable after a failed session start and allows a later retry', async () => {
    const user = userEvent.setup()
    open()
    const uuid = vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
      throw new Error('technical secret')
    })
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    expect(
      screen.getByRole('heading', { name: 'Practice Setup' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'couldn’t start practice',
    )
    expect(document.body).not.toHaveTextContent('technical secret')
    uuid.mockRestore()
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    expect(
      screen.getByRole('heading', { name: 'Practice Session' }),
    ).toBeInTheDocument()
  })
  it('preserves in-memory attempts through quota failure and retries saving the current snapshot once', async () => {
    const user = userEvent.setup()
    open()
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    const write = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('Full')
      })
    await user.click(screen.getAllByRole('button', { name: /^Answer / })[0])
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
    expect(screen.getByRole('alert')).toHaveTextContent('could not be saved')
    expect(screen.getByText('Question 2 of 10')).toBeInTheDocument()
    write.mockRestore()
    await user.click(screen.getByRole('button', { name: 'Try saving again' }))
    expect(readStorage().data.statistics.attempted).toBe(1)
    expect(readStorage().data.mistakePatterns[0].incorrectCount).toBe(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('handles a failure to create an attempt without losing earlier results or locking the card', async () => {
    const user = userEvent.setup()
    open()
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    await user.click(screen.getAllByRole('button', { name: /^Answer / })[0])
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    const uuid = vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
      throw new Error('unavailable')
    })
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'answer was not recorded',
    )
    expect(readStorage().data.statistics.attempted).toBe(0)
    uuid.mockRestore()
    await user.click(
      screen.getByRole('button', { name: 'Try loading a question again' }),
    )
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('shows a route error boundary with recovery actions rather than a technical stack trace', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function Broken(): never {
      throw new Error('private technical details')
    }
    const router = createMemoryRouter([
      {
        path: '*',
        element: <Broken />,
        errorElement: <ApplicationErrorPage />,
      },
    ])
    render(<RouterProvider router={router} />)
    expect(
      screen.getByRole('heading', { name: 'Let’s try again' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(document.body).not.toHaveTextContent('private technical details')
  })
})
