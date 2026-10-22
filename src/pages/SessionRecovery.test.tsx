import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../app/App'
import { readStorage } from '../services/storageService'
function open(path = '/practice/setup') {
  const router = createMemoryRouter([{ path: '*', element: <App /> }], {
    initialEntries: [path],
  })
  return { ...render(<RouterProvider router={router} />), router }
}
afterEach(() => vi.restoreAllMocks())
async function start(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Start Session' }))
}
describe('recovery and navigation safety', () => {
  it('restores a selected/flipped unanswered card after remount and records its result only once', async () => {
    const user = userEvent.setup(),
      first = open()
    await start(user)
    await user.click(screen.getAllByRole('button', { name: /^Answer / })[1])
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    const saved = readStorage().data.activeSession!
    first.unmount()
    open('/practice/session')
    expect(
      screen.getByRole('heading', { name: 'Answer revealed' }),
    ).toBeInTheDocument()
    expect(readStorage().data.activeSession).toEqual(saved)
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
    expect(readStorage().data.attempts).toHaveLength(1)
    expect(screen.getByText('Question 2 of 10')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
  })
  it('lets students stay, save and leave, resume, or end and leave without another prompt', async () => {
    const user = userEvent.setup(),
      first = open()
    await start(user)
    await user.click(screen.getAllByRole('button', { name: /^Answer / })[0])
    await user.click(screen.getByRole('link', { name: 'Back to home' }))
    expect(
      screen.getByRole('dialog', { name: 'Leave your practice?' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Keep Practicing' }),
    ).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Keep Practicing' }))
    expect(first.router.state.location.pathname).toBe('/practice/session')
    await user.click(screen.getByRole('link', { name: 'Back to home' }))
    await user.click(screen.getByRole('button', { name: 'Save and Leave' }))
    expect(first.router.state.location.pathname).toBe('/')
    await user.click(screen.getByRole('link', { name: 'Continue Practice' }))
    expect(
      screen.getAllByRole('button', { name: /^Answer / })[0],
    ).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('link', { name: 'Back to home' }))
    await user.click(
      screen.getByRole('button', { name: 'End Session and Leave' }),
    )
    expect(first.router.state.location.pathname).toBe('/')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(readStorage().data.activeSession).toBeNull()
    first.unmount()
    open('/practice/session')
    expect(
      screen.getByRole('heading', { name: 'Session Summary' }),
    ).toBeInTheDocument()
  })
  it('blocks browser-style Back, supports canceling the dialog, and warns on document unload only while active', async () => {
    const user = userEvent.setup(),
      { router } = open()
    await start(user)
    const unload = new Event('beforeunload', { cancelable: true })
    expect(window.dispatchEvent(unload)).toBe(false)
    await act(async () => {
      await router.navigate(-1)
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { bubbles: true, cancelable: true }),
    )
    expect(router.state.location.pathname).toBe('/practice/session')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    expect(
      screen.getByRole('heading', { name: 'Session Summary' }),
    ).toBeInTheDocument()
    expect(
      window.dispatchEvent(new Event('beforeunload', { cancelable: true })),
    ).toBe(true)
  })
})
