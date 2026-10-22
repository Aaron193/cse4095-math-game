import { Link, Outlet, useLocation } from 'react-router'
import { useSession } from '../app/practiceSessionContext'
import { useAppData } from '../app/appDataContext'
import ErrorNotice from './ErrorNotice'
import RouteFocus from './layout/RouteFocus'
import Header from './layout/Header'
import PageContainer from './layout/PageContainer'

export default function AppLayout() {
  const { warning, retrySaving, canSave } = useAppData()
  const { state } = useSession()
  const { pathname } = useLocation()
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <RouteFocus />
      <PageContainer>
        {warning && (
          <ErrorNotice
            title="Saving your progress"
            message={warning}
            onRetry={canSave ? retrySaving : undefined}
            retryLabel="Try saving again"
          />
        )}
        {state?.isActive && pathname !== '/practice/session' && (
          <aside className="resume-notice" aria-label="Unfinished practice">
            <p>You have an unfinished practice session.</p>
            <Link className="button button-secondary" to="/practice/session">
              Continue Practice
            </Link>
          </aside>
        )}
        <Outlet />
      </PageContainer>
      <footer>One step at a time. Every step counts.</footer>
    </>
  )
}
