import { Link } from 'react-router'
import Navigation from './Navigation'

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-content">
        <Link className="app-title" to="/">
          Math Practice App
        </Link>
        <Navigation />
      </div>
    </header>
  )
}
