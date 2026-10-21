import { NavLink, useMatch } from 'react-router'

export default function Navigation() {
  const isPracticeRoute = useMatch('/practice/*') !== null

  return (
    <nav aria-label="Main navigation">
      <ul className="navigation-list">
        <li>
          <NavLink to="/" end>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/practice/setup"
            className={isPracticeRoute ? 'active' : undefined}
          >
            Practice
          </NavLink>
        </li>
        <li>
          <NavLink to="/statistics">Statistics</NavLink>
        </li>
        <li>
          <NavLink to="/settings">Settings</NavLink>
        </li>
      </ul>
    </nav>
  )
}
