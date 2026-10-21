import { Link } from 'react-router'

interface PlaceholderPageProps {
  title: string
  description: string
}

export default function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <section className="welcome" aria-labelledby="page-heading">
      <p className="eyebrow">Coming soon</p>
      <h1 id="page-heading">{title}</h1>
      <p>{description}</p>
      <Link className="button" to="/">
        Back to home
      </Link>
    </section>
  )
}
