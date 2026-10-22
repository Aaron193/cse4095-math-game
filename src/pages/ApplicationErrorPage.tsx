import { useEffect } from 'react'
import { useRouteError } from 'react-router'
import ErrorNotice from '../components/ErrorNotice'
import { reportDevelopmentError } from '../services/developmentErrors'
export default function ApplicationErrorPage() {
  const error = useRouteError()
  useEffect(
    () => reportDevelopmentError('application page unavailable', error),
    [error],
  )
  return (
    <main>
      <section className="welcome">
        <h1>Let’s try again</h1>
        <ErrorNotice
          message="This page had a problem. Saved practice data will stay in this browser. Try reloading, or return home."
          onRetry={() => window.location.reload()}
        >
          <a className="button button-secondary" href="/">
            Return home
          </a>
        </ErrorNotice>
      </section>
    </main>
  )
}
