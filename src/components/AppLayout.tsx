import { Link, Outlet } from 'react-router'

export default function AppLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <nav aria-label="Main navigation">
          <Link className="home-link" to="/">Home</Link>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer>One step at a time. Every step counts.</footer>
    </>
  )
}
