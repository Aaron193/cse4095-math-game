import { render, screen, within } from '@testing-library/react'
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

const homeActions = [
  ['Start Practice', '/practice/setup', 'Practice Setup'],
  ['View Statistics', '/statistics', 'Statistics'],
  ['Settings', '/settings', 'Settings'],
] as const

const pageRoutes = [
  ['/practice/setup', 'Practice Setup'],
  ['/practice/session', 'Practice Setup'],
  ['/practice/summary', 'Session Summary'],
  ['/statistics', 'Statistics'],
  ['/settings', 'Settings'],
] as const

describe('home navigation', () => {
  it.each(homeActions)(
    '%s opens %s and keeps the shared layout mounted',
    async (label, path, heading) => {
      const user = userEvent.setup()
      renderApp()
      const header = screen.getByRole('banner')
      const action = within(screen.getByRole('main')).getByRole('link', {
        name: label,
      })
      expect(action).toHaveAttribute('href', path)
      await user.click(action)
      expect(
        screen.getByRole('heading', { level: 1, name: heading }),
      ).toBeInTheDocument()
      expect(screen.getByRole('banner')).toBe(header)
      await user.click(
        screen.getByRole('link', {
          name: 'Back to home',
        }),
      )
      expect(
        screen.getByRole('heading', { level: 1, name: 'Math Practice App' }),
      ).toBeInTheDocument()
    },
  )

  it.each(homeActions)(
    '%s can be reached with Tab and activated with Enter',
    async (label, _path, heading) => {
      const user = userEvent.setup()
      renderApp()
      const action = within(screen.getByRole('main')).getByRole('link', {
        name: label,
      })
      for (
        let index = 0;
        index < 12 && document.activeElement !== action;
        index += 1
      ) {
        await user.tab()
      }
      expect(action).toHaveFocus()
      await user.keyboard('{Enter}')
      expect(
        screen.getByRole('heading', { level: 1, name: heading }),
      ).toBeInTheDocument()
    },
  )
})

describe('application routes', () => {
  it.each(pageRoutes)(
    '%s opens the expected page with a way home',
    async (path, heading) => {
      const user = userEvent.setup()
      renderApp(path)
      expect(
        screen.getByRole('heading', { level: 1, name: heading }),
      ).toBeInTheDocument()
      await user.click(
        screen.getByRole('link', {
          name: path === '/practice/summary' ? 'Return Home' : 'Back to home',
        }),
      )
      expect(
        screen.getByRole('heading', { level: 1, name: 'Math Practice App' }),
      ).toBeInTheDocument()
    },
  )

  it('supports shared header navigation and marks the current page', async () => {
    const user = userEvent.setup()
    renderApp()
    const nav = within(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    )
    expect(nav.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    for (const [label, heading] of [
      ['Practice', 'Practice Setup'],
      ['Statistics', 'Statistics'],
      ['Settings', 'Settings'],
      ['Home', 'Math Practice App'],
    ]) {
      await user.click(nav.getByRole('link', { name: label }))
      expect(
        screen.getByRole('heading', { level: 1, name: heading }),
      ).toBeInTheDocument()
      expect(nav.getByRole('link', { name: label })).toHaveAttribute(
        'aria-current',
        'page',
      )
    }
  })
})
