import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <section className="welcome" aria-labelledby="not-found-heading">
      <h1 id="not-found-heading">Page not found</h1>
      <p>Let’s head back to the start.</p>
      <Link to="/">Back to home</Link>
    </section>
  )
}
