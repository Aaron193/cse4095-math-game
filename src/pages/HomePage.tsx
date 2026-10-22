import { Link } from 'react-router'

export default function HomePage() {
  return (
    <section className="welcome" aria-labelledby="welcome-heading">
      <p className="eyebrow">Welcome, math explorer!</p>
      <h1 id="welcome-heading">Math Practice App</h1>
      <p>A welcoming place to grow your math skills.</p>
      <p>
        Explore addition, subtraction, multiplication, and division. Every
        little step helps you learn!
      </p>
      <div className="home-actions">
        <Link className="button" to="/practice/setup">
          Start Practice
        </Link>
        <Link className="button button-secondary" to="/statistics">
          View Statistics
        </Link>
        <Link className="button button-tertiary" to="/settings">
          Settings
        </Link>
      </div>
      <p className="home-note">
        Pick your pace, practice a little, and watch your confidence grow. Your
        progress stays in this browser.
      </p>
    </section>
  )
}
