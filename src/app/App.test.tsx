import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App'

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('application shell', () => {
  it('renders the home page inside the shared layout', () => {
    renderApp()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Math Practice App' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeInTheDocument()
  })

  it('lets students return home from an unknown route', async () => {
    const user = userEvent.setup()
    renderApp('/missing-page')
    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Back to home' }))
    expect(
      screen.getByRole('heading', { name: 'Math Practice App' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Page not found' }),
    ).not.toBeInTheDocument()
  })

  it('makes the skip link the first keyboard navigation target', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus()
    expect(
      screen.getByRole('link', { name: 'Skip to content' }),
    ).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })
})
